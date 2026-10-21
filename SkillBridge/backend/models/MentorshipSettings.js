const mongoose = require('mongoose');

const mentorshipSettingsSchema = new mongoose.Schema({
    isEnabled: {
        type: Boolean,
        default: true
    },
    maxSessionsPerStudentPerWeek: {
        type: Number,
        default: 1
    },
    maxStudentsPerInstructor: {
        type: Number,
        default: 10
    },
    minNoticeHours: {
        type: Number,
        default: 24
    },
    cancellationWindowHours: {
        type: Number,
        default: 12
    },
    sessionDurationMinutes: {
        type: Number,
        default: 45
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MentorshipSettings', mentorshipSettingsSchema);
