const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Department',
    required: true
  },
  description: {
    type: String,
    default: 'Team responsible for department objectives.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
