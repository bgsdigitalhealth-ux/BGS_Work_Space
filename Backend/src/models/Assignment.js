const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  teamId: {
    type: mongoose.Schema.Types.Mixed,
    default: 'general'
  },
  departmentId: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  workTitle: {
    type: String,
    required: true
  },
  workDescription: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'Developer'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  dueDate: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'In Progress'
  },
  // Any-to-Any Metadata:
  // 1. user_to_user
  // 2. admin_to_admin
  // 3. user_to_admin
  // 4. admin_to_user
  assignerId: {
    type: String,
    default: ''
  },
  assignerName: {
    type: String,
    default: 'Admin'
  },
  assignerRole: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin'
  },
  assignerEmail: {
    type: String,
    default: ''
  },
  assigneeId: {
    type: String,
    default: ''
  },
  assigneeName: {
    type: String,
    default: ''
  },
  assigneeRole: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  assigneeEmail: {
    type: String,
    default: ''
  },
  assignmentType: {
    type: String,
    enum: ['admin_to_user', 'admin_to_admin', 'user_to_admin', 'user_to_user'],
    default: 'admin_to_user'
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
