const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { avatarUpload } = require('../middleware/upload');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');

// All routes require instructor role
router.use(auth);
router.use(authorize('instructor'));

// Get instructor dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('instructor', 'email')
      .populate({
        path: 'instructor',
        populate: { path: 'profile' }
      });

    const courseIds = courses.map(c => c._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });

    const totalStudents = enrollments.length;
    const assignedCourses = courses.length;

    res.json({
      assignedCourses,
      totalStudents,
      courses: courses.map(course => ({
        ...course.toObject(),
        studentCount: enrollments.filter(e => e.course.toString() === course._id.toString()).length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assigned courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('instructor', 'email')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students in a course
router.get('/courses/:courseId/students', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollments = await Enrollment.find({
      course: req.params.courseId,
      status: 'approved'
    })
      .populate('student', 'email')
      .populate({
        path: 'student',
        populate: { path: 'profile' }
      });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create quiz
router.post('/quizzes', async (req, res) => {
  try {
    const { course, title, description, passingScore, timeLimit, questions, scheduledAt } = req.body;

    // Verify instructor owns the course
    const courseDoc = await Course.findById(course);
    if (!courseDoc || courseDoc.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const quiz = new Quiz({
      course,
      title,
      description,
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 30,
      createdBy: req.user._id,
      scheduledAt: scheduledAt || new Date()
    });

    // Create questions
    const questionIds = [];
    for (const q of questions) {
      const question = new QuizQuestion({
        quiz: quiz._id,
        question: q.question,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1
      });
      await question.save();
      questionIds.push(question._id);
    }

    quiz.questions = questionIds;
    await quiz.save();

    const populatedQuiz = await Quiz.findById(quiz._id).populate('questions');
    res.status(201).json(populatedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quizzes for a course
router.get('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const quizzes = await Quiz.find({ course: req.params.courseId })
      .populate('questions');

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quiz attempts for a quiz
router.get('/quizzes/:quizId/attempts', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('course');

    if (!quiz || quiz.course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
      .populate('student', 'email')
      .populate({
        path: 'student',
        populate: { path: 'profile' }
      })
      .populate('answers.question')
      .sort({ completedAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add material to course (supports both file upload and URL)
router.post('/courses/:courseId/materials', upload.single('file'), async (req, res) => {
  try {
    const { title, url, type, description } = req.body;
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      // Delete uploaded file if access denied
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Access denied' });
    }

    let materialUrl = url;
    let materialType = type || 'document';

    // If file is uploaded, use file path
    if (req.file) {
      materialUrl = `/uploads/materials/${req.file.filename}`;
      // Determine type from file extension
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        materialType = 'pdf';
      } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) {
        materialType = 'video';
      } else {
        materialType = 'document';
      }
    }

    if (!materialUrl) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Either file or URL is required' });
    }

    const material = {
      title: title || (req.file ? req.file.originalname : 'Untitled'),
      url: materialUrl,
      type: materialType,
      description: description || '',
      uploadedAt: new Date(),
      scheduledAt: req.body.scheduledAt || new Date(),
      fileName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : null
    };

    course.materials.push(material);
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove material from course
router.delete('/courses/:courseId/materials/:materialId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const materialIndex = parseInt(req.params.materialId);
    if (isNaN(materialIndex) || materialIndex < 0 || materialIndex >= course.materials.length) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const material = course.materials[materialIndex];

    // Delete file if it's an uploaded file (starts with /uploads)
    if (material.url && material.url.startsWith('/uploads')) {
      const filePath = path.join(__dirname, '..', material.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    course.materials.splice(materialIndex, 1);
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course materials
router.get('/courses/:courseId/materials', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(course.materials || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get instructor profile
router.get('/profile', async (req, res) => {
  try {
    const user = await req.user.populate('profile');
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update instructor profile
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth, bio, education, specialization, experience, department } = req.body;
    const user = await req.user.populate('profile');

    if (!user.profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;
    if (address !== undefined) user.profile.address = address;
    if (dateOfBirth) user.profile.dateOfBirth = dateOfBirth;
    if (bio !== undefined) user.profile.bio = bio;
    if (education !== undefined) user.profile.education = education;
    if (specialization !== undefined) user.profile.specialization = specialization;
    if (experience !== undefined) user.profile.experience = experience;
    if (department !== undefined) user.profile.department = department;

    await user.profile.save();
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile avatar
router.post('/profile/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await req.user.populate('profile');
    if (!user.profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    user.profile.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.profile.save();

    res.json({ avatar: user.profile.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

