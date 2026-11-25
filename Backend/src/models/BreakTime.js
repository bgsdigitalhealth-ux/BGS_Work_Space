const mongoose = require('mongoose');

const breakTimeSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userRole: {
    type: String,
    default: 'user'
  },
  teamId: {
    type: String,
    default: '',
    index: true
  },
  teamName: {
    type: String,
    default: ''
  },
  departmentId: {
    type: String,
    default: ''
  },
  departmentName: {
    type: String,
    default: ''
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  fromTime: {
    type: String,
    required: true
  },
  toTime: {
    type: String,
    required: true
  },
  fromTimestamp: {
    type: Date,
    required: true
  },
  toTimestamp: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    default: 'Break'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BreakTime', breakTimeSchema);
