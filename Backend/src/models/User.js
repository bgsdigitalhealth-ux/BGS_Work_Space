const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  memberId: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  team: {
    type: String,
    default: ''
  },
  teamRole: {
    type: String,
    default: 'Team Member'
  },
  avatar: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Team Member'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

