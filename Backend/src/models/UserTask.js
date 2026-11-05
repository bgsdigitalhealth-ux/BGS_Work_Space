const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: String,
  author: String,
  role: String,
  date: String,
  badge: String,
  text: String
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
    default: 'Engineering'
  },
  team: {
    type: String,
    default: 'Backend Team'
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
  userId: {
    type: String,
    default: 'usr-user'
  }
}, { timestamps: true });

module.exports = mongoose.model('UserTask', userTaskSchema);

