const mongoose = require('mongoose');

const WhiteboardSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Live Whiteboard Session'
  },
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
  pages: [{
    id: String,
    title: String,
    shapes: Array,
    canvasImage: String
  }],
  activePageIndex: {
    type: Number,
    default: 0
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  participantsCount: {
    type: Number,
    default: 0
  },
  participantsList: [{
    name: String,
    email: String,
    joinedAt: Date,
    drawingCount: Number,
    questionsAsked: Number,
    chatMessagesCount: Number
  }],
  recordingUrl: {
    type: String,
    default: ''
  },
  isRecorded: {
    type: Boolean,
    default: false
  },
  settings: {
    canDraw: { type: Boolean, default: true },
    canWrite: { type: Boolean, default: true },
    canUpload: { type: Boolean, default: true },
    canChat: { type: Boolean, default: true },
    canDownload: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false }
  },
  chatMessages: [{
    sender: String,
    role: String,
    text: String,
    timestamp: Date,
    isQuestion: Boolean
  }],
  analytics: {
    totalStrokes: Number,
    totalQuestions: Number,
    avgParticipation: Number
  },
  endedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('WhiteboardSession', WhiteboardSessionSchema);
