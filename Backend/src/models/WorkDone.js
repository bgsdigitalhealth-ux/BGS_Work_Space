const mongoose = require('mongoose');

const workDoneSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  taskId: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
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

module.exports = mongoose.model('WorkDone', workDoneSchema);

