const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

// All routes require authentication
router.use(auth);

// Helper to generate Ticket ID
const generateTicketId = () => {
    return `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
};

// Create a new support ticket
router.post('/', async (req, res) => {
    try {
        const { subject, message, recipientRole, recipientId, priority, category } = req.body;
        const user = req.user;

        // Validation
        if (!subject || !message || !recipientRole) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Role-based validation
        if (user.role === 'student') {
            if (!['admin', 'instructor'].includes(recipientRole)) {
                return res.status(400).json({ message: 'Students can only contact admins or instructors' });
            }
        } else if (user.role === 'instructor') {
            if (recipientRole !== 'admin') {
                return res.status(400).json({ message: 'Instructors can only contact admins' });
            }
        }

        const ticket = new SupportTicket({
            ticketId: generateTicketId(),
            sender: user.id,
            recipient: recipientRole === 'instructor' ? recipientId : null, // Admin is generic
            recipientRole,
            subject,
            category: category || 'general',
            priority: priority || 'medium',
            messages: [{
                sender: user.id,
                message
            }]
        });

        await ticket.save();

        // Create Notification
        if (recipientRole === 'admin') {
            const admins = await User.find({ role: 'admin' });
            const notifications = admins.map(admin => ({
                recipient: admin._id,
                type: 'new_ticket',
                title: 'New Support Ticket',
                message: `New ticket from ${user.email}: ${subject}`,
                relatedId: ticket._id,
                link: '/admin/support'
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        } else if (recipientId) {
            await Notification.create({
                recipient: recipientId,
                type: 'new_ticket',
                title: 'New Support Ticket',
                message: `New ticket from ${user.email}: ${subject}`,
                relatedId: ticket._id,
                link: '/instructor/support'
            });
        }

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get tickets for current user
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user.role === 'student') {
            // Students see tickets they sent
            query = { sender: user.id };
        } else if (user.role === 'instructor') {
            // Instructors see tickets they sent OR tickets sent TO them
            query = {
                $or: [
                    { sender: user.id },
                    { recipient: user.id, recipientRole: 'instructor' }
                ]
            };
        } else if (user.role === 'admin') {
            // Admins see tickets sent to Admin ROLE
            query = { recipientRole: 'admin' };
        }

        const tickets = await SupportTicket.find(query)
            .populate('sender', 'email role profile')
            .populate({
                path: 'sender',
                populate: { path: 'profile', select: 'firstName lastName' }
            })
            .populate('recipient', 'email role profile')
            .populate({
                path: 'recipient',
                populate: { path: 'profile', select: 'firstName lastName' }
            })
            .sort({ updatedAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reply to a ticket
router.post('/:id/reply', async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Access control: Only sender or recipient (or generalized admin) can reply
        const isSender = ticket.sender.toString() === user.id;
        const isRecipient = ticket.recipient?.toString() === user.id;
        const isGenericAdmin = ticket.recipientRole === 'admin' && user.role === 'admin';

        if (!isSender && !isRecipient && !isGenericAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        ticket.messages.push({
            sender: user.id,
            message
        });

        // Auto-update status if responding
        if (isRecipient || isGenericAdmin) {
            if (ticket.status === 'open') ticket.status = 'in_progress';
        } else {
            // If sender replies, maybe re-open if closed? 
            // For now let's keep it simple
        }

        await ticket.save();

        // Notify the OTHER party
        const isSenderMsg = user.id === ticket.sender.toString();

        if (isSenderMsg) {
            // User replied. Notify Support
            if (ticket.recipientRole === 'admin') {
                const admins = await User.find({ role: 'admin' });
                const notifications = admins.map(admin => ({
                    recipient: admin._id,
                    type: 'ticket_reply',
                    title: 'New Reply',
                    message: `Reply on ticket: ${ticket.subject}`,
                    relatedId: ticket._id,
                    link: '/admin/support'
                }));
                if (notifications.length > 0) await Notification.insertMany(notifications);
            } else if (ticket.recipient) {
                await Notification.create({
                    recipient: ticket.recipient,
                    type: 'ticket_reply',
                    title: 'New Reply',
                    message: `Reply on ticket: ${ticket.subject}`,
                    relatedId: ticket._id,
                    link: '/instructor/support'
                });
            }
        } else {
            // Support replied. Notify Sender
            const sender = await User.findById(ticket.sender);
            if (sender) {
                let link = '/student/support';
                if (sender.role === 'instructor') link = '/instructor/support';

                await Notification.create({
                    recipient: ticket.sender,
                    type: 'ticket_reply',
                    title: 'Ticket Reply',
                    message: `New reply on your ticket: ${ticket.subject}`,
                    relatedId: ticket._id,
                    link
                });
            }
        }

        // Return updated ticket with population
        const updatedTicket = await SupportTicket.findById(ticket._id)
            .populate('sender', 'email role')
            .populate({
                path: 'messages.sender',
                select: 'email role profile',
                populate: { path: 'profile', select: 'firstName lastName avatar' }
            });

        res.json(updatedTicket);
    } catch (error) {
        console.error('Reply ticket error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update ticket status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const user = req.user;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only recipient/admin can change status usually, but maybe sender can close?
        // Let's allow sender to close, and recipient/admin to manage all statuses.
        const isSender = ticket.sender.toString() === user.id;
        const isRecipient = ticket.recipient?.toString() === user.id;
        const isAdmin = user.role === 'admin';

        if (!isSender && !isRecipient && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        ticket.status = status;
        await ticket.save();

        // Notify Sender if status changed by support
        if (ticket.sender.toString() !== user.id) {
            const sender = await User.findById(ticket.sender);
            if (sender) {
                let link = '/student/support';
                if (sender.role === 'instructor') link = '/instructor/support';

                await Notification.create({
                    recipient: ticket.sender,
                    type: 'ticket_status',
                    title: 'Ticket Resolved',
                    message: `Your ticket "${ticket.subject}" has been marked as ${status}`,
                    relatedId: ticket._id,
                    link
                });
            }
        }

        res.json(ticket);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get instructors for student dropdown
router.get('/instructors', async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can fetch their instructors' });
        }

        // Find approved enrollments
        const enrollments = await Enrollment.find({
            student: req.user.id,
            status: 'approved'
        }).populate({
            path: 'course',
            populate: {
                path: 'instructor',
                select: 'email profile',
                populate: { path: 'profile', select: 'firstName lastName' }
            }
        });

        // Extract unique instructors
        const instructorsMap = new Map();
        enrollments.forEach(enrollment => {
            if (enrollment.course && enrollment.course.instructor) {
                const instructor = enrollment.course.instructor;
                instructorsMap.set(instructor._id.toString(), {
                    id: instructor._id,
                    name: `${instructor.profile?.firstName} ${instructor.profile?.lastName}`,
                    email: instructor.email
                });
            }
        });

        res.json(Array.from(instructorsMap.values()));
    } catch (error) {
        console.error('Get instructors error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
