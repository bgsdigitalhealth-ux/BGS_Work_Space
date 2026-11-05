const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  participantEmails: [{
    type: String,
    lowercase: true,
    trim: true,
    required: true
  }],
  lastMessage: {
    text: { type: String, default: '' },
    senderId: { type: String, default: '' },
    senderEmail: { type: String, default: '' },
    senderName: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: 'sent' }
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ participantEmails: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);

