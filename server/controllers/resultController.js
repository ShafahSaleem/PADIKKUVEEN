const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Result = require('../models/Result');

const normalizeAnswer = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim().toLowerCase();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
};

const checkAnswerCorrectness = (studentAnswer, correctAnswer, options = []) => {
  if (!studentAnswer || !correctAnswer) return false;

  const sTrim = String(studentAnswer).trim();
  const cTrim = String(correctAnswer).trim();

  if (sTrim === cTrim) return true;
  if (sTrim.toLowerCase() === cTrim.toLowerCase()) return true;

  const sNorm = normalizeAnswer(sTrim);
  const cNorm = normalizeAnswer(cTrim);
  if (sNorm && cNorm && sNorm === cNorm) return true;

  // Check letter / index (A, B, C, D)
  const letters = ['a', 'b', 'c', 'd'];
  const sLetterIdx = letters.indexOf(sNorm);
  if (sLetterIdx !== -1 && options[sLetterIdx] && normalizeAnswer(options[sLetterIdx]) === cNorm) {
    return true;
  }
  const cLetterIdx = letters.indexOf(cNorm);
  if (cLetterIdx !== -1 && options[cLetterIdx] && normalizeAnswer(options[cLetterIdx]) === sNorm) {
    return true;
  }

  return false;
};

const ExamAttempt = require('../models/ExamAttempt');

/**
 * Submit an exam and calculate result
 */
const submitExam = async (req, res) => {
  try {
    const { examId, attemptId } = req.params;
    const { answers, attemptId: bodyAttemptId } = req.body;
    const studentId = req.user?.id || req.user?._id;
    const effectiveAttemptId = attemptId || bodyAttemptId;

    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    if (!studentId) {
      return res.status(401).json({ message: 'User identity not found in token' });
    }

    // Find exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    if (!exam.isActive) {
      return res.status(400).json({ message: 'Exam is not active' });
    }

    // Create lookup map for submitted answers
    const submittedAnswerMap = {};
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        if (ans && ans.question) {
          submittedAnswerMap[ans.question.toString()] = ans.selectedAnswer;
        }
      });
    }

    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    const answersToSave = [];
    let totalQuestions = 0;
    let calculatedTotalMarks = 0;
    let targetAttempt = null;

    // 1. If an attempt ID is provided or an active in-progress attempt exists
    if (effectiveAttemptId && mongoose.Types.ObjectId.isValid(effectiveAttemptId)) {
      targetAttempt = await ExamAttempt.findById(effectiveAttemptId);
    } else {
      targetAttempt = await ExamAttempt.findOne({
        student: studentId,
        exam: examId,
        status: 'in-progress',
      }).sort({ startedAt: -1 });
    }

    if (targetAttempt) {
      // Security check: verify student ownership
      if (targetAttempt.student.toString() !== studentId.toString()) {
        return res.status(403).json({ message: 'Forbidden: You cannot submit another student\'s attempt' });
      }

      // If attempt is already completed and has result, return existing result
      if (targetAttempt.status === 'completed' && targetAttempt.result) {
        const existingResult = await Result.findById(targetAttempt.result);
        if (existingResult) {
          return res.status(200).json({
            message: 'Exam already submitted',
            resultId: existingResult._id,
            result: existingResult,
          });
        }
      }

      // Load original questions from database to get genuine correct answers
      const attemptQuestionIds = targetAttempt.questions.map((q) => q.question);
      const originalQuestions = await Question.find({ _id: { $in: attemptQuestionIds } });
      const origQuestionMap = {};
      originalQuestions.forEach((q) => {
        origQuestionMap[q._id.toString()] = q;
      });

      totalQuestions = targetAttempt.questions.length;

      for (const item of targetAttempt.questions) {
        const qIdStr = item.question.toString();
        const origQ = origQuestionMap[qIdStr];
        const rawSelected = submittedAnswerMap[qIdStr];
        const selectedAnswer =
          rawSelected !== undefined && rawSelected !== null ? String(rawSelected).trim() : '';

        const correctAnswer = (origQ?.correctAnswer || '').trim();
        const options = Array.isArray(item.options) && item.options.length > 0
          ? item.options
          : Array.isArray(origQ?.options)
          ? origQ.options
          : [];
        const marks = typeof item.marks === 'number' && item.marks > 0 ? item.marks : 1;
        calculatedTotalMarks += marks;

        const isCorrect = checkAnswerCorrectness(selectedAnswer, correctAnswer, options);

        if (!selectedAnswer) {
          unanswered += 1;
        } else if (isCorrect) {
          correctAnswers += 1;
          score += marks;
        } else {
          wrongAnswers += 1;
        }

        answersToSave.push({
          question: item.question,
          questionText: item.questionText || origQ?.questionText || '',
          options: options,
          correctAnswer: correctAnswer,
          marks: marks,
          selectedAnswer: selectedAnswer,
          isCorrect: isCorrect,
        });
      }
    } else {
      // Fallback: evaluate on all current questions for this exam
      const examQuestions = await Question.find({ exam: examId });
      if (!examQuestions || examQuestions.length === 0) {
        return res.status(400).json({ message: 'No questions found for this exam' });
      }

      totalQuestions = examQuestions.length;

      for (const q of examQuestions) {
        const qIdStr = q._id.toString();
        const rawSelected = submittedAnswerMap[qIdStr];
        const selectedAnswer =
          rawSelected !== undefined && rawSelected !== null ? String(rawSelected).trim() : '';
        const correctAnswer = (q.correctAnswer || '').trim();
        const options = Array.isArray(q.options) ? q.options.map((opt) => String(opt).trim()) : [];
        const marks = typeof q.marks === 'number' && q.marks > 0 ? q.marks : 1;
        calculatedTotalMarks += marks;

        const isCorrect = checkAnswerCorrectness(selectedAnswer, correctAnswer, options);

        if (!selectedAnswer) {
          unanswered += 1;
        } else if (isCorrect) {
          correctAnswers += 1;
          score += marks;
        } else {
          wrongAnswers += 1;
        }

        answersToSave.push({
          question: q._id,
          questionText: q.questionText || '',
          options: options,
          correctAnswer: correctAnswer,
          marks: marks,
          selectedAnswer: selectedAnswer,
          isCorrect: isCorrect,
        });
      }
    }

    const totalMarks =
      calculatedTotalMarks > 0
        ? calculatedTotalMarks
        : exam.totalMarks && exam.totalMarks > 0
        ? exam.totalMarks
        : totalQuestions;
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;

    // Create Result document
    const result = await Result.create({
      exam: examId,
      student: studentId,
      score,
      totalMarks,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unanswered,
      percentage,
      answers: answersToSave,
      submittedAt: new Date(),
    });

    // Update attempt if present
    if (targetAttempt) {
      targetAttempt.status = 'completed';
      targetAttempt.submittedAt = new Date();
      targetAttempt.score = score;
      targetAttempt.totalMarks = totalMarks;
      targetAttempt.percentage = percentage;
      targetAttempt.result = result._id;
      await targetAttempt.save();
    }

    // Automatic Notification for Result Published
    try {
      const { createSystemNotification } = require('./notificationController');
      await createSystemNotification({
        userId: studentId,
        title: '🎉 Result Published',
        message: `Your result for "${exam.title || 'Exam'}" is ready.`,
        type: 'result',
        link: `/result/${result._id}`,
      });
    } catch (notifErr) {
      console.error('Failed to trigger result notification:', notifErr);
    }

    return res.status(200).json({
      message: 'Exam submitted successfully',
      resultId: result._id,
      result: {
        _id: result._id,
        exam: exam,
        student: {
          _id: studentId,
          name: req.user?.name || '',
          email: req.user?.email || '',
          role: req.user?.role || 'student',
        },
        score: result.score,
        totalMarks: result.totalMarks,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.wrongAnswers,
        unanswered: result.unanswered,
        percentage: result.percentage,
        submittedAt: result.submittedAt,
      },
    });
  } catch (error) {
    console.error("SUBMIT ERROR:", error);
    return res.status(500).json({ message: 'Server error during submission', error: error.message });
  }
};

/**
 * Get results of the currently logged-in student
 */
const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.id })
      .populate('exam', 'title description duration totalMarks')
      .sort({ submittedAt: -1 });
    return res.json({ results });
  } catch (err) {
    console.error('Get my results error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a single result by ID. Student can view own result; admin can view any.
 */
const getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid result ID' });
    }
    const result = await Result.findById(id)
      .populate('exam', 'title description duration totalMarks')
      .populate('student', 'name email role')
      .populate('answers.question', 'questionText options correctAnswer marks');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    // Authorization: admin or owner
    if (req.user.role !== 'admin' && result.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    // Always fetch questions for this exam to ensure guaranteed questionText & correctAnswer
    const examId = result.exam?._id || result.exam;
    let examQuestionsMap = {};
    if (examId) {
      const qList = await Question.find({ exam: examId });
      qList.forEach((q) => {
        examQuestionsMap[q._id.toString()] = q;
      });
    }

    const safeAnswers = (result.answers || []).map((a) => {
      const rawQId = a.question?._id ? a.question._id.toString() : (a.question ? a.question.toString() : '');
      const qFromMap = rawQId ? examQuestionsMap[rawQId] : null;
      const populatedQ = (a.question && typeof a.question === 'object' && a.question.questionText) ? a.question : null;

      const questionText = a.questionText || populatedQ?.questionText || qFromMap?.questionText || 'Question';
      const options = ((a.options && a.options.length > 0 ? a.options : (populatedQ?.options || qFromMap?.options)) || []).map(opt => String(opt).trim());
      const correctAnswer = (a.correctAnswer || populatedQ?.correctAnswer || qFromMap?.correctAnswer || '').trim();
      const marks = a.marks ?? populatedQ?.marks ?? qFromMap?.marks ?? 1;
      const selectedAnswer = (a.selectedAnswer || '').trim();

      const isCorrect = checkAnswerCorrectness(selectedAnswer, correctAnswer, options);

      return {
        questionId: rawQId,
        questionText,
        options,
        correctAnswer,
        marks,
        selectedAnswer,
        isCorrect,
      };
    });

    const totalQuestions = result.totalQuestions || result.answers?.length || 0;
    const correctAnswers = safeAnswers.filter((a) => a.isCorrect).length;
    const wrongAnswers = safeAnswers.filter((a) => !a.isCorrect && a.selectedAnswer).length;
    const unanswered = safeAnswers.filter((a) => !a.selectedAnswer).length;

    return res.json({
      result: {
        _id: result._id,
        exam: result.exam,
        student: result.student,
        score: result.score,
        totalMarks: result.totalMarks,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unanswered,
        percentage: result.percentage,
        submittedAt: result.submittedAt,
        answers: safeAnswers,
      },
    });
  } catch (err) {
    console.error('Get result by ID error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a single result by ID. (Owner student or Admin only)
 */
const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid result ID' });
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    const currentUserId = req.user?.id || req.user?._id;
    const currentUserRole = req.user?.role;

    // Security Authorization: student can only delete their own result; admin can delete any
    if (currentUserRole !== 'admin' && result.student.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this result' });
    }

    await Result.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Result deleted successfully' });
  } catch (err) {
    console.error('Delete result error:', err);
    return res.status(500).json({ message: 'Server error while deleting result', error: err.message });
  }
};

/**
 * GET /api/results/my-performance
 * Calculate student performance overview & stats:
 * - totalExams: number
 * - passedExams: number
 * - averageScore: number
 * - bestScore: number
 * - history: array of { id, examNumber, examTitle, score, totalMarks, percentage, isPassed, submittedAt } sorted chronologically
 * - recentExams: array of latest results
 */
const getMyPerformance = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const results = await Result.find({ student: studentId })
      .populate('exam', 'title description passingMarks passingPercentage totalMarks')
      .sort({ submittedAt: 1 }); // chronological for graph

    if (!results || results.length === 0) {
      return res.status(200).json({
        totalExams: 0,
        passedExams: 0,
        averageScore: 0,
        bestScore: 0,
        currentStreak: 0,
        bestStreak: 0,
        history: [],
        recentExams: [],
      });
    }

    const totalExams = results.length;
    let totalPercentage = 0;
    let bestScore = 0;
    let passedCount = 0;

    const formattedHistory = results.map((r, index) => {
      const percentage = Math.round(
        r.percentage ?? (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0)
      );
      // Determine pass based on exam passing marks / percentage or standard 50%
      const passingPercent = r.exam?.passingPercentage ?? 50;
      const isPassed = percentage >= passingPercent;

      if (isPassed) passedCount++;
      totalPercentage += percentage;
      if (percentage > bestScore) bestScore = percentage;

      return {
        id: r._id,
        examNumber: index + 1,
        examTitle: r.exam?.title || `Exam ${index + 1}`,
        score: r.score,
        totalMarks: r.totalMarks,
        percentage,
        isPassed,
        submittedAt: r.submittedAt,
        gamePlayed: r.gamePlayed,
      };
    });

    const averageScore = Math.round(totalPercentage / totalExams);
    // Recent exams: latest first
    const recentExams = [...formattedHistory].reverse().slice(0, 5);

    // Calculate Learning Streak based on unique active calendar days
    const uniqueDates = Array.from(
      new Set(
        results
          .map((r) => {
            const d = r.submittedAt || r.createdAt;
            if (!d) return null;
            const dateObj = new Date(d);
            return isNaN(dateObj.getTime()) ? null : dateObj.toISOString().split('T')[0];
          })
          .filter(Boolean)
      )
    ).sort();

    let currentStreak = 0;
    let bestStreak = 0;

    if (uniqueDates.length > 0) {
      // Convert YYYY-MM-DD to integer day numbers (UTC days since epoch)
      const dayNumbers = uniqueDates.map((dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24));
      });

      // Calculate best streak across all history
      let tempStreak = 1;
      bestStreak = 1;
      for (let i = 1; i < dayNumbers.length; i++) {
        if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      }

      // Calculate current streak relative to today
      const now = new Date();
      const todayDayNumber = Math.floor(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / (1000 * 60 * 60 * 24)
      );

      const lastActiveDay = dayNumbers[dayNumbers.length - 1];

      // If last activity was today or yesterday, streak is currently active
      if (lastActiveDay === todayDayNumber || lastActiveDay === todayDayNumber - 1) {
        currentStreak = 1;
        for (let i = dayNumbers.length - 1; i > 0; i--) {
          if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }
    }

    return res.status(200).json({
      totalExams,
      passedExams: passedCount,
      averageScore,
      bestScore,
      currentStreak,
      bestStreak,
      history: formattedHistory,
      recentExams,
    });
  } catch (err) {
    console.error('Error fetching student performance:', err);
    return res.status(500).json({ message: 'Failed to retrieve performance data' });
  }
};

module.exports = {
  submitExam,
  getMyResults,
  getMyPerformance,
  getResultById,
  deleteResult,
};
