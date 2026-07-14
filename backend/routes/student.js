const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Certificate = require('../models/Certificate');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

router.use(auth);
router.use(authorize('student'));

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const toProfileName = (user) => {
  if (!user) return '';
  const profile = user.profile || {};
  return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.email || '';
};

const average = (values) => {
  const clean = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!clean.length) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
};

const getStudentAnnouncementsQuery = async (studentId) => {
  const enrollments = await Enrollment.find({ student: studentId, status: 'approved' }).select('course');
  const courseIds = enrollments.map((enrollment) => enrollment.course);
  return {
    scheduledAt: { $lte: new Date() },
    $or: [
      { recipientType: 'everyone' },
      { recipientType: 'students' },
      { recipientType: 'course', course: { $in: courseIds } }
    ]
  };
};

const buildUpcomingClasses = (enrollments, rangeDays = 30) => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + rangeDays);
  const classes = [];

  enrollments.forEach((enrollment) => {
    const course = enrollment.course;
    if (!course || !course.sessionTimes?.length) return;

    const startDate = new Date(Math.max(new Date(course.startDate).getTime(), now.getTime()));
    const courseEndDate = new Date(Math.min(new Date(course.endDate).getTime(), end.getTime()));

    for (let date = new Date(startDate); date <= courseEndDate; date.setDate(date.getDate() + 1)) {
      const day = dayNames[date.getDay()];
      course.sessionTimes
        .filter((session) => session.day === day)
        .forEach((session) => {
          classes.push({
            _id: `${course._id}-${date.toISOString()}-${session.startTime}`,
            course: course._id,
            title: course.title,
            date: new Date(date),
            startTime: session.startTime,
            endTime: session.endTime,
            instructor: toProfileName(course.instructor)
          });
        });
    }
  });

  return classes
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8);
};

const buildActivities = ({ enrollments, attempts, certificates, attendance, assignments }) => {
  const assignmentActivities = assignments
    .map((assignment) => {
      const submission = assignment.submission;
      if (!submission?.submittedAt) return null;
      return {
        type: 'assignment_submitted',
        title: `Assignment submitted: ${assignment.title}`,
        detail: assignment.course?.title || '',
        occurredAt: submission.submittedAt
      };
    })
    .filter(Boolean);

  return [
    ...attempts.map((attempt) => ({
      type: 'quiz_submitted',
      title: `Quiz submitted: ${attempt.quiz?.title || 'Quiz'}`,
      detail: `Score: ${Math.round(attempt.percentage || 0)}%`,
      occurredAt: attempt.completedAt || attempt.createdAt
    })),
    ...assignmentActivities,
    ...enrollments.map((enrollment) => ({
      type: 'course_enrolled',
      title: `Course enrolled: ${enrollment.course?.title || 'Course'}`,
      detail: enrollment.status,
      occurredAt: enrollment.approvedAt || enrollment.createdAt
    })),
    ...certificates.map((certificate) => ({
      type: 'certificate_generated',
      title: `Certificate generated: ${certificate.course?.title || 'Course'}`,
      detail: certificate.certificateId,
      occurredAt: certificate.issuedAt || certificate.createdAt
    })),
    ...attendance.map((record) => ({
      type: 'attendance_marked',
      title: `Attendance marked: ${record.course?.title || 'Class'}`,
      detail: record.status,
      occurredAt: record.classDate
    }))
  ]
    .filter((activity) => activity.occurredAt)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 10);
};

const attachStudentSubmission = (assignment, studentId) => {
  const assignmentObject = assignment.toObject ? assignment.toObject() : assignment;
  const submission = assignmentObject.submissions?.find(
    (item) => item.student?.toString() === studentId.toString()
  );
  delete assignmentObject.submissions;
  return {
    ...assignmentObject,
    submission: submission || null,
    status: submission?.status || 'pending'
  };
};

const getStudentAssignments = async (studentId) => {
  const enrollments = await Enrollment.find({ student: studentId, status: 'approved' }).select('course');
  const courseIds = enrollments.map((enrollment) => enrollment.course);
  const assignments = await Assignment.find({ course: { $in: courseIds }, isActive: true })
    .populate('course', 'title')
    .sort({ dueDate: 1 });
  return assignments.map((assignment) => attachStudentSubmission(assignment, studentId));
};

const getDashboardPayload = async (studentId) => {
  let enrollments = await Enrollment.find({ student: studentId })
    .populate({
      path: 'course',
      populate: {
        path: 'instructor',
        select: 'email profile',
        populate: { path: 'profile', select: 'firstName lastName avatar' }
      }
    })
    .sort({ createdAt: -1 });
  enrollments = enrollments.filter((enrollment) => enrollment.course);

  const approvedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'approved');
  const certificates = (await Certificate.find({ student: studentId }).populate('course').sort({ issuedAt: -1 }))
    .filter((certificate) => certificate.course);
  const attempts = await QuizAttempt.find({ student: studentId })
    .populate({ path: 'quiz', select: 'title course scheduledAt', populate: { path: 'course', select: 'title' } })
    .sort({ completedAt: -1 });
  const attendance = await Attendance.find({ student: studentId })
    .populate('course', 'title')
    .sort({ classDate: -1 });
  const assignments = await getStudentAssignments(studentId);
  const notificationsUnread = await Notification.countDocuments({ recipient: studentId, isRead: false });
  const announcementsQuery = await getStudentAnnouncementsQuery(studentId);
  const announcementsUnread = await Announcement.countDocuments({
    ...announcementsQuery,
    'readBy.user': { $ne: studentId }
  });

  const presentCount = attendance.filter((record) => ['present', 'late'].includes(record.status)).length;
  const attendancePercentage = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const progressPercentage = approvedEnrollments.length
    ? average(approvedEnrollments.map((enrollment) => enrollment.progress || 0))
    : 0;
  const assignmentScores = assignments
    .filter((assignment) => assignment.submission?.score !== undefined)
    .map((assignment) => Math.round((assignment.submission.score / assignment.maxScore) * 100));
  const averageScore = average([
    ...attempts.map((attempt) => Math.round(attempt.percentage || 0)),
    ...assignmentScores
  ]);

  return {
    stats: {
      enrolledCourses: approvedEnrollments.length,
      pendingEnrollments: enrollments.filter((enrollment) => enrollment.status === 'pending').length,
      coursesCompleted: approvedEnrollments.filter((enrollment) => enrollment.completed).length,
      quizzesCompleted: attempts.length,
      certificatesEarned: certificates.length,
      averageScore,
      attendancePercentage,
      learningStreak: 0,
      progressPercentage,
      unreadNotifications: notificationsUnread,
      unreadAnnouncements: announcementsUnread
    },
    enrollments,
    certificates,
    attempts,
    attendance,
    assignments,
    upcomingClasses: buildUpcomingClasses(approvedEnrollments),
    progressSeries: approvedEnrollments
      .map((enrollment) => ({
        date: enrollment.updatedAt || enrollment.createdAt,
        value: enrollment.progress || 0,
        label: enrollment.course?.title || 'Course'
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    performance: {
      excellent: attempts.filter((attempt) => attempt.percentage >= 90).length,
      good: attempts.filter((attempt) => attempt.percentage >= 75 && attempt.percentage < 90).length,
      average: attempts.filter((attempt) => attempt.percentage >= 50 && attempt.percentage < 75).length,
      needsImprovement: attempts.filter((attempt) => attempt.percentage < 50).length
    },
    recentActivities: buildActivities({ enrollments, attempts, certificates, attendance, assignments })
  };
};

router.get('/dashboard', async (req, res) => {
  try {
    res.json(await getDashboardPayload(req.user._id));
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/courses/available', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id }).select('course');
    const courses = await Course.find({
      status: 'active',
      _id: { $nin: enrollments.map((enrollment) => enrollment.course) }
    })
      .populate('instructor', 'email')
      .populate({
        path: 'instructor',
        populate: { path: 'profile', select: 'firstName lastName avatar' }
      })
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/enrollments', async (req, res) => {
  try {
    const { courseId } = req.body;
    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });

    if (existing) {
      return res.status(400).json({ message: 'Already enrolled or enrollment request exists' });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: 'pending'
    });

    const populated = await Enrollment.findById(enrollment._id).populate('course').populate('student', 'email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/enrollments', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course')
      .sort({ createdAt: -1 });
    res.json(enrollments.filter((enrollment) => enrollment.course));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const dashboard = await getDashboardPayload(req.user._id);
    res.json({
      progressPercentage: dashboard.stats.progressPercentage,
      progressSeries: dashboard.progressSeries,
      enrollments: dashboard.enrollments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('course', 'title')
      .sort({ classDate: -1 });
    const presentCount = records.filter((record) => ['present', 'late'].includes(record.status)).length;
    res.json({
      records,
      percentage: records.length ? Math.round((presentCount / records.length) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/attendance', async (req, res) => {
  try {
    const { courseId, status = 'present', classDate = new Date(), notes = '' } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // 1. Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: 'approved'
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // 2. Determine target day boundaries timezone-safely
    let startOfDay, endOfDay, targetDate;
    if (classDate) {
      const parsed = new Date(classDate);
      if (!isNaN(parsed.getTime())) {
        const dateStr = typeof classDate === 'string' ? classDate.split('T')[0] : '';
        const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (parts) {
          const year = parseInt(parts[1], 10);
          const month = parseInt(parts[2], 10) - 1;
          const day = parseInt(parts[3], 10);
          // Set to noon UTC to avoid zone offset shifts on storage
          targetDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
          startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
        } else {
          const year = parsed.getFullYear();
          const month = parsed.getMonth();
          const day = parsed.getDate();
          targetDate = parsed;
          startOfDay = new Date(year, month, day, 0, 0, 0, 0);
          endOfDay = new Date(year, month, day, 23, 59, 59, 999);
        }
      } else {
        const now = new Date();
        targetDate = now;
        startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      targetDate = now;
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Check if attendance already marked for this day
    const existingRecord = await Attendance.findOne({
      student: req.user._id,
      course: courseId,
      classDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'Attendance already marked for this course on this date.' });
    }

    // 3. Create attendance record
    const attendanceRecord = await Attendance.create({
      student: req.user._id,
      course: courseId,
      classDate: targetDate,
      status,
      markedBy: req.user._id,
      notes
    });

    const populatedRecord = await Attendance.findById(attendanceRecord._id).populate('course', 'title');
    res.status(201).json(populatedRecord);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    res.json(await getStudentAssignments(req.user._id));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/assignments/:assignmentId/submit', async (req, res) => {
  try {
    const { text, fileUrl } = req.body;
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
      status: 'approved'
    });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    assignment.submissions = assignment.submissions.filter(
      (submission) => submission.student.toString() !== req.user._id.toString()
    );
    assignment.submissions.push({
      student: req.user._id,
      text,
      fileUrl,
      status: 'submitted',
      submittedAt: new Date()
    });
    await assignment.save();
    res.json(attachStudentSubmission(await Assignment.findById(assignment._id).populate('course', 'title'), req.user._id));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ sender: req.user._id })
      .populate('recipient', 'email role profile')
      .populate({ path: 'messages.sender', select: 'email role profile', populate: { path: 'profile', select: 'firstName lastName avatar' } })
      .sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/messages', async (req, res) => {
  try {
    const { subject, message, recipientRole = 'admin', recipientId, priority = 'medium', category = 'general' } = req.body;
    if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });

    const ticket = await SupportTicket.create({
      ticketId: `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      sender: req.user._id,
      recipient: recipientRole === 'instructor' ? recipientId : null,
      recipientRole,
      subject,
      category,
      priority,
      messages: [{ sender: req.user._id, message }]
    });

    if (recipientRole === 'admin') {
      const admins = await User.find({ role: 'admin' });
      if (admins.length) {
        await Notification.insertMany(admins.map((admin) => ({
          recipient: admin._id,
          type: 'new_ticket',
          title: 'New Student Message',
          message: subject,
          relatedId: ticket._id,
          link: '/admin/support'
        })));
      }
    } else if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        type: 'new_ticket',
        title: 'New Student Message',
        message: subject,
        relatedId: ticket._id,
        link: '/instructor/support'
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const query = await getStudentAnnouncementsQuery(req.user._id);
    const announcements = await Announcement.find(query)
      .populate('sender', 'email')
      .populate({ path: 'sender', populate: { path: 'profile', select: 'firstName lastName' } })
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json(announcements.map((announcement) => ({
      ...announcement.toObject(),
      isRead: announcement.readBy.some((item) => item.user.toString() === req.user._id.toString())
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/announcements/:id/read', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    if (!announcement.readBy.some((item) => item.user.toString() === req.user._id.toString())) {
      announcement.readBy.push({ user: req.user._id, readAt: new Date() });
      await announcement.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/calendar', async (req, res) => {
  try {
    const dashboard = await getDashboardPayload(req.user._id);
    const assignments = dashboard.assignments.map((assignment) => ({
      _id: assignment._id,
      type: 'assignment',
      title: assignment.title,
      date: assignment.dueDate,
      course: assignment.course
    }));
    const quizCourseIds = dashboard.enrollments
      .filter((enrollment) => enrollment.status === 'approved')
      .map((enrollment) => enrollment.course?._id)
      .filter(Boolean);
    const quizzes = await Quiz.find({ course: { $in: quizCourseIds }, isActive: true })
      .populate('course', 'title')
      .sort({ scheduledAt: 1 });
    res.json([
      ...dashboard.upcomingClasses.map((item) => ({ ...item, type: 'class' })),
      ...assignments,
      ...quizzes.map((quiz) => ({ _id: quiz._id, type: 'quiz', title: quiz.title, date: quiz.scheduledAt, course: quiz.course }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/wallet', async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ student: req.user._id }).sort({ createdAt: -1 });
    const balance = transactions.reduce((sum, item) => {
      if (item.status !== 'completed') return sum;
      return item.type === 'refund' || item.type === 'scholarship' ? sum + item.amount : sum - item.amount;
    }, 0);
    res.json({ balance, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/courses/:courseId/quizzes', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId, status: 'approved' });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

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

router.post('/quizzes/:quizId/attempt', async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const quiz = await Quiz.findById(req.params.quizId).populate('questions');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course, status: 'approved' });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    let score = 0;
    let totalPoints = 0;
    const gradedAnswers = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const answer = answers.find((item) => item.questionId === question._id.toString());
      let isCorrect = false;

      if (answer) {
        if (question.type === 'multiple_choice') {
          const selectedOption = question.options.find((option) => option.text === answer.selectedAnswer);
          isCorrect = selectedOption && selectedOption.isCorrect;
        } else if (question.type === 'true_false') {
          isCorrect = answer.selectedAnswer === question.correctAnswer;
        }
      }

      if (isCorrect) score += question.points;
      gradedAnswers.push({ question: question._id, selectedAnswer: answer?.selectedAnswer || '', isCorrect });
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quiz._id,
      answers: gradedAnswers,
      score,
      percentage,
      passed,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    });

    if (passed) {
      enrollment.progress = Math.min((enrollment.progress || 0) + 10, 100);
      if (enrollment.progress >= 100 && !enrollment.completed) {
        enrollment.completed = true;
        enrollment.completedAt = new Date();
      }
      await enrollment.save();
    }

    const populated = await QuizAttempt.findById(attempt._id).populate('answers.question');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/quizzes/attempts', async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .populate({ path: 'quiz', select: 'title course scheduledAt', populate: { path: 'course', select: 'title' } })
      .populate('answers.question')
      .sort({ completedAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id }).populate('course').sort({ issuedAt: -1 });
    res.json(certificates.filter((certificate) => certificate.course));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/courses/:courseId/materials', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId, status: 'approved' });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const now = new Date();
    const materialsWithStatus = course.materials
      .filter((material) => !material.scheduledAt || new Date(material.scheduledAt) <= now)
      .map((material, index) => ({
        ...material.toObject(),
        _id: index.toString(),
        viewed: enrollment.viewedMaterials?.some((viewed) => viewed.materialId === index.toString()) || false
      }));

    res.json(materialsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/courses/:courseId/materials/:materialId/view', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId, status: 'approved' });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const materialIndex = parseInt(req.params.materialId);
    if (Number.isNaN(materialIndex) || materialIndex < 0 || materialIndex >= course.materials.length) {
      return res.status(404).json({ message: 'Material not found' });
    }

    const alreadyViewed = enrollment.viewedMaterials?.some((viewed) => viewed.materialId === materialIndex.toString());
    if (!alreadyViewed) {
      enrollment.viewedMaterials = enrollment.viewedMaterials || [];
      enrollment.viewedMaterials.push({ materialId: materialIndex.toString(), viewedAt: new Date() });
      enrollment.progress = course.materials.length
        ? Math.round((enrollment.viewedMaterials.length / course.materials.length) * 100)
        : enrollment.progress;
      if (enrollment.progress >= 100 && !enrollment.completed) {
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

router.get('/profile', async (req, res) => {
  try {
    const user = await req.user.populate('profile');
    res.json({ ...user.profile?.toObject(), email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth, bio, education, studentId, department } = req.body;
    const user = await req.user.populate('profile');
    if (!user.profile) return res.status(404).json({ message: 'Profile not found' });

    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;
    if (address !== undefined) user.profile.address = address;
    if (dateOfBirth !== undefined) user.profile.dateOfBirth = dateOfBirth;
    if (bio !== undefined) user.profile.bio = bio;
    if (education !== undefined) user.profile.education = education;
    if (studentId !== undefined) user.profile.studentId = studentId;
    if (department !== undefined) user.profile.department = department;

    await user.profile.save();
    res.json({ ...user.profile.toObject(), email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const { avatarUpload } = require('../middleware/upload');
router.post('/profile/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await req.user.populate('profile');
    if (!user.profile) return res.status(404).json({ message: 'Profile not found' });

    user.profile.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.profile.save();
    res.json({ avatar: user.profile.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
