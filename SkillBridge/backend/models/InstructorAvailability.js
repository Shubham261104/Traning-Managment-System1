const mongoose = require('mongoose');

const instructorAvailabilitySchema = new mongoose.Schema({
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    weeklySlots: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        timeSlot: {
            type: String, // e.g. "10:00 AM - 11:00 AM"
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    blockedDates: [{
        type: Date
    }],
    maxStudentsPerWeek: {
        type: Number,
        default: 10
    },
    isEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InstructorAvailability', instructorAvailabilitySchema);
