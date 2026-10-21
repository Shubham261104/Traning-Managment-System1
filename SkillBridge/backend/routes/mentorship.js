const express = require('express');
const router = express.Router();
const { auth: authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const MentorshipSession = require('../models/MentorshipSession');
const InstructorAvailability = require('../models/InstructorAvailability');
const MentorshipSettings = require('../models/MentorshipSettings');
const MentorshipAuditLog = require('../models/MentorshipAuditLog');

// Helper: Get or initialize global mentorship settings
async function getSettings() {
    let settings = await MentorshipSettings.findOne();
    if (!settings) {
        settings = await MentorshipSettings.create({
            isEnabled: true,
            maxSessionsPerStudentPerWeek: 1,
            maxStudentsPerInstructor: 10,
            minNoticeHours: 24,
            cancellationWindowHours: 12,
            sessionDurationMinutes: 45
        });
    }
    return settings;
}

// Helper: Get week start and end (Monday 00:00 to Sunday 23:59:59)
function getWeekRange(dateObj) {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diffToMon));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
}

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

// 1. Get all available instructors for mentorship
router.get('/instructors', authMiddleware, async (req, res) => {
    try {
        const settings = await getSettings();
        if (!settings.isEnabled && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Mentorship feature is currently disabled by administrator.' });
        }

        const instructors = await User.find({ role: 'instructor', isActive: true }).populate('profile');
        const courseList = await Course.find({ isPublished: true });

        const result = await Promise.all(instructors.map(async (inst) => {
            const avail = await InstructorAvailability.findOne({ instructor: inst._id });
            const isEnabled = avail ? avail.isEnabled : true;

            if (!isEnabled && req.user.role !== 'admin') return null;

            const instCourses = courseList.filter(c => c.instructor && c.instructor.toString() === inst._id.toString());
            const weeklySlots = avail && avail.weeklySlots && avail.weeklySlots.length > 0 ? avail.weeklySlots : [
                { day: 'Monday', timeSlot: '10:00 AM - 11:00 AM', isActive: true },
                { day: 'Wednesday', timeSlot: '02:00 PM - 03:00 PM', isActive: true },
                { day: 'Friday', timeSlot: '04:00 PM - 05:00 PM', isActive: true }
            ];

            return {
                _id: inst._id,
                email: inst.email,
                firstName: inst.profile?.firstName || 'Instructor',
                lastName: inst.profile?.lastName || '',
                avatar: inst.profile?.avatar || null,
                specialization: inst.profile?.specialization || 'Senior Educator & Technical Expert',
                experience: inst.profile?.experience || '5+ Years Teaching',
                rating: 4.9,
                courses: instCourses.map(c => ({ _id: c._id, title: c.title })),
                weeklySlots,
                blockedDates: avail ? avail.blockedDates : [],
                isEnabled
            };
        }));

        res.json(result.filter(Boolean));
    } catch (error) {
        console.error('Error fetching instructors:', error);
        res.status(500).json({ message: 'Server error fetching instructors.' });
    }
});

// 2. Get student mentorship history
router.get('/student/history', authMiddleware, async (req, res) => {
    try {
        const sessions = await MentorshipSession.find({ student: req.user._id })
            .populate({ path: 'instructor', populate: { path: 'profile' } })
            .populate('course')
            .sort({ date: -1, createdAt: -1 });

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching student history:', error);
        res.status(500).json({ message: 'Server error fetching mentorship history.' });
    }
});

// 3. Request/book a mentorship session
router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { instructorId, courseId, date, timeSlot, topic } = req.body;

        if (!instructorId || !date || !timeSlot || !topic) {
            return res.status(400).json({ message: 'Instructor, date, time slot, and topic are required.' });
        }

        const settings = await getSettings();
        if (!settings.isEnabled) {
            return res.status(400).json({ message: 'Mentorship feature is currently disabled.' });
        }

        // Verify instructor mentorship status
        const avail = await InstructorAvailability.findOne({ instructor: instructorId });
        if (avail && !avail.isEnabled) {
            return res.status(400).json({ message: 'This instructor is not currently accepting mentorship sessions.' });
        }

        // Rule: 1 session per week per student
        const targetDate = new Date(date);
        const { startOfWeek, endOfWeek } = getWeekRange(targetDate);

        const existingWeeklyCount = await MentorshipSession.countDocuments({
            student: req.user._id,
            date: { $gte: startOfWeek, $lte: endOfWeek },
            status: { $nin: ['cancelled', 'rejected'] }
        });

        if (existingWeeklyCount >= settings.maxSessionsPerStudentPerWeek) {
            return res.status(400).json({
                message: `You can only book ${settings.maxSessionsPerStudentPerWeek} mentorship session per week. You already have a session booked for this week.`
            });
        }

        // Check overlapping / double booking for the instructor
        const duplicateSlot = await MentorshipSession.findOne({
            instructor: instructorId,
            date: {
                $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                $lte: new Date(targetDate.setHours(23, 59, 59, 999))
            },
            timeSlot,
            status: { $in: ['pending', 'approved', 'scheduled'] }
        });

        if (duplicateSlot) {
            return res.status(400).json({ message: 'This time slot has already been booked with this instructor.' });
        }

        // Create Session
        const session = await MentorshipSession.create({
            student: req.user._id,
            instructor: instructorId,
            course: courseId || null,
            date: new Date(date),
            timeSlot,
            topic,
            status: 'pending',
            meetingLink: `/mentorship/room/${Date.now()}`
        });

        // Notifications
        await Notification.create({
            recipient: instructorId,
            type: 'system',
            title: 'New Mentorship Request 🎓',
            message: `A new 1-to-1 mentorship request was submitted for ${timeSlot} on ${new Date(date).toLocaleDateString()}. Topic: "${topic}"`,
            link: '/instructor/mentorship',
            relatedId: session._id
        });

        await Notification.create({
            recipient: req.user._id,
            type: 'system',
            title: 'Mentorship Request Submitted 🚀',
            message: `Your mentorship request for ${timeSlot} on ${new Date(date).toLocaleDateString()} has been submitted.`,
            link: '/student/mentorship',
            relatedId: session._id
        });

        // Audit Log
        await MentorshipAuditLog.create({
            action: 'REQUESTED',
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Student booked mentorship session with instructor ${instructorId} for ${timeSlot} on ${date}`
        });

        res.status(201).json({ message: 'Mentorship request submitted successfully!', session });
    } catch (error) {
        console.error('Error submitting mentorship request:', error);
        res.status(500).json({ message: 'Server error booking session.' });
    }
});

// 4. Student Cancel Session
router.post('/student/cancel/:id', authMiddleware, async (req, res) => {
    try {
        const session = await MentorshipSession.findOne({ _id: req.params.id, student: req.user._id });
        if (!session) {
            return res.status(404).json({ message: 'Mentorship session not found.' });
        }

        if (['completed', 'cancelled'].includes(session.status)) {
            return res.status(400).json({ message: `Session is already ${session.status}.` });
        }

        session.status = 'cancelled';
        session.cancelledBy = req.user._id;
        session.cancellationReason = req.body.reason || 'Cancelled by student';
        await session.save();

        await Notification.create({
            recipient: session.instructor,
            type: 'system',
            title: 'Mentorship Session Cancelled ❌',
            message: `Student cancelled the mentorship session scheduled for ${session.timeSlot} on ${new Date(session.date).toLocaleDateString()}.`,
            link: '/instructor/mentorship',
            relatedId: session._id
        });

        await MentorshipAuditLog.create({
            action: 'CANCELLED',
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Student cancelled mentorship session.`
        });

        res.json({ message: 'Session cancelled successfully.', session });
    } catch (error) {
        console.error('Error cancelling session:', error);
        res.status(500).json({ message: 'Server error cancelling session.' });
    }
});

// ==========================================
// INSTRUCTOR ENDPOINTS
// ==========================================

// 5. Get instructor sessions
router.get('/instructor/sessions', authMiddleware, async (req, res) => {
    try {
        const sessions = await MentorshipSession.find({ instructor: req.user._id })
            .populate({ path: 'student', populate: { path: 'profile' } })
            .populate('course')
            .sort({ date: -1, createdAt: -1 });

        res.json(sessions);
    } catch (error) {
        console.error('Error fetching instructor sessions:', error);
        res.status(500).json({ message: 'Server error fetching sessions.' });
    }
});

// 6. Get instructor availability
router.get('/instructor/availability', authMiddleware, async (req, res) => {
    try {
        let avail = await InstructorAvailability.findOne({ instructor: req.user._id });
        if (!avail) {
            avail = await InstructorAvailability.create({
                instructor: req.user._id,
                weeklySlots: [
                    { day: 'Monday', timeSlot: '10:00 AM - 11:00 AM', isActive: true },
                    { day: 'Wednesday', timeSlot: '02:00 PM - 03:00 PM', isActive: true },
                    { day: 'Friday', timeSlot: '04:00 PM - 05:00 PM', isActive: true }
                ],
                blockedDates: [],
                isEnabled: true
            });
        }
        res.json(avail);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ message: 'Server error fetching availability.' });
    }
});

// 7. Update instructor availability
router.put('/instructor/availability', authMiddleware, async (req, res) => {
    try {
        const { weeklySlots, blockedDates, maxStudentsPerWeek, isEnabled } = req.body;
        let avail = await InstructorAvailability.findOne({ instructor: req.user._id });

        if (!avail) {
            avail = new InstructorAvailability({ instructor: req.user._id });
        }

        if (weeklySlots !== undefined) avail.weeklySlots = weeklySlots;
        if (blockedDates !== undefined) avail.blockedDates = blockedDates;
        if (maxStudentsPerWeek !== undefined) avail.maxStudentsPerWeek = maxStudentsPerWeek;
        if (isEnabled !== undefined) avail.isEnabled = isEnabled;

        await avail.save();
        res.json({ message: 'Availability schedule updated successfully.', availability: avail });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ message: 'Server error updating availability.' });
    }
});

// 8. Approve Request
router.post('/session/:id/approve', authMiddleware, async (req, res) => {
    try {
        const session = await MentorshipSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        session.status = 'approved';
        if (req.body.meetingLink) {
            session.meetingLink = req.body.meetingLink;
        }
        await session.save();

        await Notification.create({
            recipient: session.student,
            type: 'system',
            title: 'Mentorship Approved! 🎉',
            message: `Your mentorship request for ${session.timeSlot} on ${new Date(session.date).toLocaleDateString()} has been approved.`,
            link: '/student/mentorship',
            relatedId: session._id
        });

        await MentorshipAuditLog.create({
            action: 'APPROVED',
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Instructor approved mentorship request.`
        });

        res.json({ message: 'Session approved successfully!', session });
    } catch (error) {
        console.error('Error approving session:', error);
        res.status(500).json({ message: 'Server error approving session.' });
    }
});

// 9. Reject Request
router.post('/session/:id/reject', authMiddleware, async (req, res) => {
    try {
        const session = await MentorshipSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        session.status = 'rejected';
        session.rejectionReason = req.body.reason || 'Instructor unavailable at requested time.';
        await session.save();

        await Notification.create({
            recipient: session.student,
            type: 'system',
            title: 'Mentorship Request Status Update',
            message: `Your mentorship request for ${new Date(session.date).toLocaleDateString()} was rejected. Reason: ${session.rejectionReason}`,
            link: '/student/mentorship',
            relatedId: session._id
        });

        await MentorshipAuditLog.create({
            action: 'REJECTED',
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Instructor rejected request: ${session.rejectionReason}`
        });

        res.json({ message: 'Session rejected.', session });
    } catch (error) {
        console.error('Error rejecting session:', error);
        res.status(500).json({ message: 'Server error rejecting session.' });
    }
});

// 10. Reschedule Session
router.post('/session/:id/reschedule', authMiddleware, async (req, res) => {
    try {
        const { date, timeSlot, reason } = req.body;
        const session = await MentorshipSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        session.rescheduledTo = { date: new Date(date), timeSlot, reason };
        session.date = new Date(date);
        session.timeSlot = timeSlot;
        session.status = 'scheduled';
        await session.save();

        await Notification.create({
            recipient: session.student,
            type: 'system',
            title: 'Mentorship Session Rescheduled 📅',
            message: `Your session was rescheduled to ${timeSlot} on ${new Date(date).toLocaleDateString()}`,
            link: '/student/mentorship',
            relatedId: session._id
        });

        await MentorshipAuditLog.create({
            action: 'RESCHEDULED',
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Session rescheduled to ${timeSlot} on ${date}`
        });

        res.json({ message: 'Session rescheduled.', session });
    } catch (error) {
        console.error('Error rescheduling session:', error);
        res.status(500).json({ message: 'Server error rescheduling session.' });
    }
});

// 11. Complete Session
router.post('/session/:id/complete', authMiddleware, async (req, res) => {
    try {
        const { notes, feedback, resources, followUpAction } = req.body;
        const session = await MentorshipSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        session.status = 'completed';
        session.completedAt = new Date();
        session.notes = notes || session.notes;
        session.feedback = feedback || session.feedback;
        session.resources = resources || session.resources;
        session.followUpAction = followUpAction || session.followUpAction;
        await session.save();

        await Notification.create({
            recipient: session.student,
            type: 'system',
            title: 'Mentorship Completed ✨',
            message: `Your 1-to-1 mentorship session has been completed. Instructor notes and resources are now available.`,
            link: '/student/mentorship',
            relatedId: session._id
        });

        await MentorshipAuditLog.create({
            action: 'COMPLETED',
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Session completed.`
        });

        res.json({ message: 'Session marked as completed.', session });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ message: 'Server error completing session.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// 12. Admin Dashboard Data
router.get('/admin/data', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        const sessions = await MentorshipSession.find()
            .populate({ path: 'student', populate: { path: 'profile' } })
            .populate({ path: 'instructor', populate: { path: 'profile' } })
            .populate('course')
            .sort({ createdAt: -1 });

        const settings = await getSettings();
        const logs = await MentorshipAuditLog.find().populate({ path: 'performedBy', populate: { path: 'profile' } }).sort({ createdAt: -1 }).limit(50);
        const instructors = await User.find({ role: 'instructor' }).populate('profile');
        const availabilities = await InstructorAvailability.find();

        const totalRequests = sessions.length;
        const pendingCount = sessions.filter(s => s.status === 'pending').length;
        const approvedCount = sessions.filter(s => ['approved', 'scheduled'].includes(s.status)).length;
        const completedCount = sessions.filter(s => s.status === 'completed').length;
        const cancelledCount = sessions.filter(s => ['cancelled', 'rejected'].includes(s.status)).length;
        const activeMentors = availabilities.filter(a => a.isEnabled).length;

        res.json({
            stats: {
                totalRequests,
                pendingCount,
                approvedCount,
                completedCount,
                cancelledCount,
                activeMentors
            },
            sessions,
            settings,
            auditLogs: logs,
            instructors: instructors.map(inst => {
                const avail = availabilities.find(a => a.instructor.toString() === inst._id.toString());
                return {
                    _id: inst._id,
                    email: inst.email,
                    firstName: inst.profile?.firstName || 'Instructor',
                    lastName: inst.profile?.lastName || '',
                    isEnabled: avail ? avail.isEnabled : true
                };
            })
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).json({ message: 'Server error fetching admin mentorship data.' });
    }
});

// 13. Update Admin Settings
router.put('/admin/settings', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

        let settings = await getSettings();
        const fields = ['isEnabled', 'maxSessionsPerStudentPerWeek', 'maxStudentsPerInstructor', 'minNoticeHours', 'cancellationWindowHours', 'sessionDurationMinutes'];

        fields.forEach(f => {
            if (req.body[f] !== undefined) settings[f] = req.body[f];
        });
        settings.updatedBy = req.user._id;
        await settings.save();

        await MentorshipAuditLog.create({
            action: 'SETTINGS_UPDATED',
            performedBy: req.user._id,
            details: `Admin updated mentorship global settings.`
        });

        res.json({ message: 'Mentorship settings updated successfully.', settings });
    } catch (error) {
        console.error('Error updating admin settings:', error);
        res.status(500).json({ message: 'Server error updating settings.' });
    }
});

// 14. Admin Toggle Instructor Status
router.put('/admin/instructor/:instructorId/toggle', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

        const { instructorId } = req.params;
        let avail = await InstructorAvailability.findOne({ instructor: instructorId });
        if (!avail) {
            avail = new InstructorAvailability({ instructor: instructorId });
        }

        avail.isEnabled = req.body.isEnabled !== undefined ? req.body.isEnabled : !avail.isEnabled;
        await avail.save();

        await MentorshipAuditLog.create({
            action: 'INSTRUCTOR_TOGGLED',
            performedBy: req.user._id,
            details: `Admin set instructor ${instructorId} mentorship status to ${avail.isEnabled}`
        });

        res.json({ message: `Instructor mentorship ${avail.isEnabled ? 'enabled' : 'disabled'}.`, isEnabled: avail.isEnabled });
    } catch (error) {
        console.error('Error toggling instructor mentorship:', error);
        res.status(500).json({ message: 'Server error toggling instructor status.' });
    }
});

// 15. Admin Action on Session (Force approve/cancel/reassign)
router.post('/admin/session/:id/action', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

        const { action, instructorId, reason } = req.body;
        const session = await MentorshipSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        if (action === 'approve') session.status = 'approved';
        if (action === 'reject') {
            session.status = 'rejected';
            session.rejectionReason = reason || 'Rejected by Admin';
        }
        if (action === 'cancel') {
            session.status = 'cancelled';
            session.cancelledBy = req.user._id;
            session.cancellationReason = reason || 'Cancelled by Admin';
        }
        if (action === 'reassign' && instructorId) {
            session.instructor = instructorId;
        }

        await session.save();

        await MentorshipAuditLog.create({
            action: action.toUpperCase(),
            performedBy: req.user._id,
            targetSession: session._id,
            details: `Admin performed action '${action}' on mentorship session.`
        });

        res.json({ message: `Session action '${action}' executed successfully.`, session });
    } catch (error) {
        console.error('Error in admin session action:', error);
        res.status(500).json({ message: 'Server error executing admin session action.' });
    }
});

module.exports = router;
