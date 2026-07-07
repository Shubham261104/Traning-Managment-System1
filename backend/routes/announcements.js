const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// All routes require authentication
router.use(auth);

// Create announcement (admin or instructor)
router.post('/', async (req, res) => {
    try {
        const { title, message, recipientType, courseId, priority } = req.body;
        const user = req.user;

        // Validate permissions
        if (!['admin', 'instructor'].includes(user.role)) {
            return res.status(403).json({ message: 'Only admin and instructors can create announcements' });
        }

        // Instructors can only send to students
        if (user.role === 'instructor' && recipientType !== 'students' && recipientType !== 'course') {
            return res.status(403).json({ message: 'Instructors can only send announcements to students' });
        }

        // Validate course if recipientType is 'course'
        if (recipientType === 'course') {
            if (!courseId) {
                return res.status(400).json({ message: 'Course ID is required for course-specific announcements' });
            }

            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // If instructor, verify they teach this course
            if (user.role === 'instructor' && course.instructor.toString() !== user.id) {
                return res.status(403).json({ message: 'You can only send announcements to your own courses' });
            }
        }

        const announcement = new Announcement({
            title,
            message,
            sender: user.id,
            senderRole: user.role,
            recipientType,
            course: courseId || null,
            priority: priority || 'medium',
            scheduledAt: req.body.scheduledAt || new Date()
        });

        await announcement.save();

        const populatedAnnouncement = await Announcement.findById(announcement._id)
            .populate('sender', 'email')
            .populate({
                path: 'sender',
                populate: { path: 'profile', select: 'firstName lastName' }
            })
            .populate('course', 'title');

        res.status(201).json(populatedAnnouncement);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get announcements for current user
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const { limit = 20, skip = 0 } = req.query;

        let query = {};

        const now = new Date();

        if (user.role === 'admin') {
            // Admin sees all announcements or those targeted to everyone/instructors
            query = {
                $or: [
                    { recipientType: 'everyone', scheduledAt: { $lte: now } },
                    { recipientType: 'instructors', scheduledAt: { $lte: now } },
                    { sender: user.id }
                ]
            };
        } else if (user.role === 'instructor') {
            // Instructors see announcements for everyone, instructors, or ones they sent
            query = {
                $or: [
                    { recipientType: 'everyone', scheduledAt: { $lte: now } },
                    { recipientType: 'instructors', scheduledAt: { $lte: now } },
                    { sender: user.id }
                ]
            };
        } else if (user.role === 'student') {
            // Students see announcements for everyone, students, or their enrolled courses
            const enrollments = await Enrollment.find({
                student: user.id,
                status: 'approved'
            }).select('course');

            const courseIds = enrollments.map(e => e.course);

            query = {
                scheduledAt: { $lte: now },
                $or: [
                    { recipientType: 'everyone' },
                    { recipientType: 'students' },
                    { recipientType: 'course', course: { $in: courseIds } }
                ]
            };
        }

        const announcements = await Announcement.find(query)
            .populate('sender', 'email')
            .populate({
                path: 'sender',
                populate: { path: 'profile', select: 'firstName lastName' }
            })
            .populate('course', 'title')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Add isRead flag for each announcement
        const announcementsWithReadStatus = announcements.map(announcement => {
            const isRead = announcement.readBy.some(r => r.user.toString() === user.id);
            return {
                ...announcement.toObject(),
                isRead
            };
        });

        res.json(announcementsWithReadStatus);
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const user = req.user;

        let query = {};

        const now = new Date();

        if (user.role === 'admin') {
            query = {
                $or: [
                    { recipientType: 'everyone', scheduledAt: { $lte: now } },
                    { recipientType: 'instructors', scheduledAt: { $lte: now } }
                ]
            };
        } else if (user.role === 'instructor') {
            query = {
                $or: [
                    { recipientType: 'everyone', scheduledAt: { $lte: now } },
                    { recipientType: 'instructors', scheduledAt: { $lte: now } }
                ]
            };
        } else if (user.role === 'student') {
            const enrollments = await Enrollment.find({
                student: user.id,
                status: 'approved'
            }).select('course');

            const courseIds = enrollments.map(e => e.course);

            query = {
                scheduledAt: { $lte: now },
                $or: [
                    { recipientType: 'everyone' },
                    { recipientType: 'students' },
                    { recipientType: 'course', course: { $in: courseIds } }
                ]
            };
        }

        // Find announcements not read by this user
        query['readBy.user'] = { $ne: user.id };

        const count = await Announcement.countDocuments(query);

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark announcement as read
router.put('/:id/read', async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if already read
        const alreadyRead = announcement.readBy.some(r => r.user.toString() === req.user.id);

        if (!alreadyRead) {
            announcement.readBy.push({
                user: req.user.id,
                readAt: new Date()
            });
            await announcement.save();
        }

        res.json({ message: 'Announcement marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get announcements sent by current user (for admin/instructor)
router.get('/sent', async (req, res) => {
    try {
        const user = req.user;

        if (!['admin', 'instructor'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const announcements = await Announcement.find({ sender: user.id })
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        res.json(announcements);
    } catch (error) {
        console.error('Get sent announcements error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete announcement (only sender can delete)
router.delete('/:id', async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Only sender or admin can delete
        if (announcement.sender.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own announcements' });
        }

        await Announcement.findByIdAndDelete(req.params.id);

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
