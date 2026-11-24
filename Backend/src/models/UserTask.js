const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: String,
  author: String,
  role: String,
  date: String,
  badge: String,
  text: String
}, { _id: false });

const activityLogSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ['created', 'deadline_change', 'assignee_change', 'status_change', 'started', 'paused', 'resumed', 'finished', 'comment', 'deliverable_submitted']
  },
  performedBy: String,
  performedByRole: String,
  performedById: String,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed,
  message: String
}, { _id: false });

const timerStateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['idle', 'running', 'paused', 'finished'],
    default: 'idle'
  },
  activeSessionStart: { type: Date, default: null },
  isPaused: { type: Boolean, default: false },
  pausedAt: { type: Date, default: null },
  pauseReason: { type: String, default: '' },
  activeSeconds: { type: Number, default: 0 },
  pausedSeconds: { type: Number, default: 0 }
}, { _id: false });

const userTaskSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  taskId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'General'
  },
  team: {
    type: String,
    default: 'Team'
  },
  priority: {
    type: String,
    default: 'High'
  },
  dueDate: {
    type: String,
    default: 'Today'
  },
  status: {
    type: String,
    default: 'In Progress'
  },
  assignedBy: {
    type: String,
    default: 'Admin'
  },
  assignerRole: {
    type: String,
    default: 'admin'
  },
  assignerId: {
    type: String,
    default: ''
  },
  assignmentType: {
    type: String,
    default: 'admin_to_user'
  },
  assignedOn: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  },
  description: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  activityLog: [activityLogSchema],
  timerState: { type: timerStateSchema, default: () => ({ status: 'idle', activeSeconds: 0, pausedSeconds: 0, isPaused: false }) },
  completedAt: { type: Date, default: null },
  completedBy: { type: String, default: '' },
  userId: {
    type: String,
    default: 'usr-user'
  },
  teamId: {
    type: String,
    default: ''
  },
  departmentId: {
    type: String,
    default: ''
  },
  assigneeId: {
    type: String,
    default: ''
  },
  assigneeEmail: {
    type: String,
    default: ''
  },
  assigneeName: {
    type: String,
    default: ''
  },
  assignmentId: {
    type: String,
    default: ''
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('UserTask', userTaskSchema);
