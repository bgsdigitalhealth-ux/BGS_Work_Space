const fs = require('fs');
const path = require('path');

// Storage file for persistent queue & delivery tracking
const DATA_DIR = path.join(__dirname, '../../data');
const QUEUE_FILE = path.join(DATA_DIR, 'wpp_messages.json');

// Session configuration
const SESSION_NAME = process.env.WPP_SESSION_NAME || 'bgs_workhub';

let wppClient = null;
let sessionStatus = 'DISCONNECTED';
let latestQrCode = null;
let isInitializing = false;
let messageStore = [];

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[WPPConnect] Could not create data directory:', e.message);
}

// Load persisted message queue
const loadQueue = () => {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const content = fs.readFileSync(QUEUE_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        messageStore = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('[WPPConnect] Could not read message queue:', e.message);
  }
  messageStore = [];
};

// Save persisted message queue
const saveQueue = () => {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(messageStore, null, 2), 'utf8');
  } catch (e) {
    console.warn('[WPPConnect] Could not save message queue:', e.message);
  }
};

loadQueue();

// Socket.IO emitter helper
const emitStatus = (event, data) => {
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.emit(event, data);
    }
  } catch (e) {
    // Socket not ready yet
  }
};

// Format phone number into WhatsApp destination format (<digits>@c.us)
const formatWhatsAppNumber = (rawPhone) => {
  if (!rawPhone) return null;
  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return null;

  // Standard 10-digit Indian numbers without country code -> add 91
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  // If starts with 0 and 11 digits (e.g. 09876543210) -> replace 0 with 91
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = '91' + digits.slice(1);
  }

  return `${digits}@c.us`;
};

// Check if executable path for Chrome or Edge exists
const getChromeExecutablePath = () => {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  if (process.platform === 'win32') {
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of chromePaths) {
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
};

// Initialize WPPConnect Client Session asynchronously
const initWppSession = async () => {
  if (wppClient || isInitializing) return;
  isInitializing = true;
  sessionStatus = 'CONNECTING';

  console.log(`[WPPConnect] Starting WPPConnect session: "${SESSION_NAME}"...`);

  try {
    const wppconnect = require('@wppconnect-team/wppconnect');
    const executablePath = getChromeExecutablePath();

    wppClient = await wppconnect.create({
      session: SESSION_NAME,
      catchQR: (base64Qr, asciiQR, attempts) => {
        latestQrCode = base64Qr;
        sessionStatus = 'QR_READY';
        console.log(`[WPPConnect] QR code generated for session "${SESSION_NAME}" (attempt ${attempts})`);
        emitStatus('wpp_status', { status: 'QR_READY', qrCode: base64Qr, session: SESSION_NAME });
      },
      statusFind: (statusSession, session) => {
        console.log(`[WPPConnect] Session status change: ${statusSession}`);
        sessionStatus = statusSession;
        emitStatus('wpp_status', { status: statusSession, session });
        if (statusSession === 'isLogged' || statusSession === 'inChat' || statusSession === 'qrReadSuccess') {
          latestQrCode = null;
          // Trigger queue retry upon successful login/connection
          setTimeout(() => processPendingQueue(), 3000);
        }
      },
      headless: 'new',
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: false,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      puppeteerOptions: executablePath ? { executablePath } : {}
    });

    sessionStatus = 'CONNECTED';
    console.log(`[WPPConnect] Session "${SESSION_NAME}" is connected and ready!`);
    emitStatus('wpp_status', { status: 'CONNECTED', session: SESSION_NAME });
    processPendingQueue();
  } catch (err) {
    sessionStatus = 'DISCONNECTED';
    console.warn('[WPPConnect] Session initialization notice:', err.message);
    emitStatus('wpp_status', { status: 'DISCONNECTED', error: err.message, session: SESSION_NAME });
  } finally {
    isInitializing = false;
  }
};

// Check if client is authenticated and ready to send
const isClientReady = () => {
  return wppClient !== null && (
    sessionStatus === 'CONNECTED' ||
    sessionStatus === 'isLogged' ||
    sessionStatus === 'inChat' ||
    sessionStatus === 'chatsAvailable'
  );
};

// Send single message through WPPConnect or retain in pending queue
const dispatchMessage = async (entry) => {
  const destination = formatWhatsAppNumber(entry.to);
  if (!destination) {
    entry.status = 'failed';
    entry.error = 'Invalid phone number format';
    entry.updatedAt = new Date().toISOString();
    saveQueue();
    return entry;
  }

  if (isClientReady()) {
    try {
      await wppClient.sendText(destination, entry.text);
      entry.status = 'sent';
      entry.sentAt = new Date().toISOString();
      entry.updatedAt = new Date().toISOString();
      entry.error = null;
      console.log(`[WPPConnect] Sent message to ${entry.recipientType} (${destination}) for ref ${entry.referenceId}`);
      emitStatus('wpp_message_sent', { id: entry.id, referenceId: entry.referenceId, recipientType: entry.recipientType, status: 'sent' });
    } catch (sendErr) {
      console.warn(`[WPPConnect] Error delivering to ${destination}:`, sendErr.message);
      entry.status = 'pending';
      entry.retries = (entry.retries || 0) + 1;
      entry.lastError = sendErr.message;
      entry.updatedAt = new Date().toISOString();
    }
  } else {
    entry.status = 'pending';
    entry.updatedAt = new Date().toISOString();
    console.log(`[WPPConnect] WPP session not ready. Retaining message to ${entry.recipientType} (${entry.to}) in queue for retry.`);
  }

  saveQueue();
  return entry;
};

// Process all pending messages in queue
const processPendingQueue = async () => {
  const pending = messageStore.filter(m => m.status === 'pending' && (m.retries || 0) < 10);
  if (pending.length === 0) return;

  console.log(`[WPPConnect] Processing ${pending.length} pending WhatsApp message(s)...`);
  for (const item of pending) {
    await dispatchMessage(item);
  }
};

// Background retry worker every 25 seconds
setInterval(() => {
  if (isClientReady()) {
    processPendingQueue();
  }
}, 25000);

/**
 * Enqueue and send work request notification with deduplication
 */
const enqueueAndSend = async ({ id, referenceId, recipientType, name, to, text, formType }) => {
  // Check for duplicate submission
  const existing = messageStore.find(m => m.id === id || (m.referenceId === referenceId && m.recipientType === recipientType));
  if (existing) {
    if (existing.status === 'sent') {
      console.log(`[WPPConnect] Duplicate prevented: ${id} already sent.`);
      return { ...existing, skipped: true, reason: 'Duplicate already sent' };
    }
    if (existing.status === 'pending') {
      console.log(`[WPPConnect] Duplicate prevented: ${id} already in pending retry queue.`);
      return { ...existing, skipped: true, reason: 'Already queued for retry' };
    }
  }

  const newEntry = {
    id: id || `${referenceId}-${recipientType}`,
    referenceId,
    recipientType,
    name,
    to,
    text,
    formType,
    status: 'pending',
    retries: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  messageStore.push(newEntry);
  saveQueue();

  return await dispatchMessage(newEntry);
};

/**
 * Send WhatsApp notifications to Sender and Receiver for Work Requests
 * (Meeting, Event Organize, General Information)
 */
const sendWorkRequestNotifications = async ({
  formType,
  referenceId,
  senderName,
  senderNumber,
  receiverName,
  receiverNumber,
  agreedToNotifications = true
}) => {
  if (!agreedToNotifications) {
    console.log(`[WPPConnect] User has not agreed to receive notifications. Skipping WhatsApp delivery.`);
    return { skipped: true, reason: 'Agreement not provided' };
  }

  // Exact templates specified by user
  const senderMessageText = `Dear ${senderName},\nYour ${formType} request has been submitted successfully.\nThank you.`;
  const receiverMessageText = `Dear ${receiverName},\nYou have received a ${formType} request from ${senderName}.\nPlease sign in to your dashboard to review it.`;

  const results = {
    sender: null,
    receiver: null
  };

  try {
    // 1. Sender WhatsApp Notification
    if (senderNumber && senderNumber.trim()) {
      results.sender = await enqueueAndSend({
        id: `${referenceId}-sender`,
        referenceId,
        recipientType: 'sender',
        name: senderName,
        to: senderNumber.trim(),
        text: senderMessageText,
        formType
      });
    }

    // 2. Receiver WhatsApp Notification
    if (receiverNumber && receiverNumber.trim()) {
      results.receiver = await enqueueAndSend({
        id: `${referenceId}-receiver`,
        referenceId,
        recipientType: 'receiver',
        name: receiverName,
        to: receiverNumber.trim(),
        text: receiverMessageText,
        formType
      });
    }
  } catch (err) {
    // Keep saved request successful even if WhatsApp delivery fails
    console.warn('[WPPConnect] Delivery warning (request saved successfully):', err.message);
  }

  return results;
};

// Get current service status for diagnostics & dashboard
const getServiceStatus = () => {
  return {
    session: SESSION_NAME,
    status: sessionStatus,
    isReady: isClientReady(),
    hasQr: Boolean(latestQrCode),
    qrCode: latestQrCode,
    totalMessages: messageStore.length,
    pendingMessages: messageStore.filter(m => m.status === 'pending').length,
    sentMessages: messageStore.filter(m => m.status === 'sent').length
  };
};

module.exports = {
  initWppSession,
  sendWorkRequestNotifications,
  getServiceStatus,
  formatWhatsAppNumber,
  processPendingQueue
};

