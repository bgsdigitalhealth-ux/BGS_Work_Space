const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
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
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);

