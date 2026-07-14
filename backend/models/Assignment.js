const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  score: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
}, {
  _id: false
});

const assignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxScore: {
    type: Number,
    default: 100,
    min: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  submissions: [assignmentSubmissionSchema]
}, {
  timestamps: true
});

assignmentSchema.index({ course: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
