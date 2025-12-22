const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

// All routes require admin role
router.use(auth);
router.use(authorize('admin'));

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const pendingEnrollments = await Enrollment.countDocuments({ status: 'pending' });

    res.json({
      totalStudents,
      totalInstructors,
      totalCourses,
      pendingEnrollments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent enrollment requests
router.get('/enrollments/pending', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ status: 'pending' })
      .populate('student', 'email')
      .populate({
        path: 'student',
        populate: { path: 'profile' }
      })
      .populate('course', 'title')
      .sort({ requestedAt: -1 })
      .limit(10);

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject enrollment
router.put('/enrollments/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.status = status;
    if (adminNotes) enrollment.adminNotes = adminNotes;
    if (status === 'approved') {
      enrollment.approvedAt = new Date();
      // Update course enrolled count
      await Course.findByIdAndUpdate(enrollment.course, {
        $inc: { enrolledCount: 1 }
      });
    }

    await enrollment.save();
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('profile')
      .select('-password');

    const studentsWithProgress = await Promise.all(students.map(async (student) => {
      const enrollments = await Enrollment.find({ student: student._id, status: 'approved' });
      const totalProgress = enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
      const averageProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;

      return {
        ...student.toObject(),
        averageProgress,
        enrolledCoursesCount: enrollments.length
      };
    }));

    res.json(studentsWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all instructors with stats
router.get('/instructors', async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .populate('profile')
      .select('-password');

    const instructorsWithStats = await Promise.all(instructors.map(async (instructor) => {
      const courses = await Course.find({ instructor: instructor._id });
      const courseCount = courses.length;
      const studentCount = courses.reduce((sum, course) => sum + (course.enrolledCount || 0), 0);

      return {
        ...instructor.toObject(),
        courseCount,
        studentCount
      };
    }));

    res.json(instructorsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create user (instructor or student)
router.post('/users', async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    // Validate role
    if (!['instructor', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be instructor or student' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      role
    });

    await user.save();

    // Create profile
    const profile = new Profile({
      userId: user._id,
      firstName,
      lastName,
      phone: phone || ''
    });

    await profile.save();

    // Link profile to user
    user.profile = profile._id;
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('profile')
      .select('-password');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (instructor or student)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete profile if exists
    if (user.profile) {
      await Profile.findByIdAndDelete(user.profile);
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, phone, isActive } = req.body;
    const user = await User.findById(req.params.id).populate('profile');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile
    if (user.profile) {
      if (firstName) user.profile.firstName = firstName;
      if (lastName) user.profile.lastName = lastName;
      if (phone !== undefined) user.profile.phone = phone;
      await user.profile.save();
    }

    // Update user
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    await user.save();

    const updatedUser = await User.findById(req.params.id)
      .populate('profile')
      .select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create course
router.post('/courses', async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course
router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Archive course
router.put('/courses/:id/archive', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { new: true }
    );
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course analytics
router.get('/courses/:id/analytics', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const enrollments = await Enrollment.find({ course: req.params.id });
    const completed = enrollments.filter(e => e.completed).length;
    const certificates = await Certificate.countDocuments({ course: req.params.id });

    res.json({
      totalEnrollments: enrollments.length,
      completed,
      certificates,
      completionRate: enrollments.length > 0 ? (completed / enrollments.length * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

