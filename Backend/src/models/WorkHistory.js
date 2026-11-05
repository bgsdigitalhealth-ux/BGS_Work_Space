const mongoose = require('mongoose');

const reviewerCommentSchema = new mongoose.Schema({
  id: String,
  author: String,
  role: String,
  date: String,
  text: String
}, { _id: false });

const workHistorySchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true
  },
  taskId: {
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
  submittedDate: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  },
  status: {
    type: String,
    default: 'Under Review'
  },
  reviewerFeedback: {
    type: String,
    default: 'Submitted. Pending review by Admin / Team Lead.'
  },
  assignedBy: {
    type: String,
    default: 'Admin'
  },
  dueDate: {
    type: String,
    default: 'Today'
  },
  submittedComment: {
    type: String,
    default: ''
  },
  reviewerComments: [reviewerCommentSchema],
  userId: {
    type: String,
    default: 'usr-user'
  }
}, { timestamps: true });

module.exports = mongoose.model('WorkHistory', workHistorySchema);

