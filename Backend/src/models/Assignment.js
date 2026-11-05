const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
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
    enum: ['In Progress', 'To Do', 'In Review', 'Completed'],
    default: 'In Progress'
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
