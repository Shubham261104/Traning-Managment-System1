const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');

// Get all active courses (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'active' })
      .populate('instructor', 'email')
      .populate({
        path: 'instructor',
        populate: { path: 'profile' }
      })
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'email')
      .populate({
        path: 'instructor',
        populate: { path: 'profile' }
      })
      .populate('prerequisites');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

