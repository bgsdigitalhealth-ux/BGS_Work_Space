const mongoose = require('mongoose');

const pauseSchema = new mongoose.Schema({
  pausedAt: { type: Date, required: true },
  resumedAt: { type: Date, default: null },
  reason: { type: String, required: true },
  durationSeconds: { type: Number, default: 0 }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  activeSeconds: { type: Number, default: 0 },
  pausedSeconds: { type: Number, default: 0 },
  pauses: [pauseSchema],
  status: {
    type: String,
    enum: ['running', 'paused', 'finished'],
    default: 'running'
  },
  currentPause: {
    pausedAt: { type: Date, default: null },
    reason: { type: String, default: '' }
  }
}, { _id: false });

const timeLogSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  taskId: {
    type: String,
    required: true,
    index: true
  },
  assignmentId: {
    type: String,
    default: ''
  },
  taskTitle: {
    type: String,
    default: ''
  },
  // Ensure time stays permanently credited to the user who performed it
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    default: 'Team Member'
  },
  userEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  teamId: {
    type: String,
    default: ''
  },
  teamName: {
    type: String,
    default: ''
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  sessions: [sessionSchema],
  totalActiveSeconds: {
    type: Number,
    default: 0
  },
  totalPausedSeconds: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['idle', 'running', 'paused', 'finished'],
    default: 'idle'
  }
}, { timestamps: true });

module.exports = mongoose.model('TimeLog', timeLogSchema);
