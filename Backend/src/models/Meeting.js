const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  meetingId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['one-to-one', 'one-to-many'],
    default: 'one-to-one'
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  senderNumber: {
    type: String,
    default: '',
    trim: true
  },
  receiverId: {
    type: String,
    default: ''
  },
  receiverName: {
    type: String,
    default: ''
  },
  receiverEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  participants: [{
    id: String,
    name: String,
    email: String,
    role: { type: String, default: 'attendee' }
  }],
  participantEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ['Online', 'Offline'],
    default: 'Online'
  },
  location: {
    type: String,
    default: ''
  },
  joinUrl: {
    type: String,
    default: ''
  },
  purpose: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Upcoming', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  invitationIssued: {
    type: Boolean,
    default: false
  },
  invitation: {
    id: String,
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Accepted', 'Declined'],
      default: 'Sent'
    },
    joinUrl: String,
    issuedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);

