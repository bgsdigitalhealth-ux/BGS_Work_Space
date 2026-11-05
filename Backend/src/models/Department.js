const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'code'
  },
  description: {
    type: String,
    default: 'Manage teams, members, roles and work.'
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
