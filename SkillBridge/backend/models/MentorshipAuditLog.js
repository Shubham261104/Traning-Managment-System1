const mongoose = require('mongoose');

const mentorshipAuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'SETTINGS_UPDATED', 'INSTRUCTOR_TOGGLED']
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorshipSession'
    },
    details: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MentorshipAuditLog', mentorshipAuditLogSchema);
