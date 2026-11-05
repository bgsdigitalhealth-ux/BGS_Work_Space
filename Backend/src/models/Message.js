const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    required: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  senderName: {
    type: String,
    default: 'User'
  },
  senderRole: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recipientName: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  attachment: {
    name: String,
    size: String,
    type: { type: String },
    url: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

