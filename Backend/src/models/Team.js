const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  description: {
    type: String,
    default: 'Team responsible for department objectives.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);

