const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'user', 'all'],
    default: 'user'
  },
  recipientUserId: {
    type: String,
    default: null
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  timestamp: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
