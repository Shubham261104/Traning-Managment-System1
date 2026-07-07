const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');

// All routes require student role
router.use(auth);
router.use(authorize('student'));

// Get student dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course')
      .sort({ createdAt: -1 });

    // Filter out enrollments with null courses
    const validEnrollments = enrollments.filter(e => e.course !== null && e.course !== undefined);

    const enrolledCourses = validEnrollments.filter(e => e.status === 'approved');
    const pendingEnrollments = validEnrollments.filter(e => e.status === 'pending');

    let certificates = await Certificate.find({ student: req.user._id })
      .populate('course');

    // Filter out certificates with null courses
    certificates = certificates.filter(c => c.course !== null && c.course !== undefined);

    res.json({
      enrolledCourses: enrolledCourses.length,
      pendingEnrollments: pendingEnrollments.length,
      certificatesCount: certificates.length,
      enrollments: validEnrollments,
      certificates
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available courses
router.get('/courses/available', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id });
    const enrolledCourseIds = enrollments.map(e => e.course.toString());

    const courses = await Course.find({
      status: 'active',
      _id: { $nin: enrollments.map(e => e.course) }
    })
      .populate('instructor', 'email')
      .populate({
        path: 'instructor',
        populate: { path: 'profile' }
      });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request enrollment
router.post('/enrollments', async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existing) {
      return res.status(400).json({ message: 'Already enrolled or enrollment request exists' });
    }

    const enrollment = new Enrollment({
      student: req.user._id,
      course: courseId,
      status: 'pending'
    });

    await enrollment.save();
    const populated = await Enrollment.findById(enrollment._id)
      .populate('course')
      .populate('student', 'email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my enrollments
router.get('/enrollments', async (req, res) => {
  try {
    let enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course')
      .sort({ createdAt: -1 });

    // Filter out enrollments with null or undefined courses
    enrollments = enrollments.filter(e =>
      e.course !== null &&
      e.course !== undefined &&
      (typeof e.course === 'object' ? e.course._id : true)
    );

    res.json(enrollments);
  } catch (error) {
    console.error('Enrollments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quizzes for enrolled course
router.get('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    const quizzes = await Quiz.find({
      course: req.params.courseId,
      isActive: true,
      scheduledAt: { $lte: new Date() }
    }).populate('questions');

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit quiz attempt
router.post('/quizzes/:quizId/attempt', async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const quiz = await Quiz.findById(req.params.quizId).populate('questions');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Grade answers
    let score = 0;
    let totalPoints = 0;
    const gradedAnswers = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const answer = answers.find(a => a.questionId === question._id.toString());

      let isCorrect = false;
      if (answer) {
        if (question.type === 'multiple_choice') {
          const selectedOption = question.options.find(opt => opt.text === answer.selectedAnswer);
          isCorrect = selectedOption && selectedOption.isCorrect;
        } else if (question.type === 'true_false') {
          isCorrect = answer.selectedAnswer === question.correctAnswer;
        }
      }

      if (isCorrect) {
        score += question.points;
      }

      gradedAnswers.push({
        question: question._id,
        selectedAnswer: answer?.selectedAnswer || '',
        isCorrect
      });
    }

    const percentage = totalPoints > 0 ? (score / totalPoints * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    const attempt = new QuizAttempt({
      student: req.user._id,
      quiz: quiz._id,
      answers: gradedAnswers,
      score,
      percentage,
      passed,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    });

    await attempt.save();

    // Update enrollment progress if passed
    if (passed) {
      enrollment.progress = Math.min(enrollment.progress + 10, 100);
      // Mark as completed if progress reaches 100%
      if (enrollment.progress >= 100 && !enrollment.completed) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();
      }
      await enrollment.save();
    }

    const populated = await QuizAttempt.findById(attempt._id)
      .populate('answers.question');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quiz attempts history
router.get('/quizzes/attempts', async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate('quiz', 'title')
      .populate('answers.question')
      .sort({ completedAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get certificates
router.get('/certificates', async (req, res) => {
  try {
    let certificates = await Certificate.find({ student: req.user._id })
      .populate('course')
      .sort({ issuedAt: -1 });

    // Filter out certificates with null or undefined courses
    certificates = certificates.filter(cert =>
      cert.course !== null &&
      cert.course !== undefined &&
      (typeof cert.course === 'object' ? cert.course._id : true)
    );

    res.json(certificates);
  } catch (error) {
    console.error('Certificates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course materials
router.get('/courses/:courseId/materials', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Filter available materials and add viewed status
    const now = new Date();
    const materialsWithStatus = course.materials
      .filter(m => !m.scheduledAt || new Date(m.scheduledAt) <= now)
      .map((material, index) => ({
        ...material.toObject(),
        _id: index.toString(),
        viewed: enrollment.viewedMaterials?.some(
          vm => vm.materialId === index.toString()
        ) || false
      }));

    res.json(materialsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark material as viewed
router.post('/courses/:courseId/materials/:materialId/view', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
      status: 'approved'
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const materialIndex = parseInt(req.params.materialId);
    if (isNaN(materialIndex) || materialIndex < 0 || materialIndex >= course.materials.length) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const material = course.materials[materialIndex];
    const materialId = materialIndex.toString();

    // Check if already viewed
    const alreadyViewed = enrollment.viewedMaterials?.some(
      vm => vm.materialId === materialId
    );

    if (!alreadyViewed) {
      // Add to viewed materials
      if (!enrollment.viewedMaterials) {
        enrollment.viewedMaterials = [];
      }
      enrollment.viewedMaterials.push({
        materialId: materialIndex.toString(),
        viewedAt: new Date()
      });

      // Calculate progress
      const totalMaterials = course.materials.length;
      const viewedCount = enrollment.viewedMaterials.length;
      enrollment.progress = Math.round((viewedCount / totalMaterials) * 100);

      // Check if all materials are viewed
      if (viewedCount >= totalMaterials && !enrollment.completed) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();
      }

      await enrollment.save();
    }

    res.json({
      enrollment,
      progress: enrollment.progress,
      completed: enrollment.completed,
      viewedCount: enrollment.viewedMaterials?.length || 0,
      totalMaterials: course.materials.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student profile
router.get('/profile', async (req, res) => {
  try {
    const user = await req.user.populate('profile');
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student profile
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth, bio, education, studentId, department } = req.body;
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
    if (studentId !== undefined) user.profile.studentId = studentId;
    if (department !== undefined) user.profile.department = department;

    await user.profile.save();
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile avatar
const { avatarUpload } = require('../middleware/upload');
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

