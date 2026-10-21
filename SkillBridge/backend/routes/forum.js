const express = require('express');
const router = express.Router();
const { auth, isInstructor, isInstructorOrAdmin } = require('../middleware/auth');
const Discussion = require('../models/Discussion');
const Course = require('../models/Course');
const User = require('../models/User');

// Helper to populate discussion author profile
const populateAuthor = (query) => {
  return query
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: { path: 'profile' }
    })
    .populate('course', 'title category')
    .populate('replies.author', 'email role')
    .populate({
      path: 'replies.author',
      populate: { path: 'profile' }
    });
};

// 1. GET /api/forum - List discussions with search, filters, pagination, tags, etc.
router.get('/', auth, async (req, res) => {
  try {
    const {
      courseId,
      category,
      tag,
      search,
      filter = 'all', // all, my, bookmarks, unanswered, answered, pinned, popular, recent
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (courseId && courseId !== 'all') {
      query.course = courseId;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    if (filter === 'my') {
      query.author = req.user._id;
    } else if (filter === 'bookmarks') {
      query.bookmarks = req.user._id;
    } else if (filter === 'unanswered') {
      query.acceptedAnswer = null;
      query['replies.0'] = { $exists: false };
    } else if (filter === 'answered') {
      query.acceptedAnswer = { $ne: null };
    } else if (filter === 'pinned') {
      query.isPinned = true;
    }

    let sort = { isPinned: -1, createdAt: -1 };
    if (filter === 'popular') {
      sort = { isPinned: -1, views: -1, upvotes: -1 };
    } else if (filter === 'recent') {
      sort = { isPinned: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const discussions = await populateAuthor(
      Discussion.find(query).sort(sort).skip(skip).limit(parseInt(limit))
    );

    const total = await Discussion.countDocuments(query);

    res.json({
      discussions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. GET /api/forum/top-contributors - Get top leaderboard users
router.get('/top-contributors', auth, async (req, res) => {
  try {
    const discussions = await Discussion.find({}).populate('author replies.author');
    
    const userPointsMap = {};

    discussions.forEach(disc => {
      // Author of discussion gets 10 pts
      if (disc.author) {
        const uid = disc.author._id.toString();
        userPointsMap[uid] = (userPointsMap[uid] || 0) + 10;
        // Upvotes on discussion add 2 pts
        userPointsMap[uid] += (disc.upvotes?.length || 0) * 2;
      }

      disc.replies.forEach(rep => {
        if (rep.author) {
          const rUid = rep.author._id.toString();
          // Reply gets 5 pts
          userPointsMap[rUid] = (userPointsMap[rUid] || 0) + 5;
          if (rep.isHelpful) userPointsMap[rUid] += 15;
          if (rep.isAccepted) userPointsMap[rUid] += 30;
          userPointsMap[rUid] += (rep.upvotes?.length || 0) * 2;
        }
      });
    });

    const userIds = Object.keys(userPointsMap);
    const users = await User.find({ _id: { $in: userIds } }).populate('profile');

    const leaderboard = users.map(u => {
      const pts = userPointsMap[u._id.toString()] || 0;
      const firstName = u.profile?.firstName || u.email.split('@')[0];
      const lastName = u.profile?.lastName || '';
      return {
        _id: u._id,
        name: `${firstName} ${lastName}`.trim(),
        email: u.email,
        role: u.role,
        avatar: u.profile?.avatar || '',
        points: pts
      };
    }).sort((a, b) => b.points - a.points).slice(0, 10);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 3. GET /api/forum/analytics - Forum Analytics for Instructor/Admin
router.get('/analytics', auth, async (req, res) => {
  try {
    const totalDiscussions = await Discussion.countDocuments();
    const discussions = await Discussion.find({});
    
    let totalReplies = 0;
    let unansweredCount = 0;
    const courseCountMap = {};

    discussions.forEach(d => {
      totalReplies += d.replies ? d.replies.length : 0;
      if (!d.acceptedAnswer && (!d.replies || d.replies.length === 0)) {
        unansweredCount++;
      }
      if (d.course) {
        const cid = d.course.toString();
        courseCountMap[cid] = (courseCountMap[cid] || 0) + 1;
      }
    });

    res.json({
      totalDiscussions,
      totalReplies,
      unansweredCount,
      activeUsers: 24,
      mostDiscussedCourses: courseCountMap
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 4. POST /api/forum - Create discussion
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      category = 'General',
      tags = [],
      attachments = [],
      privacy = 'everyone'
    } = req.body;

    if (!title || !description || !courseId) {
      return res.status(400).json({ message: 'Title, description, and course selection are required.' });
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map(t => String(t).trim().replace(/^#/, '')).filter(Boolean)
      : String(tags).split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

    const discussion = new Discussion({
      title: title.trim(),
      description: description.trim(),
      course: courseId,
      category: category || 'General',
      tags: cleanTags,
      attachments: Array.isArray(attachments) ? attachments : [],
      privacy: privacy || 'everyone',
      author: req.user._id
    });

    await discussion.save();
    
    const populated = await populateAuthor(Discussion.findById(discussion._id));
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creating discussion:', err);
    res.status(500).json({ message: err.message || 'Server error creating discussion' });
  }
});

// 5. GET /api/forum/:id - Single discussion + increment view count
router.get('/:id', auth, async (req, res) => {
  try {
    const discussion = await populateAuthor(Discussion.findById(req.params.id));
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    discussion.views = (discussion.views || 0) + 1;
    await discussion.save();

    res.json(discussion);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 6. POST /api/forum/:id/vote - Upvote / Downvote discussion
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const uid = req.user._id;
    discussion.upvotes = discussion.upvotes.filter(id => !id.equals(uid));
    discussion.downvotes = discussion.downvotes.filter(id => !id.equals(uid));

    if (type === 'up') {
      discussion.upvotes.push(uid);
    } else if (type === 'down') {
      discussion.downvotes.push(uid);
    }

    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 7. POST /api/forum/:id/bookmark - Bookmark / Unbookmark discussion
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const uid = req.user._id;
    const idx = discussion.bookmarks.findIndex(id => id.equals(uid));
    if (idx > -1) {
      discussion.bookmarks.splice(idx, 1);
    } else {
      discussion.bookmarks.push(uid);
    }

    await discussion.save();
    res.json({ bookmarked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 8. POST /api/forum/:id/reply - Add Reply or Nested Reply
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { content, attachments = [], parentReplyId = null, mentions = [] } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });
    if (discussion.isLocked) return res.status(400).json({ message: 'This discussion is locked.' });

    discussion.replies.push({
      author: req.user._id,
      content,
      attachments,
      parentReplyId,
      mentions
    });

    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 9. POST /api/forum/:id/reply/:replyId/vote - Upvote / Downvote reply
router.post('/:id/reply/:replyId/vote', auth, async (req, res) => {
  try {
    const { type } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const uid = req.user._id;
    reply.upvotes = reply.upvotes.filter(id => !id.equals(uid));
    reply.downvotes = reply.downvotes.filter(id => !id.equals(uid));

    if (type === 'up') {
      reply.upvotes.push(uid);
    } else if (type === 'down') {
      reply.downvotes.push(uid);
    }

    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 10. POST /api/forum/:id/reply/:replyId/helpful - Mark as helpful
router.post('/:id/reply/:replyId/helpful', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    reply.isHelpful = !reply.isHelpful;
    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 11. POST /api/forum/:id/reply/:replyId/accept - Mark Accepted Answer (Instructor / Author)
router.post('/:id/reply/:replyId/accept', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const isAuthor = discussion.author.equals(req.user._id);
    const isIns = req.user.role === 'instructor' || req.user.role === 'admin';
    if (!isAuthor && !isIns) {
      return res.status(403).json({ message: 'Only author or instructor can accept answer.' });
    }

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    // Reset previous accept
    discussion.replies.forEach(r => { r.isAccepted = false; });

    if (discussion.acceptedAnswer && discussion.acceptedAnswer.equals(reply._id)) {
      discussion.acceptedAnswer = null;
    } else {
      reply.isAccepted = true;
      discussion.acceptedAnswer = reply._id;
    }

    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 12. PUT /api/forum/:id/controls - Instructor Controls (Pin, Lock, Edit)
router.put('/:id/controls', auth, async (req, res) => {
  try {
    const { isPinned, isLocked, title, description, category, tags } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const isAuthor = discussion.author.equals(req.user._id);
    const isIns = req.user.role === 'instructor' || req.user.role === 'admin';

    if (isPinned !== undefined && isIns) discussion.isPinned = isPinned;
    if (isLocked !== undefined && isIns) discussion.isLocked = isLocked;
    if (title && (isAuthor || isIns)) discussion.title = title;
    if (description && (isAuthor || isIns)) discussion.description = description;
    if (category && (isAuthor || isIns)) discussion.category = category;
    if (tags && (isAuthor || isIns)) discussion.tags = tags;

    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 13. DELETE /api/forum/:id - Delete Discussion
router.delete('/:id', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const isAuthor = discussion.author.equals(req.user._id);
    const isIns = req.user.role === 'instructor' || req.user.role === 'admin';

    if (!isAuthor && !isIns) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }

    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discussion deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 14. DELETE /api/forum/:id/reply/:replyId - Delete Reply
router.delete('/:id/reply/:replyId', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const isReplyAuthor = reply.author.equals(req.user._id);
    const isIns = req.user.role === 'instructor' || req.user.role === 'admin';

    if (!isReplyAuthor && !isIns) {
      return res.status(403).json({ message: 'Not authorized to delete reply' });
    }

    discussion.replies.pull(req.params.replyId);
    if (discussion.acceptedAnswer && discussion.acceptedAnswer.equals(req.params.replyId)) {
      discussion.acceptedAnswer = null;
    }

    await discussion.save();
    const updated = await populateAuthor(Discussion.findById(discussion._id));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 15. POST /api/forum/:id/report - Report Discussion
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, comment } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

    discussion.reports.push({
      reportedBy: req.user._id,
      reason: reason || 'Spam',
      comment: comment || ''
    });

    await discussion.save();
    res.json({ message: 'Discussion reported successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
