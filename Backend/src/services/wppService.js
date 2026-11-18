const fs = require('fs');
const path = require('path');
const wppAlertService = require('./wppAlertService');

// Storage file for persistent queue & delivery tracking
const DATA_DIR = path.join(__dirname, '../../data');
const QUEUE_FILE = path.join(DATA_DIR, 'wpp_messages.json');

// Session configuration
const SESSION_NAME = process.env.WPP_SESSION_NAME || 'bgs_workhub';

let wppClient = null;
let sessionStatus = 'DISCONNECTED'; // 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ACTION_REQUIRED' | 'QR_READY'
let latestQrCode = null;
let isInitializing = false;
let messageStore = [];

// Error & Diagnostic Tracking
let lastInitError = null;
let lastInitErrorTime = null;

// Reconnection Engine State
let isManualStop = false;
let isReconnecting = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let nextReconnectAt = null;

// Queue Engine State
let isQueueProcessing = false;

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

// Clean up stale Chromium lock files in the session profile directory
const cleanStaleSessionLocks = (sessionName = SESSION_NAME) => {
  try {
    const tokenDir = path.resolve(process.cwd(), 'tokens', sessionName);
    if (fs.existsSync(tokenDir)) {
      const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort'];
      for (const file of lockFiles) {
        const filePath = path.join(tokenDir, file);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[WPPConnect] Removed stale lock file: ${file}`);
          } catch (e) {
            // ignore
          }
        }
      }
    }
  } catch (err) {
    console.warn('[WPPConnect] Notice cleaning stale locks:', err.message);
  }
};

// Check if executable path for Chrome, Edge, or Chromium exists
const getChromeExecutablePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
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
  } else if (process.platform === 'linux') {
    const linuxPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
    // Check Puppeteer cache directories on Render and Linux systems
    const renderCachePaths = [
      process.env.PUPPETEER_CACHE_DIR,
      path.resolve(__dirname, '../../.cache/puppeteer'),
      path.resolve(process.cwd(), '.cache/puppeteer'),
      '/opt/render/project/src/Backend/.cache/puppeteer',
      '/opt/render/project/src/.cache/puppeteer',
      '/opt/render/.cache/puppeteer',
      path.join(process.env.HOME || '/root', '.cache/puppeteer')
    ].filter(Boolean);
    for (const cacheDir of renderCachePaths) {
      if (fs.existsSync(cacheDir)) {
        try {
          const findChromeRecursive = (dir, depth = 0) => {
            if (depth > 6) return null;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const full = path.join(dir, entry.name);
              if (entry.isFile() && (entry.name === 'chrome' || entry.name === 'chromium')) {
                return full;
              }
              if (entry.isDirectory()) {
                const sub = findChromeRecursive(full, depth + 1);
                if (sub) return sub;
              }
            }
            return null;
          };
          const found = findChromeRecursive(cacheDir);
          if (found) return found;
        } catch (e) {
          // ignore
        }
      }
    }
  }
  return undefined;
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

// Clear any existing reconnect timer safely
const clearExistingReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  nextReconnectAt = null;
};

// Schedule background reconnection with bounded exponential backoff & jitter
const scheduleAutoReconnect = () => {
  if (isManualStop) {
    console.log('[WPPConnect] Session deliberately stopped. Skipping auto-reconnect.');
    return;
  }

  if (isClientReady() || isInitializing || isReconnecting) {
    return;
  }

  clearExistingReconnectTimer();

  reconnectAttempts += 1;
  // Bounded exponential backoff: 5s, 7.5s, 11.2s, 16.8s... capped at 120s
  const baseDelay = Math.min(120000, Math.round(5000 * Math.pow(1.5, Math.min(reconnectAttempts - 1, 10))));
  const jitter = Math.floor(Math.random() * 2000); // 0-2000ms jitter
  const totalDelay = baseDelay + jitter;

  nextReconnectAt = new Date(Date.now() + totalDelay).toISOString();
  sessionStatus = 'RECONNECTING';

  console.log(`[WPPConnect] Scheduling background reconnect attempt #${reconnectAttempts} in ${Math.round(totalDelay / 1000)}s...`);
  emitStatus('wpp_status', {
    status: 'RECONNECTING',
    reconnectAttempts,
    nextReconnectInMs: totalDelay,
    session: SESSION_NAME
  });

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    nextReconnectAt = null;
    await executeReconnectAttempt();
  }, totalDelay);
};

// Execute a single reconnection attempt safely
const executeReconnectAttempt = async () => {
  if (isManualStop || isClientReady() || isInitializing) return;

  isReconnecting = true;
  try {
    console.log(`[WPPConnect] Executing reconnect attempt #${reconnectAttempts}...`);
    await initWppSession({ isAutoRetry: true });
  } catch (err) {
    console.warn(`[WPPConnect] Reconnect attempt #${reconnectAttempts} failed:`, err.message);
  } finally {
    isReconnecting = false;
  }
};

// Transition to Action Required when QR scan or human intervention is needed
const handleActionRequired = (qrCode = null, reason = 'QR code scan required') => {
  clearExistingReconnectTimer();
  sessionStatus = 'ACTION_REQUIRED';
  if (qrCode) {
    latestQrCode = qrCode;
  }
  console.log(`[WPPConnect] Status changed to ACTION_REQUIRED: ${reason}`);
  emitStatus('wpp_status', {
    status: 'ACTION_REQUIRED',
    qrCode: latestQrCode,
    reason,
    session: SESSION_NAME
  });
  wppAlertService.onActionRequired({ qrCode: latestQrCode, reason });
};

// Initialize WPPConnect Client Session asynchronously
const initWppSession = async ({ isAutoRetry = false } = {}) => {
  if (wppClient || isInitializing) {
    console.log('[WPPConnect] Session is already initialized or initialization in progress.');
    return;
  }

  isInitializing = true;
  if (!isAutoRetry) {
    sessionStatus = 'CONNECTING';
    emitStatus('wpp_status', { status: 'CONNECTING', session: SESSION_NAME });
  }

  console.log(`[WPPConnect] Starting WPPConnect session: "${SESSION_NAME}"...`);

  // Clean stale lock files from previous unexpected exits
  cleanStaleSessionLocks(SESSION_NAME);

  try {
    const wppconnect = require('@wppconnect-team/wppconnect');
    const executablePath = getChromeExecutablePath();
    console.log(`[WPPConnect] Detected browser executable: ${executablePath || 'Puppeteer bundled default'}`);

    wppClient = await wppconnect.create({
      session: SESSION_NAME,
      autoClose: 0, // Disable auto close timeout so QR code remains available until scanned
      catchQR: (base64Qr, asciiQR, attempts) => {
        latestQrCode = base64Qr;
        lastInitError = null;
        console.log(`[WPPConnect] QR code generated for session "${SESSION_NAME}" (attempt ${attempts})`);
        handleActionRequired(base64Qr, 'QR code scan required to connect session');
      },
      statusFind: (statusSession, session) => {
        console.log(`[WPPConnect] Session status change: ${statusSession}`);

        if (statusSession === 'isLogged' || statusSession === 'inChat' || statusSession === 'chatsAvailable' || statusSession === 'qrReadSuccess') {
          sessionStatus = 'CONNECTED';
          latestQrCode = null;
          lastInitError = null;
          reconnectAttempts = 0;
          clearExistingReconnectTimer();
          wppAlertService.onConnect();
          emitStatus('wpp_status', { status: 'CONNECTED', session });
          // Automatically trigger queued message delivery upon successful login/connection
          setTimeout(() => processPendingQueue(), 2500);
        } else if (statusSession === 'qrReadError' || statusSession === 'autocloseCalled') {
          wppClient = null;
          handleActionRequired(latestQrCode, 'Authentication expired or QR read failed');
        } else if (statusSession === 'browserClose' || statusSession === 'serverClose' || statusSession === 'DISCONNECTED') {
          const wasConnected = isClientReady();
          wppClient = null;
          sessionStatus = 'DISCONNECTED';
          emitStatus('wpp_status', { status: 'DISCONNECTED', session });

          // Disconnection Alert: Notify administrators immediately upon unexpected disconnection
          if (wasConnected && !isManualStop) {
            wppAlertService.onDisconnect({
              incidentDetails: {
                session: SESSION_NAME,
                reason: statusSession,
                timestamp: new Date().toISOString()
              }
            });
          }

          // Trigger automatic background reconnection
          if (!isManualStop) {
            scheduleAutoReconnect();
          }
        } else {
          sessionStatus = statusSession;
          emitStatus('wpp_status', { status: statusSession, session });
        }
      },
      headless: true,
      devtools: false,
      useChrome: false,
      useInsecureChromiumArgs: true,
      debug: false,
      logQR: false,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--mute-audio',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--memory-pressure-off'
      ],
      puppeteerOptions: executablePath ? { executablePath } : {}
    });

    sessionStatus = 'CONNECTED';
    latestQrCode = null;
    lastInitError = null;
    reconnectAttempts = 0;
    clearExistingReconnectTimer();
    console.log(`[WPPConnect] Session "${SESSION_NAME}" is connected and ready!`);
    wppAlertService.onConnect();
    emitStatus('wpp_status', { status: 'CONNECTED', session: SESSION_NAME });
    processPendingQueue();
  } catch (err) {
    wppClient = null;
    sessionStatus = 'DISCONNECTED';
    lastInitError = err.message || String(err);
    lastInitErrorTime = new Date().toISOString();
    console.warn('[WPPConnect] Session initialization notice:', lastInitError);
    emitStatus('wpp_status', {
      status: 'DISCONNECTED',
      error: lastInitError,
      lastError: lastInitError,
      lastErrorTime: lastInitErrorTime,
      session: SESSION_NAME
    });

    // Schedule automatic background reconnection unless Chrome binary itself is absent
    const isMissingChrome =
      lastInitError.includes('Could not find Chrome') ||
      lastInitError.includes('Could not find expected browser') ||
      lastInitError.includes('no open browser');

    if (!isManualStop && !isMissingChrome) {
      scheduleAutoReconnect();
    } else if (isMissingChrome) {
      console.warn('[WPPConnect] Chrome binary not detected on host. WhatsApp messages remain safely queued until Chrome is available.');
    }
  } finally {
    isInitializing = false;
  }
};

// Send single message through WPPConnect or retain in durable queue
const dispatchMessage = async (entry) => {
  const destination = formatWhatsAppNumber(entry.to);
  if (!destination) {
    entry.status = 'failed';
    entry.error = 'Invalid phone number format';
    entry.lastError = 'Invalid phone number format';
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
      entry.lastError = null;
      console.log(`[WPPConnect] Sent message to ${entry.recipientType} (${destination}) for ref ${entry.referenceId}`);
      emitStatus('wpp_message_sent', {
        id: entry.id,
        referenceId: entry.referenceId,
        recipientType: entry.recipientType,
        status: 'sent'
      });
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

// Process all pending messages in queue sequentially with concurrency lock
const processPendingQueue = async () => {
  if (isQueueProcessing) {
    console.log('[WPPConnect] Queue processing is already in progress. Skipping duplicate run.');
    return;
  }

  const pending = messageStore.filter(m => m.status === 'pending' && (m.retries || 0) < 15);
  if (pending.length === 0) return;

  isQueueProcessing = true;
  console.log(`[WPPConnect] Beginning automatic queued-message delivery for ${pending.length} pending items...`);

  try {
    for (const item of pending) {
      // If session disconnects again during delivery, pause sending and retain remaining queue
      if (!isClientReady()) {
        console.warn('[WPPConnect] Session lost during queue processing. Pausing queue delivery until reconnected.');
        break;
      }

      await dispatchMessage(item);
      // Wait 1 second between items to prevent rate limits or race conditions
      await new Promise(res => setTimeout(res, 1000));
    }
  } catch (queueErr) {
    console.warn('[WPPConnect] Error in queue delivery loop:', queueErr.message);
  } finally {
    isQueueProcessing = false;
  }
};

// Manually flush the queue (send pending messages without deleting message log)
const flushPendingQueue = async () => {
  console.log('[WPPConnect] Manual queue flush requested.');
  // Reset retries count for failed/pending messages so they can be re-attempted
  messageStore.forEach(m => {
    if (m.status === 'pending') {
      m.retries = 0;
    }
  });
  saveQueue();

  const count = messageStore.filter(m => m.status === 'pending').length;
  if (!isClientReady()) {
    return {
      success: false,
      message: 'WhatsApp session is not connected. Queued messages will deliver automatically once reconnected.',
      pendingCount: count
    };
  }

  // Trigger processing
  processPendingQueue();
  return {
    success: true,
    message: `Queue flush initiated for ${count} pending message(s).`,
    pendingCount: count
  };
};

// Periodic background check every 30 seconds
setInterval(() => {
  if (isClientReady()) {
    processPendingQueue();
  }
}, 30000);

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
    lastError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  messageStore.push(newEntry);
  saveQueue();

  return await dispatchMessage(newEntry);
};

/**
 * Send WhatsApp notifications to Sender and Receiver for Work Requests, Meetings, and Events
 */
const sendWorkRequestNotifications = async ({
  formType = 'Work Request',
  referenceId,
  senderName = 'Requester',
  senderNumber,
  receiverName = 'Recipient',
  receiverNumber,
  agreedToNotifications = true
}) => {
  if (!agreedToNotifications) {
    console.log(`[WPPConnect] User has not agreed to receive notifications. Skipping WhatsApp delivery.`);
    return { skipped: true, reason: 'Agreement not provided' };
  }

  // Exact templates formatted cleanly
  const senderMessageText = `Dear ${senderName},\nYour ${formType} request has been submitted successfully.\nThank you.`;
  const receiverMessageText = `Dear ${receiverName},\nYou have received a ${formType} request from ${senderName}.\nPlease sign in to your dashboard to review it.`;

  const results = {
    sender: null,
    receiver: null
  };

  try {
    // 1. Sender WhatsApp Notification (confirmation of scheduling/assignment)
    if (senderNumber && String(senderNumber).trim()) {
      results.sender = await enqueueAndSend({
        id: `${referenceId}-sender`,
        referenceId,
        recipientType: 'sender',
        name: senderName,
        to: String(senderNumber).trim(),
        text: senderMessageText,
        formType
      });
    }

    // 2. Receiver WhatsApp Notification (invitation/assignment notification)
    if (receiverNumber && String(receiverNumber).trim()) {
      results.receiver = await enqueueAndSend({
        id: `${referenceId}-receiver`,
        referenceId,
        recipientType: 'receiver',
        name: receiverName,
        to: String(receiverNumber).trim(),
        text: receiverMessageText,
        formType
      });
    }
  } catch (err) {
    console.warn('[WPPConnect] Delivery notice (request saved successfully):', err.message);
  }

  return results;
};

// Get current service status for diagnostics & dashboard
const getServiceStatus = () => {
  const pendingCount = messageStore.filter(m => m.status === 'pending').length;
  const sentCount = messageStore.filter(m => m.status === 'sent').length;

  return {
    session: SESSION_NAME,
    status: sessionStatus,
    isReady: isClientReady(),
    hasQr: Boolean(latestQrCode),
    qrCode: latestQrCode,
    isReconnecting: sessionStatus === 'RECONNECTING',
    reconnectAttempts,
    nextReconnectAt,
    isManualStop,
    lastError: lastInitError,
    lastErrorTime: lastInitErrorTime,
    environment: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      hasCustomChrome: Boolean(getChromeExecutablePath())
    },
    totalMessages: messageStore.length,
    pendingMessages: pendingCount,
    sentMessages: sentCount,
    messages: messageStore.slice(-50).reverse()
  };
};

const getMessages = () => {
  return messageStore.slice(-100).reverse();
};

// Restart WPPConnect Session on demand (manual click handler)
const restartWppSession = async ({ clean = false } = {}) => {
  console.log(`[WPPConnect] Manual restart of WPPConnect session requested: "${SESSION_NAME}" (clean: ${clean})...`);
  isManualStop = false;
  clearExistingReconnectTimer();
  reconnectAttempts = 0;
  lastInitError = null;

  if (wppClient) {
    try {
      await wppClient.close();
    } catch (e) {
      // ignore
    }
    wppClient = null;
  }

  if (clean) {
    cleanStaleSessionLocks(SESSION_NAME);
  }

  isInitializing = false;
  latestQrCode = null;
  sessionStatus = 'RESTARTING';
  emitStatus('wpp_status', { status: 'RESTARTING', session: SESSION_NAME });

  setTimeout(() => {
    initWppSession();
  }, 1000);

  return { success: true, message: 'WPPConnect session restart initiated' };
};

// Deliberately stop session (prevents auto-reconnect loops)
const stopWppSession = async () => {
  console.log(`[WPPConnect] Stopping WPPConnect session: "${SESSION_NAME}"...`);
  isManualStop = true;
  clearExistingReconnectTimer();

  if (wppClient) {
    try {
      await wppClient.close();
    } catch (e) {
      // ignore
    }
    wppClient = null;
  }

  sessionStatus = 'DISCONNECTED';
  latestQrCode = null;
  emitStatus('wpp_status', { status: 'DISCONNECTED', session: SESSION_NAME, isManualStop: true });
  return { success: true, message: 'WPPConnect session stopped' };
};

module.exports = {
  initWppSession,
  restartWppSession,
  stopWppSession,
  sendWorkRequestNotifications,
  getServiceStatus,
  getMessages,
  formatWhatsAppNumber,
  processPendingQueue,
  flushPendingQueue
};
