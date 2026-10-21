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
const QuizQuestion = require('../models/QuizQuestion');
const { calculateLearningProgress } = require('../utils/progressCalculator');

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

const filterDuplicateAttempts = (attempts) => {
  return attempts.filter((attempt, index, self) => {
    if (attempt.percentage === 0 && attempt.score === 0) {
      const hasRealAttemptNearby = self.some((other, oIdx) => {
        if (oIdx === index) return false;
        const quizId1 = String(other.quiz?._id || other.quiz || '');
        const quizId2 = String(attempt.quiz?._id || attempt.quiz || '');
        if (quizId1 !== quizId2) return false;
        const t1 = new Date(other.createdAt || other.completedAt || 0).getTime();
        const t2 = new Date(attempt.createdAt || attempt.completedAt || 0).getTime();
        return Math.abs(t1 - t2) <= 30000 && (other.percentage || 0) > 0;
      });
      if (hasRealAttemptNearby) return false;
    }
    return true;
  });
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

const getStudentAttendanceRecords = async (studentId) => {
  const sessions = await Attendance.find({ 'records.student': studentId })
    .populate('course', 'title deliveryType')
    .sort({ classDate: -1 });

  const records = [];
  sessions.forEach((session) => {
    const r = session.records.find((rec) => rec.student && rec.student.toString() === studentId.toString());
    if (r) {
      records.push({
        _id: `${session._id}_${studentId}`,
        sessionId: session._id,
        course: session.course,
        classDate: session.classDate,
        status: r.status,
        notes: r.remark || '',
        createdAt: session.createdAt
      });
    }
  });
  return records;
};

const syncAbsentAttendance = async (studentId) => {
  try {
    const enrollments = await Enrollment.find({ student: studentId, status: 'approved' }).populate('course');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    for (const enrollment of enrollments) {
      const course = enrollment.course;
      if (!course || (course.deliveryType && course.deliveryType !== 'LIVE_CLASS')) continue;
      if (!course.sessionTimes?.length) continue;

      const startDate = course.startDate ? new Date(course.startDate) : null;
      const endDate = course.endDate ? new Date(course.endDate) : null;
      if (!startDate || isNaN(startDate.getTime())) continue;

      let enrolDate = enrollment.approvedAt || enrollment.createdAt || startDate;
      let startRange = new Date(Math.max(startDate.getTime(), new Date(enrolDate).getTime()));
      if (isNaN(startRange.getTime())) startRange = new Date(now);

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const endLimit = (endDate && !isNaN(endDate.getTime()) && endDate < yesterday) ? endDate : yesterday;

      for (let d = new Date(startRange); d <= endLimit; d.setDate(d.getDate() + 1)) {
        const dayName = dayNames[d.getDay()];
        const isClassDay = course.sessionTimes.some((session) => session.day === dayName);
        if (!isClassDay) continue;

        const classDateStr = d.toISOString().split('T')[0];
        if (classDateStr === todayStr) continue;

        let session = await Attendance.findOne({ course: course._id, classDate: classDateStr });
        if (!session) {
          session = new Attendance({
            course: course._id,
            instructor: course.instructor || studentId,
            classDate: classDateStr,
            records: [{
              student: studentId,
              status: 'absent',
              remark: 'Marked absent by system (missed class)',
              joinMethod: 'manual'
            }]
          });
          await session.save();
        } else {
          const hasRecord = session.records.some(r => r.student && r.student.toString() === studentId.toString());
          if (!hasRecord) {
            session.records.push({
              student: studentId,
              status: 'absent',
              remark: 'Marked absent by system (missed class)',
              joinMethod: 'manual'
            });
            await session.save();
          }
        }
      }
    }
  } catch (error) {
    console.error('Error syncing absent attendance:', error);
  }
};

const seedDummyCourseData = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) return;

    const title = course.title || 'Course';
    
    // 1. Seed dummy materials if course.materials is empty
    if (!course.materials || course.materials.length === 0) {
      course.materials = [
        {
          title: `Introduction to ${title}`,
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          type: 'pdf',
          description: `Comprehensive introductory slides and foundational notes library covering the core concepts of ${title}.`,
          fileName: 'intro_syllabus.pdf',
          fileSize: 1024 * 1024 * 1.5, // 1.5 MB
          scheduledAt: new Date(Date.now() - 3600 * 1000)
        },
        {
          title: `${title} Video Lecture: Beginners Tutorial`,
          url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          type: 'video',
          description: `Detailed primer videocast explaining the setup, tools, and basic environment config for ${title}.`,
          fileName: 'tutorial_beginners.mp4',
          fileSize: 1024 * 1024 * 12.8, // 12.8 MB
          scheduledAt: new Date(Date.now() - 3600 * 1000)
        },
        {
          title: `Advanced Topics & Modern Best Practices in ${title}`,
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          type: 'pdf',
          description: `Deep dive exploration of standard structural designs, architecture patterns, and optimization strategies for ${title}.`,
          fileName: 'advanced_best_practices.pdf',
          fileSize: 1024 * 1024 * 2.4, // 2.4 MB
          scheduledAt: new Date(Date.now() - 3600 * 1000)
        },
        {
          title: `Official Documentation & External References`,
          url: 'https://google.com',
          type: 'link',
          description: `Hand-curated collection of external wikis, community APIs, and official links for ${title}.`,
          fileName: '',
          fileSize: 0,
          scheduledAt: new Date(Date.now() - 3600 * 1000)
        }
      ];
      await course.save();
      console.log(`Seeded dummy materials for course: ${title}`);
    }

    // 2. Seed dummy quizzes if no quizzes exist for this course Id
    const Quiz = require('../models/Quiz');
    const existingQuiz = await Quiz.findOne({ course: courseId });
    if (!existingQuiz) {
      // Create quiz
      const quiz = await Quiz.create({
        course: courseId,
        title: `${title} Knowledge Check`,
        description: `Test your understanding of topics covered in the ${title} study materials. Ready, set, go!`,
        passingScore: 70,
        timeLimit: 15,
        createdBy: course.instructor || courseId,
        isActive: true,
        scheduledAt: new Date(Date.now() - 3600 * 1000)
      });

      // Create questions
      const q1 = await QuizQuestion.create({
        quiz: quiz._id,
        question: `Which of the following best describes the primary purpose of ${title}?`,
        type: 'multiple_choice',
        options: [
          { text: `Structuring complex workflows and core concepts in ${title}`, isCorrect: true },
          { text: 'Storing temporary garbage collections', isCorrect: false },
          { text: 'Formatting visual layouts of third-party emails', isCorrect: false },
          { text: 'Managing low-level system drivers', isCorrect: false }
        ],
        correctAnswer: `Structuring complex workflows and core concepts in ${title}`,
        points: 10
      });

      const q2 = await QuizQuestion.create({
        quiz: quiz._id,
        question: `True or False: Mastering ${title} involves practicing standard patterns and guidelines.`,
        type: 'true_false',
        options: [
          { text: 'true', isCorrect: true },
          { text: 'false', isCorrect: false }
        ],
        correctAnswer: 'true',
        points: 10
      });

      const q3 = await QuizQuestion.create({
        quiz: quiz._id,
        question: `What is a recommended best practice when implementing ${title}?`,
        type: 'multiple_choice',
        options: [
          { text: 'Ignoring errors and warnings', isCorrect: false },
          { text: 'Keeping code modules highly decoupled and reusable', isCorrect: true },
          { text: 'Writing everything in a single, massive file', isCorrect: false },
          { text: 'Hardcoding credential keys directly in public source', isCorrect: false }
        ],
        correctAnswer: 'Keeping code modules highly decoupled and reusable',
        points: 10
      });

      quiz.questions = [q1._id, q2._id, q3._id];
      await quiz.save();
      console.log(`Seeded dummy quiz for course: ${title}`);
    }
  } catch (error) {
    console.error('Error seeding dummy course data:', error);
  }
};

const getDashboardPayload = async (studentId) => {
  await syncAbsentAttendance(studentId);
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

  let approvedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'approved');

  let hasSeeded = false;
  for (const enrollment of approvedEnrollments) {
    const course = enrollment.course;
    if (course && (!course.materials || course.materials.length === 0)) {
      await seedDummyCourseData(course._id);
      hasSeeded = true;
    }
  }
  if (hasSeeded) {
    enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'email profile',
          populate: { path: 'profile', select: 'firstName lastName avatar' }
        }
      })
      .sort({ createdAt: -1 });
  }

  approvedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'approved');
  const certificates = (await Certificate.find({ student: studentId })
    .populate({
      path: 'course',
      populate: {
        path: 'instructor',
        select: 'email profile',
        populate: { path: 'profile', select: 'firstName lastName avatar title' }
      }
    })
    .populate({
      path: 'student',
      select: 'email profile',
      populate: { path: 'profile', select: 'firstName lastName avatar' }
    })
    .sort({ issuedAt: -1 }))
    .filter((certificate) => certificate.course);
  const rawAttempts = await QuizAttempt.find({ student: studentId })
    .populate({ path: 'quiz', select: 'title course scheduledAt', populate: { path: 'course', select: 'title' } })
    .sort({ completedAt: -1 });
  const attempts = filterDuplicateAttempts(rawAttempts);
  const attendance = await getStudentAttendanceRecords(studentId);
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
      coursesCompleted: approvedEnrollments.filter((enrollment) => enrollment.completed || enrollment.progress >= 100).length,
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

    // Auto-fix completed field for any enrollment at 100% progress
    for (let enrollment of enrollments) {
      if (enrollment.progress >= 100 && !enrollment.completed) {
        enrollment.completed = true;
        enrollment.completedAt = enrollment.completedAt || new Date();
        await enrollment.save();
      }
    }

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
    await syncAbsentAttendance(req.user._id);
    const records = await getStudentAttendanceRecords(req.user._id);
    const presentCount = records.filter((record) => ['present', 'late'].includes(record.status)).length;
    res.json({
      records,
      percentage: records.length ? Math.round((presentCount / records.length) * 100) : 0
    });
  } catch (error) {
    console.error('Error getting student attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/attendance', async (req, res) => {
  return res.status(403).json({
    message: 'Attendance marking is restricted to course instructors only. Students can view their attendance records.'
  });
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

    await seedDummyCourseData(req.params.courseId);

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
    const { answers = [], timeSpent } = req.body;
    const quiz = await Quiz.findById(req.params.quizId).populate('questions');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course, status: 'approved' });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    // Prevent duplicate attempts submitted within 15 seconds
    const recentAttempt = await QuizAttempt.findOne({
      student: req.user._id,
      quiz: quiz._id,
      createdAt: { $gte: new Date(Date.now() - 15000) }
    }).sort({ createdAt: -1 }).populate('answers.question');

    if (recentAttempt) {
      return res.status(200).json(recentAttempt);
    }

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
    const rawAttempts = await QuizAttempt.find({ student: req.user._id })
      .populate({ path: 'quiz', select: 'title course scheduledAt', populate: { path: 'course', select: 'title' } })
      .populate('answers.question')
      .sort({ completedAt: -1 });

    const attempts = filterDuplicateAttempts(rawAttempts);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/quizzes/available', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id, status: 'approved' }).select('course');
    const courseIds = enrollments.map((e) => e.course);

    // Seed dummy data for each course that is missing quizzes/materials
    for (const courseId of courseIds) {
      await seedDummyCourseData(courseId);
    }

    const quizzes = await Quiz.find({
      course: { $in: courseIds },
      isActive: true,
      scheduledAt: { $lte: new Date() }
    }).populate('course', 'title').populate('questions');

    // Attach attempt info
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .select('quiz percentage passed completedAt');

    const quizzesWithAttempts = quizzes.map((quiz) => {
      const quizAttempts = attempts.filter((a) => a.quiz?.toString() === quiz._id.toString());
      let bestAttempt = null;
      if (quizAttempts.length > 0) {
        bestAttempt = quizAttempts.reduce((max, current) => 
          (current.percentage > (max ? max.percentage : -1)) ? current : max
        , null);
      }
      return {
        ...quiz.toObject(),
        attempt: bestAttempt
      };
    });

    res.json(quizzesWithAttempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/certificates', async (req, res) => {
  try {
    // Auto-generate certificates for completed enrollments if missing
    const completedEnrollments = await Enrollment.find({
      student: req.user._id,
      status: 'approved',
      $or: [{ completed: true }, { progress: { $gte: 100 } }]
    });

    for (const enrollment of completedEnrollments) {
      if (!enrollment.course) continue;
      const existingCert = await Certificate.findOne({
        student: req.user._id,
        course: enrollment.course
      });

      if (!existingCert) {
        const certNumber = Math.floor(100000 + Math.random() * 900000);
        const certCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const certificateId = `SKB-${certNumber}-${certCode}`;
        const verificationCode = Math.random().toString(36).substring(2, 15).toUpperCase();
        await Certificate.create({
          student: req.user._id,
          course: enrollment.course,
          certificateId,
          verificationCode
        });
      }
    }

    const certificates = await Certificate.find({ student: req.user._id })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'email profile',
          populate: { path: 'profile', select: 'firstName lastName avatar title' }
        }
      })
      .populate({
        path: 'student',
        populate: { path: 'profile' }
      })
      .sort({ issuedAt: -1 });
    res.json(certificates.filter((certificate) => certificate.course));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/courses/:courseId/materials', async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId, status: 'approved' });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled in this course' });

    await seedDummyCourseData(req.params.courseId);

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
      await enrollment.save();
    }

    const progressData = await calculateLearningProgress(req.user._id, req.params.courseId);
    const updatedEnrollment = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });

    res.json({
      enrollment: updatedEnrollment || enrollment,
      progress: updatedEnrollment?.progress || enrollment.progress,
      completed: updatedEnrollment?.completed || false,
      progressData,
      viewedCount: updatedEnrollment?.viewedMaterials?.length || 0,
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
    const { firstName, lastName, phone, address, dateOfBirth, bio, education, studentId, department, avatar } = req.body;
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
    if (avatar !== undefined) user.profile.avatar = avatar;

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

router.delete('/profile/avatar', async (req, res) => {
  try {
    const user = await req.user.populate('profile');
    if (!user.profile) return res.status(404).json({ message: 'Profile not found' });

    user.profile.avatar = '';
    await user.profile.save();
    res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
