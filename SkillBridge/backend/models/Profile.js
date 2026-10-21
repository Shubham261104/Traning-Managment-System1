const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  bio: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  // Academic & Professional fields
  education: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  currentPosition: {
    type: String,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  studentId: {
    type: String,
    trim: true
  },
  
  // Extended Instructor Profile Fields
  certifications: [{
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    year: { type: String },
    certificateUrl: { type: String },
    isVerified: { type: Boolean, default: true }
  }],
  skills: [{
    name: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Advanced' }
  }],
  languages: [{
    type: String
  }],
  linkedin: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String
  },
  notificationPreferences: {
    newEnrollment: { type: Boolean, default: true },
    studentMessage: { type: Boolean, default: true },
    quizSubmission: { type: Boolean, default: true },
    assignment: { type: Boolean, default: true },
    lowAttendance: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true }
  },
  weeklySchedule: [{
    day: { type: String }, // e.g. MON, TUE, WED, THU, FRI
    courseTitle: { type: String },
    startTime: { type: String },
    endTime: { type: String }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
