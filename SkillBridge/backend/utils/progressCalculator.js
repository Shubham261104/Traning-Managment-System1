const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Calculates weighted learning progress for a student in a course
 * Weights:
 * - Module Progress: 40%
 * - Content / Material Progress: 25%
 * - Assignment Progress: 20%
 * - Quiz Progress: 15%
 */
const calculateLearningProgress = async (studentId, courseId) => {
  try {
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId, status: 'approved' });
    if (!enrollment) return null;

    const course = await Course.findById(courseId);
    if (!course) return null;

    // 1. Content / Material Progress (25%)
    const totalMaterials = course.materials?.length || 0;
    const viewedMaterialsCount = enrollment.viewedMaterials?.length || 0;
    const contentProgress = totalMaterials > 0
      ? Math.min(100, (viewedMaterialsCount / totalMaterials) * 100)
      : 100;

    // 2. Module Progress (40%)
    // If course has explicit modules, calculate completed modules; otherwise base on contentProgress
    let moduleProgress = contentProgress;
    if (course.modules && course.modules.length > 0) {
      const completedModules = enrollment.completedModules?.length || 0;
      moduleProgress = Math.min(100, (completedModules / course.modules.length) * 100);
    }

    // 3. Assignment Progress (20%)
    const activeAssignments = await Assignment.find({ course: courseId, isActive: true });
    let assignmentProgress = 100;
    let submittedAssignmentsCount = 0;
    if (activeAssignments.length > 0) {
      for (const assignment of activeAssignments) {
        const hasSubmitted = assignment.submissions?.some(
          sub => sub.student?.toString() === studentId.toString()
        );
        if (hasSubmitted) submittedAssignmentsCount++;
      }
      assignmentProgress = Math.min(100, (submittedAssignmentsCount / activeAssignments.length) * 100);
    }

    // 4. Quiz Progress (15%)
    const activeQuizzes = await Quiz.find({ course: courseId, isActive: true });
    let quizProgress = 100;
    let completedQuizzesCount = 0;
    if (activeQuizzes.length > 0) {
      const attempts = await QuizAttempt.find({
        student: studentId,
        quiz: { $in: activeQuizzes.map(q => q._id) }
      });
      const attemptedQuizIds = new Set(attempts.map(a => a.quiz?.toString()));
      completedQuizzesCount = attemptedQuizIds.size;
      quizProgress = Math.min(100, (completedQuizzesCount / activeQuizzes.length) * 100);
    }

    // Overall Weighted Progress
    const overallProgress = Math.min(100, Math.round(
      (moduleProgress * 0.40) +
      (contentProgress * 0.25) +
      (assignmentProgress * 0.20) +
      (quizProgress * 0.15)
    ));

    // Update Enrollment
    enrollment.progress = overallProgress;
    if (overallProgress >= 100 && !enrollment.completed) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();
    }
    await enrollment.save();

    return {
      progress: overallProgress,
      breakdown: {
        moduleProgress: Math.round(moduleProgress),
        contentProgress: Math.round(contentProgress),
        assignmentProgress: Math.round(assignmentProgress),
        quizProgress: Math.round(quizProgress)
      },
      counts: {
        viewedMaterials: viewedMaterialsCount,
        totalMaterials,
        submittedAssignments: submittedAssignmentsCount,
        totalAssignments: activeAssignments.length,
        completedQuizzes: completedQuizzesCount,
        totalQuizzes: activeQuizzes.length
      },
      completed: enrollment.completed
    };
  } catch (err) {
    console.error('Error calculating learning progress:', err);
    return null;
  }
};

module.exports = { calculateLearningProgress };
