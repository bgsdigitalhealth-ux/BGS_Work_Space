const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.Mixed,
    default: 'general'
  },
  assignmentId: {
    type: String,
    default: ''
  },
  memberId: {
    type: String,
    default: ''
  },
  memberName: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    default: 'Medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: String,
    default: ''
  },
  assignedBy: {
    type: String,
    default: 'Admin'
  },
  assignerRole: {
    type: String,
    default: 'admin'
  },
  assignmentType: {
    type: String,
    default: 'admin_to_user'
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
