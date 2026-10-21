const mongoose = require('mongoose');

const mentorshipSessionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rescheduledTo: {
        date: Date,
        timeSlot: String,
        reason: String
    },
    meetingLink: {
        type: String
    },
    notes: {
        type: String,
        trim: true
    },
    feedback: {
        type: String,
        trim: true
    },
    resources: [{
        title: String,
        url: String
    }],
    followUpAction: {
        type: String,
        trim: true
    },
    completedAt: Date
}, {
    timestamps: true
});

mentorshipSessionSchema.index({ student: 1, date: -1 });
mentorshipSessionSchema.index({ instructor: 1, date: -1 });
mentorshipSessionSchema.index({ status: 1 });

module.exports = mongoose.model('MentorshipSession', mentorshipSessionSchema);
