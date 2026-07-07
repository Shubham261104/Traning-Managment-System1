const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['admin', 'instructor'],
    required: true
  },
  recipientType: {
    type: String,
    enum: ['everyone', 'instructors', 'students', 'course'],
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function () {
      return this.recipientType === 'course';
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent'],
    default: 'sent'
  }
}, {
  timestamps: true
});

// Index for faster queries
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ sender: 1 });
announcementSchema.index({ recipientType: 1 });
announcementSchema.index({ course: 1 });
announcementSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
