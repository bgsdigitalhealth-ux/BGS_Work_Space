const mongoose = require('mongoose');

const reportEntrySchema = new mongoose.Schema({
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
    lowercase: true,
    trim: true
  },
  teamId: {
    type: String,
    default: ''
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
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  startDate: {
    type: String
  },
  endDate: {
    type: String
  },
  attendanceSeconds: {
    type: Number,
    default: 0
  },
  activeWorkSeconds: {
    type: Number,
    default: 0
  },
  pausedSeconds: {
    type: Number,
    default: 0
  },
  completedTasksCount: {
    type: Number,
    default: 0
  },
  inProgressTasksCount: {
    type: Number,
    default: 0
  },
  managerNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'modified', 'deleted'],
    default: 'active'
  },
  modifiedBy: {
    type: String,
    default: ''
  },
  modifiedAt: {
    type: Date
  },
  // Keep original unedited data intact
  originalData: {
    attendanceSeconds: Number,
    activeWorkSeconds: Number,
    pausedSeconds: Number,
    completedTasksCount: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('ReportEntry', reportEntrySchema);
