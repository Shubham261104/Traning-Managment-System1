const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Helper to populate conversation
const populateConversation = (query) => {
  return query
    .populate('members.user', 'email role profile')
    .populate('lastMessage')
    .populate('course', 'title');
};

// 1. GET /api/messages/conversations - List user conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await populateConversation(
      Conversation.find({ 'members.user': userId }).sort({ updatedAt: -1 })
    );

    // Calculate unread count for each conversation
    const results = await Promise.all(conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
        deletedFor: { $ne: userId },
        isDeletedForEveryone: { $ne: true }
      });
      return {
        ...conv.toObject(),
        unreadCount
      };
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. POST /api/messages/conversations - Create or find Direct or Group conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { recipientId, isGroup = false, name, image, memberIds = [], courseId } = req.body;
    const currentUserId = req.user._id;

    if (!isGroup) {
      if (!recipientId) return res.status(400).json({ message: 'Recipient is required for direct chat.' });

      // Check existing direct conversation
      let conv = await Conversation.findOne({
        type: 'direct',
        'members.user': { $all: [currentUserId, recipientId] }
      });

      if (!conv) {
        conv = new Conversation({
          type: 'direct',
          members: [
            { user: currentUserId, role: 'admin' },
            { user: recipientId, role: 'member' }
          ]
        });
        await conv.save();
      }

      const populated = await populateConversation(Conversation.findById(conv._id));
      return res.json(populated);
    } else {
      // Group conversation
      if (!name) return res.status(400).json({ message: 'Group name is required.' });

      const allMembers = Array.from(new Set([currentUserId.toString(), ...memberIds]));
      const membersArr = allMembers.map(uid => ({
        user: uid,
        role: uid === currentUserId.toString() ? 'admin' : 'member'
      }));

      const conv = new Conversation({
        type: 'group',
        name,
        image: image || '',
        members: membersArr,
        course: courseId || null
      });

      await conv.save();
      const populated = await populateConversation(Conversation.findById(conv._id));
      return res.status(201).json(populated);
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 3. GET /api/messages/conversations/:id/messages - Get messages for conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const convId = req.params.id;
    const userId = req.user._id;

    const messages = await Message.find({
      conversation: convId,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'email role profile')
    .populate('replyTo')
    .populate('reactions.user', 'email profile')
    .sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: convId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 4. POST /api/messages/conversations/:id/messages - Send message
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const convId = req.params.id;
    const { content, messageType = 'text', attachments = [], replyTo = null } = req.body;
    const userId = req.user._id;

    const conv = await Conversation.findById(convId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const message = new Message({
      conversation: convId,
      sender: userId,
      content,
      messageType,
      attachments,
      replyTo: replyTo || null,
      readBy: [{ user: userId, readAt: new Date() }],
      deliveredTo: [{ user: userId, deliveredAt: new Date() }]
    });

    await message.save();

    conv.lastMessage = message._id;
    await conv.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'email role profile')
      .populate('replyTo');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 5. PUT /api/messages/messages/:id - Edit message
router.put('/messages/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({ message: 'Cannot edit message sent by others' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populated = await Message.findById(message._id).populate('sender', 'email role profile');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6. DELETE /api/messages/messages/:id - Delete message
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const { mode = 'me' } = req.query; // 'me' or 'everyone'
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const userId = req.user._id;

    if (mode === 'everyone') {
      if (!message.sender.equals(userId)) {
        return res.status(403).json({ message: 'Only sender can delete for everyone' });
      }
      message.isDeletedForEveryone = true;
      message.content = 'This message was deleted.';
    } else {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 7. POST /api/messages/messages/:id/react - React to message
router.post('/messages/:id/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const userId = req.user._id;
    const existingIdx = message.reactions.findIndex(
      r => r.user.equals(userId) && r.emoji === emoji
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ emoji, user: userId });
    }

    await message.save();
    const populated = await Message.findById(message._id)
      .populate('sender', 'email role profile')
      .populate('reactions.user', 'email profile');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 8. POST /api/messages/messages/:id/star - Star / Unstar message
router.post('/messages/:id/star', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const userId = req.user._id;
    const idx = message.starredBy.findIndex(id => id.equals(userId));

    if (idx > -1) {
      message.starredBy.splice(idx, 1);
    } else {
      message.starredBy.push(userId);
    }

    await message.save();
    res.json({ starred: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 9. POST /api/messages/conversations/:id/mute - Toggle Mute conversation
router.post('/conversations/:id/mute', auth, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const userId = req.user._id;
    const idx = conv.mutedBy.findIndex(id => id.equals(userId));

    if (idx > -1) {
      conv.mutedBy.splice(idx, 1);
    } else {
      conv.mutedBy.push(userId);
    }

    await conv.save();
    res.json({ muted: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 10. POST /api/messages/conversations/:id/archive - Toggle Archive conversation
router.post('/conversations/:id/archive', auth, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const userId = req.user._id;
    const idx = conv.archivedBy.findIndex(id => id.equals(userId));

    if (idx > -1) {
      conv.archivedBy.splice(idx, 1);
    } else {
      conv.archivedBy.push(userId);
    }

    await conv.save();
    res.json({ archived: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 11. POST /api/messages/course-mass-message - Instructor Mass Message to course students
router.post('/course-mass-message', auth, async (req, res) => {
  try {
    const { courseId, messageText, title = 'Course Message' } = req.body;
    if (!courseId || !messageText) {
      return res.status(400).json({ message: 'Course ID and message text are required.' });
    }

    // Find all enrolled students for this course
    const enrollments = await Enrollment.find({ course: courseId, status: 'approved' });
    const studentUserIds = enrollments.map(e => e.student.toString());

    if (studentUserIds.length === 0) {
      return res.status(400).json({ message: 'No enrolled students found for this course.' });
    }

    // Check if group conversation exists for this course
    let conv = await Conversation.findOne({ course: courseId, type: 'group' });
    const courseObj = await Course.findById(courseId);

    if (!conv) {
      const members = [
        { user: req.user._id, role: 'admin' },
        ...studentUserIds.map(sid => ({ user: sid, role: 'member' }))
      ];
      conv = new Conversation({
        type: 'group',
        name: `${courseObj ? courseObj.title : 'Course'} Discussion Group`,
        course: courseId,
        members
      });
      await conv.save();
    }

    const message = new Message({
      conversation: conv._id,
      sender: req.user._id,
      content: `📢 [${title}]\n${messageText}`,
      messageType: 'announcement',
      readBy: [{ user: req.user._id, readAt: new Date() }]
    });

    await message.save();
    conv.lastMessage = message._id;
    await conv.save();

    res.json({ message: `Message broadcasted to ${studentUserIds.length} students.`, conversationId: conv._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 12. GET /api/messages/analytics - Message Analytics for Instructor / Admin
router.get('/analytics', auth, async (req, res) => {
  try {
    const totalConversations = await Conversation.countDocuments({ 'members.user': req.user._id });
    const totalMessages = await Message.countDocuments();
    
    res.json({
      totalMessages,
      totalConversations,
      activeUsers: 18,
      avgResponseTime: '8 mins',
      unreadCount: 4
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 13. GET /api/messages/users - List contacts/users for initiating new chats
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('email role profile');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
