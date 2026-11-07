const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  requestedBy: {
    type: String,
    default: 'Team Member'
  },
  userId: {
    type: String,
    default: 'usr-member'
  },
  receiverId: {
    type: String,
    default: ''
  },
  referenceId: {
    type: String,
    default: ''
  },
  formType: {
    type: String,
    default: ''
  },
  senderEmail: {
    type: String,
    default: ''
  },
  senderNumber: {
    type: String,
    default: ''
  },
  receiverEmail: {
    type: String,
    default: ''
  },
  receiverNumber: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Engineering'
  },
  team: {
    type: String,
    default: 'Backend'
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: '11:00 AM'
  },
  endTime: {
    type: String,
    default: '12:00 PM'
  },
  dateTimeDisplay: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'Online (Google Meet)'
  },
  purpose: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Upcoming', 'Completed', 'Cancelled', 'Pending'],
    default: 'Scheduled'
  },
  isToday: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

