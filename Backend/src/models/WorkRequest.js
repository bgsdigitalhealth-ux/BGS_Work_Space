const mongoose = require('mongoose');

const workRequestSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  referenceId: {
    type: String,
    required: true,
    unique: true
  },
  formType: {
    type: String,
    default: 'Extra Work Assignment'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'High'
  },
  dueDate: {
    type: String,
    default: ''
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  senderNumber: {
    type: String,
    default: ''
  },
  receiverId: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverEmail: {
    type: String,
    required: true
  },
  receiverNumber: {
    type: String,
    default: ''
  },
  receiverRole: {
    type: String,
    default: 'Team Member'
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
  managerId: {
    type: String,
    default: ''
  },
  managerName: {
    type: String,
    default: ''
  },
  managerEmail: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending Manager Approval', 'Approved', 'Rejected'],
    default: 'Pending Manager Approval'
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: String,
    default: ''
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: String,
    default: ''
  },
  assignedTaskId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WorkRequest = mongoose.models.WorkRequest || mongoose.model('WorkRequest', workRequestSchema);

module.exports = WorkRequest;
