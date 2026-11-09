const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const DATA_DIR = path.join(__dirname, '../../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'wpp_alert_settings.json');

// Ensure data folder exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[WPPAlert] Could not create data directory:', e.message);
}

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  channels: {
    email: {
      enabled: false,
      recipient: 'dynamicsajjan@gmail.com'
    },
    sms: {
      enabled: false,
      recipient: ''
    },
    push: {
      enabled: true
    }
  },
  appUrl: process.env.APP_URL || 'https://bgsworkspace.vercel.app/',
  lastAlertIncidentId: null,
  lastAlertSentAt: null,
  alertHistory: []
};

let alertSettings = { ...DEFAULT_SETTINGS };
let activeIncidentId = null;

// Load persisted settings
const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      alertSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        channels: {
          ...DEFAULT_SETTINGS.channels,
          ...(parsed.channels || {})
        }
      };
      return;
    }
  } catch (e) {
    console.warn('[WPPAlert] Could not read alert settings:', e.message);
  }
  alertSettings = { ...DEFAULT_SETTINGS };
};

// Save persisted settings
const saveSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(alertSettings, null, 2), 'utf8');
  } catch (e) {
    console.warn('[WPPAlert] Could not save alert settings:', e.message);
  }
};

loadSettings();

// Inspect Provider configuration status
const getProviderConfig = () => {
  const emailConfigured = Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.SENDGRID_API_KEY
  );

  const missingEmail = [];
  if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) missingEmail.push('SMTP_HOST');
  if (!process.env.SMTP_USER && !process.env.SENDGRID_API_KEY) missingEmail.push('SMTP_USER');
  if (!process.env.SMTP_PASS && !process.env.SENDGRID_API_KEY) missingEmail.push('SMTP_PASS');

  const smsConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  const missingSms = [];
  if (!process.env.TWILIO_ACCOUNT_SID) missingSms.push('TWILIO_ACCOUNT_SID');
  if (!process.env.TWILIO_AUTH_TOKEN) missingSms.push('TWILIO_AUTH_TOKEN');
  if (!process.env.TWILIO_PHONE_NUMBER) missingSms.push('TWILIO_PHONE_NUMBER');

  return {
    email: {
      configured: emailConfigured,
      missing: missingEmail,
      provider: process.env.SENDGRID_API_KEY ? 'SendGrid' : 'SMTP'
    },
    sms: {
      configured: smsConfigured,
      missing: missingSms,
      provider: 'Twilio'
    },
    push: {
      configured: true,
      missing: [],
      provider: 'Socket.IO & Web Notification API'
    }
  };
};

// Send Email via Nodemailer (SMTP) or SendGrid
const deliverEmail = async (recipient, subject, text, html) => {
  if (!recipient || !recipient.trim()) {
    throw new Error('Recipient email address is required');
  }

  const prov = getProviderConfig().email;
  if (!prov.configured) {
    throw new Error(`Email provider unconfigured. Missing: ${prov.missing.join(', ')}`);
  }

  if (process.env.SENDGRID_API_KEY) {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: recipient.trim() }] }],
        from: { email: process.env.SMTP_FROM || 'alerts@bgsworkspace.vercel.app', name: 'BGS WorkHub Alerts' },
        subject,
        content: [{ type: 'text/html', value: html || `<p>${text.replace(/\n/g, '<br/>')}</p>` }]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`SendGrid API error (${res.status}): ${errText}`);
    }
    return { success: true, provider: 'SendGrid' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `"BGS WorkHub Alerts" <${process.env.SMTP_USER}>`,
    to: recipient.trim(),
    subject,
    text,
    html: html || `<p>${text.replace(/\n/g, '<br/>')}</p>`
  });

  return { success: true, messageId: info.messageId, provider: 'SMTP' };
};

// Send SMS via Twilio REST API
const deliverSms = async (recipient, text) => {
  if (!recipient || !recipient.trim()) {
    throw new Error('Recipient phone number is required');
  }

  const prov = getProviderConfig().sms;
  if (!prov.configured) {
    throw new Error(`SMS provider unconfigured. Missing: ${prov.missing.join(', ')}`);
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', recipient.trim());
  params.append('From', from);
  params.append('Body', text);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS API error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  return { success: true, sid: json.sid, provider: 'Twilio' };
};

// Deliver Push & In-App Alert via Socket.IO & Persistent Admin Notification
const deliverPush = async (title, message, payload = {}) => {
  let inAppNotification = null;
  try {
    const dataService = require('../seed/dataService');
    inAppNotification = await dataService.createNotification({
      recipientRole: 'admin',
      title: title || '⚠️ WhatsApp Disconnected',
      message: message || 'WhatsApp service has disconnected. Reconnection in progress.',
      link: 'whatsapp'
    });
  } catch (e) {
    console.warn('[WPPAlert] In-app notification creation notice:', e.message);
  }

  try {
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.emit('wpp_disconnection_alert', {
        title,
        message,
        timestamp: new Date().toISOString(),
        url: alertSettings.appUrl,
        ...payload
      });
    }
  } catch (e) {
    // Socket not ready
  }

  return { success: true, notificationId: inAppNotification?.id || null, provider: 'Socket.IO & In-App' };
};

// Record alert execution in history
const recordHistory = ({ incidentId, channel, recipient, status, error, summary }) => {
  const item = {
    id: `alt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    incidentId: incidentId || 'manual-test',
    channel,
    recipient: recipient || 'Admin Dashboard',
    status, // 'delivered' | 'failed' | 'skipped'
    error: error || null,
    summary,
    timestamp: new Date().toISOString()
  };

  alertSettings.alertHistory.unshift(item);
  if (alertSettings.alertHistory.length > 50) {
    alertSettings.alertHistory = alertSettings.alertHistory.slice(0, 50);
  }
  saveSettings();
  return item;
};

// Trigger alert on disconnection event
const onDisconnect = async ({ incidentDetails = {} } = {}) => {
  if (!alertSettings.enabled) {
    console.log('[WPPAlert] Alerts are globally disabled in settings. Skipping.');
    return;
  }

  // Rate limiting / deduplication: 1 alert per disconnection incident
  if (activeIncidentId) {
    console.log(`[WPPAlert] Disconnection alert already dispatched for active incident "${activeIncidentId}". Skipping duplicate.`);
    return;
  }

  activeIncidentId = `inc-${Date.now()}`;
  alertSettings.lastAlertIncidentId = activeIncidentId;
  alertSettings.lastAlertSentAt = new Date().toISOString();
  saveSettings();

  console.log(`[WPPAlert] New disconnection incident detected: ${activeIncidentId}. Dispatching alerts...`);

  const dashboardUrl = alertSettings.appUrl || 'https://bgsworkspace.vercel.app/';
  const subject = '⚠️ Alert: WhatsApp Notification Service Disconnected - BGS WorkHub';
  const alertText = 
    `WhatsApp Notification Service Alert\n\n` +
    `• Incident: ${activeIncidentId}\n` +
    `• Status: DISCONNECTED\n` +
    `• Notice: Queued messages are being retained safely in durable storage.\n` +
    `• Action: Automatic background reconnection is being attempted with exponential backoff.\n` +
    `• Dashboard Link: ${dashboardUrl}\n\n` +
    `You can monitor the live session status and message queue directly from the Admin Dashboard.`;

  const alertHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="background-color: #fee2e2; color: #dc2626; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Service Alert</span>
      </div>
      <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px;">WhatsApp Notification Service Disconnected</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
        The automated WhatsApp delivery session on <strong>BGS WorkHub</strong> has disconnected unexpectedly.
      </p>
      <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #334155;"><strong>Incident ID:</strong> ${activeIncidentId}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #334155;"><strong>Queue Protection:</strong> All pending work requests, meetings, and notifications are retained in the durable store.</p>
        <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Recovery:</strong> Automatic background reconnection is running with bounded exponential backoff.</p>
      </div>
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: bold; font-size: 13px; border-radius: 8px;">Open WhatsApp Service Dashboard</a>
    </div>
  `;

  const results = {};
  const provConfig = getProviderConfig();

  // 1. Email Alert
  if (alertSettings.channels.email?.enabled) {
    const recipient = alertSettings.channels.email.recipient;
    if (provConfig.email.configured) {
      try {
        await deliverEmail(recipient, subject, alertText, alertHtml);
        results.email = { status: 'delivered', recipient };
        recordHistory({ incidentId: activeIncidentId, channel: 'email', recipient, status: 'delivered', summary: 'Disconnection alert email delivered' });
      } catch (err) {
        results.email = { status: 'failed', error: err.message };
        recordHistory({ incidentId: activeIncidentId, channel: 'email', recipient, status: 'failed', error: err.message, summary: 'Email delivery failed' });
      }
    } else {
      results.email = { status: 'skipped', error: 'Setup required' };
      recordHistory({ incidentId: activeIncidentId, channel: 'email', recipient, status: 'skipped', error: 'Setup required', summary: 'Email channel skipped: missing provider configuration' });
    }
  }

  // 2. SMS Alert
  if (alertSettings.channels.sms?.enabled) {
    const recipient = alertSettings.channels.sms.recipient;
    if (provConfig.sms.configured) {
      try {
        const smsBody = `[BGS WorkHub Alert] WhatsApp session disconnected. Auto-reconnecting. Queued messages retained. View: ${dashboardUrl}`;
        await deliverSms(recipient, smsBody);
        results.sms = { status: 'delivered', recipient };
        recordHistory({ incidentId: activeIncidentId, channel: 'sms', recipient, status: 'delivered', summary: 'Disconnection alert SMS delivered' });
      } catch (err) {
        results.sms = { status: 'failed', error: err.message };
        recordHistory({ incidentId: activeIncidentId, channel: 'sms', recipient, status: 'failed', error: err.message, summary: 'SMS delivery failed' });
      }
    } else {
      results.sms = { status: 'skipped', error: 'Setup required' };
      recordHistory({ incidentId: activeIncidentId, channel: 'sms', recipient, status: 'skipped', error: 'Setup required', summary: 'SMS channel skipped: missing provider configuration' });
    }
  }

  // 3. Push Alert
  if (alertSettings.channels.push?.enabled) {
    try {
      await deliverPush(
        '⚠️ WhatsApp Service Disconnected',
        'Automatic reconnection is in progress. Queued messages are retained.',
        { incidentId: activeIncidentId }
      );
      results.push = { status: 'delivered' };
      recordHistory({ incidentId: activeIncidentId, channel: 'push', recipient: 'Admin Dashboard', status: 'delivered', summary: 'In-app & push alert broadcasted' });
    } catch (err) {
      results.push = { status: 'failed', error: err.message };
      recordHistory({ incidentId: activeIncidentId, channel: 'push', recipient: 'Admin Dashboard', status: 'failed', error: err.message, summary: 'Push delivery failed' });
    }
  }

  return results;
};

// Reset active incident when session connects successfully
const onConnect = () => {
  if (activeIncidentId) {
    console.log(`[WPPAlert] WhatsApp reconnected successfully. Resolving incident "${activeIncidentId}".`);
    activeIncidentId = null;
  }
};

// Alert when human intervention is needed (e.g. fresh QR scan)
const onActionRequired = async ({ reason = 'QR code scan required' } = {}) => {
  if (!alertSettings.enabled) return;

  const title = 'Action Required: Scan WhatsApp QR Code';
  const message = `Manual intervention needed for WhatsApp Service: ${reason}. Please sign in to scan the QR code.`;

  try {
    await deliverPush(title, message, { actionRequired: true, reason });
  } catch (e) {
    // ignore
  }

  const prov = getProviderConfig();
  if (alertSettings.channels.email?.enabled && prov.email.configured) {
    try {
      await deliverEmail(
        alertSettings.channels.email.recipient,
        `⚠️ ${title} - BGS WorkHub`,
        message,
        `<p>${message}</p><p><a href="${alertSettings.appUrl}">Open Dashboard</a></p>`
      );
    } catch (e) {
      console.warn('[WPPAlert] Action required email warning:', e.message);
    }
  }
};

// Send a test alert to verify settings and configuration
const sendTestAlert = async (channel = 'all') => {
  const dashboardUrl = alertSettings.appUrl || 'https://bgsworkspace.vercel.app/';
  const provConfig = getProviderConfig();
  const testResults = {};

  const testTitle = '🔔 Test Alert: WhatsApp Disconnection Monitor';
  const testMsg = `This is a test alert from BGS WorkHub WhatsApp Notification Monitor. Your alert channel is functioning properly.\nDashboard: ${dashboardUrl}`;

  // 1. Email test
  if (channel === 'email' || channel === 'all') {
    const recipient = alertSettings.channels.email?.recipient;
    if (!provConfig.email.configured) {
      testResults.email = {
        success: false,
        error: `Setup required. Missing environment variables: ${provConfig.email.missing.join(', ')}`,
        missing: provConfig.email.missing
      };
      recordHistory({ channel: 'email', recipient, status: 'failed', error: testResults.email.error, summary: 'Test email failed: setup required' });
    } else {
      try {
        await deliverEmail(recipient, testTitle, testMsg, `<p><strong>${testTitle}</strong></p><p>${testMsg}</p>`);
        testResults.email = { success: true, recipient, message: 'Test email sent successfully' };
        recordHistory({ channel: 'email', recipient, status: 'delivered', summary: 'Test email sent successfully' });
      } catch (err) {
        testResults.email = { success: false, error: err.message };
        recordHistory({ channel: 'email', recipient, status: 'failed', error: err.message, summary: 'Test email failed' });
      }
    }
  }

  // 2. SMS test
  if (channel === 'sms' || channel === 'all') {
    const recipient = alertSettings.channels.sms?.recipient;
    if (!provConfig.sms.configured) {
      testResults.sms = {
        success: false,
        error: `Setup required. Missing environment variables: ${provConfig.sms.missing.join(', ')}`,
        missing: provConfig.sms.missing
      };
      recordHistory({ channel: 'sms', recipient, status: 'failed', error: testResults.sms.error, summary: 'Test SMS failed: setup required' });
    } else {
      try {
        await deliverSms(recipient, `[BGS WorkHub] Test Alert: WhatsApp notification monitor is active. Dashboard: ${dashboardUrl}`);
        testResults.sms = { success: true, recipient, message: 'Test SMS sent successfully' };
        recordHistory({ channel: 'sms', recipient, status: 'delivered', summary: 'Test SMS sent successfully' });
      } catch (err) {
        testResults.sms = { success: false, error: err.message };
        recordHistory({ channel: 'sms', recipient, status: 'failed', error: err.message, summary: 'Test SMS failed' });
      }
    }
  }

  // 3. Push test
  if (channel === 'push' || channel === 'all') {
    try {
      await deliverPush(testTitle, testMsg, { isTest: true });
      testResults.push = { success: true, message: 'Test push notification broadcasted to dashboard' };
      recordHistory({ channel: 'push', recipient: 'Admin Dashboard', status: 'delivered', summary: 'Test push notification delivered' });
    } catch (err) {
      testResults.push = { success: false, error: err.message };
      recordHistory({ channel: 'push', recipient: 'Admin Dashboard', status: 'failed', error: err.message, summary: 'Test push failed' });
    }
  }

  return {
    success: Object.values(testResults).some(r => r.success),
    results: testResults
  };
};

// Update and persist settings
const updateSettings = (newSettings = {}) => {
  alertSettings = {
    ...alertSettings,
    ...newSettings,
    channels: {
      ...alertSettings.channels,
      ...(newSettings.channels || {})
    }
  };
  saveSettings();
  return getSettingsWithConfig();
};

// Get settings combined with provider availability metadata
const getSettingsWithConfig = () => {
  return {
    ...alertSettings,
    providers: getProviderConfig(),
    activeIncidentId
  };
};

module.exports = {
  getSettingsWithConfig,
  updateSettings,
  sendTestAlert,
  onDisconnect,
  onConnect,
  onActionRequired,
  getProviderConfig
};

