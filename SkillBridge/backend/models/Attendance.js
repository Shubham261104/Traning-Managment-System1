const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  remark: {
    type: String,
    default: ''
  },
  joinedAt: {
    type: Date,
    default: null
  },
  joinMethod: {
    type: String,
    enum: ['manual', 'qr', 'live_whiteboard'],
    default: 'manual'
  },
  lateMinutes: {
    type: Number,
    default: 0
  }
}, { _id: false });

const auditLogSchema = new mongoose.Schema({
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  oldStatus: String,
  newStatus: String,
  reason: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classDate: {
    type: String, // YYYY-MM-DD format for easy query
    required: true
  },
  startTime: {
    type: String,
    default: '10:00'
  },
  lateThresholdMinutes: {
    type: Number,
    default: 10
  },
  sessionTitle: {
    type: String,
    default: 'Regular Class'
  },
  records: [attendanceRecordSchema],
  qrCode: {
    code: String,
    expiresAt: Date,
    isActive: { type: Boolean, default: false }
  },
  auditLogs: [auditLogSchema]
}, {
  timestamps: true
});

attendanceSchema.index({ course: 1, classDate: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
