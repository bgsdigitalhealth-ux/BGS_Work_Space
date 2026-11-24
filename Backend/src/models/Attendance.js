const mongoose = require('mongoose');

const punchSchema = new mongoose.Schema({
  punchIn: { type: Date, required: true },
  punchOut: { type: Date, default: null },
  durationSeconds: { type: Number, default: 0 }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userName: {
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
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['punched_in', 'punched_out'],
    default: 'punched_out'
  },
  punches: [punchSchema],
  totalSeconds: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for unique attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
