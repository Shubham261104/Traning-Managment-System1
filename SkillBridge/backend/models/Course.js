const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 30
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sessionTimes: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  materials: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'document', 'link'],
      default: 'document'
    },
    description: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'completed'],
    default: 'active'
  },
  category: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  deliveryType: {
    type: String,
    enum: ['LIVE_CLASS', 'RECORDED', 'MATERIAL_BASED'],
    default: 'LIVE_CLASS'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);

