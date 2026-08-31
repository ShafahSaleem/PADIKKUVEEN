const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Category = require('../models/Category');
const ExamAttempt = require('../models/ExamAttempt');

// Fisher-Yates shuffle helper
const shuffleArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  const cloned = [...arr];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
};

// @desc    Create a new exam (admin only)
// @route   POST /api/exams
// @access  protect, adminOnly
const createExam = async (req, res) => {
  try {
    const { title, description, duration, totalMarks, category, passingPercentage, numberOfQuestions, assignedStudents } =
      req.body;

    // Basic validation
    if (!title || !duration || !totalMarks) {
      return res.status(400).json({ message: 'Title, duration, and totalMarks are required' });
    }

    const examData = {
      title,
      description,
      duration,
      totalMarks,
      passingPercentage: typeof passingPercentage === 'number' ? passingPercentage : 50,
      numberOfQuestions: typeof numberOfQuestions === 'number' && numberOfQuestions > 0 ? numberOfQuestions : null,
      assignedStudents: Array.isArray(assignedStudents) ? assignedStudents : [],
      createdBy: req.user.id,
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      examData.category = category;
    }

    const exam = await Exam.create(examData);

    // Automatically send notification to all students
    try {
      const User = require('../models/User');
      const { createSystemNotification } = require('./notificationController');
      const students = await User.find({ role: 'student' }).select('_id');
      if (students.length > 0) {
        await createSystemNotification({
          userIds: students.map((s) => s._id),
          title: '🎓 New Exam Available',
          message: `"${title}" is now available to take.`,
          type: 'exam',
          link: '/student-dashboard',
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch new exam notification:', notifErr);
    }

    const examObj = exam.toObject ? exam.toObject() : exam;
    examObj.totalQuestions = 0;
    examObj.questionCount = 0;

    return res.status(201).json({
      message: 'Exam created successfully',
      exam: examObj,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while creating exam', error: error.message });
  }
};

// @desc    Get all active exams (with student assignment filtering)
// @route   GET /api/exams
// @access  protect
const getExams = async (req, res) => {
  try {
    const { category, all } = req.query;
    const query = all === 'true' ? {} : { isActive: true };

    if (category && category !== 'all' && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    let exams = await Exam.find(query)
      .populate('category', 'name icon enabled description')
      .select('-__v')
      .sort({ createdAt: -1 });

    // For non-admin listing, filter out any exams assigned to disabled categories
    if (all !== 'true') {
      exams = exams.filter((e) => !e.category || e.category.enabled !== false);
    }

    // STUDENT ACCESS CONTROL: Students see ONLY active exams assigned to them by their mentor
    if (req.user?.role === 'student') {
      const studentIdStr = req.user.id || req.user._id?.toString();
      exams = exams.filter((e) => {
        return (
          Array.isArray(e.assignedStudents) &&
          e.assignedStudents.some((id) => id.toString() === studentIdStr)
        );
      });
    }

    // Dynamically calculate actual question count for each exam
    const questionCounts = await Question.aggregate([
      { $group: { _id: '$exam', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    questionCounts.forEach((qc) => {
      if (qc._id) {
        countMap[qc._id.toString()] = qc.count;
      }
    });

    const examsWithCount = exams.map((exam) => {
      const examObj = exam.toObject ? exam.toObject() : exam;
      const count = countMap[exam._id.toString()] || 0;
      return {
        ...examObj,
        totalQuestions: count,
        questionCount: count,
      };
    });

    return res.status(200).json({ exams: examsWithCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while fetching exams', error: error.message });
  }
};

// @desc    Get a single exam by ID
// @route   GET /api/exams/:id
// @access  protect
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }
    const exam = await Exam.findById(id)
      .populate('category', 'name icon enabled description')
      .select('-__v');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STUDENT ACCESS CHECK: Verify student is assigned to this exam
    if (req.user?.role === 'student') {
      const studentIdStr = req.user.id || req.user._id?.toString();
      const isAssigned =
        Array.isArray(exam.assignedStudents) &&
        exam.assignedStudents.some((sId) => sId.toString() === studentIdStr);
      if (!isAssigned) {
        return res.status(403).json({ message: 'Forbidden: You are not assigned to this exam' });
      }
    }

    const questionCount = await Question.countDocuments({ exam: id });
    const examObj = exam.toObject ? exam.toObject() : exam;
    examObj.totalQuestions = questionCount;
    examObj.questionCount = questionCount;

    return res.status(200).json({ exam: examObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while fetching exam', error: error.message });
  }
};

// @desc    Update an exam (admin only)
// @route   PUT /api/exams/:id
// @access  protect, adminOnly
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }
    const updates = req.body;
    const allowedUpdates = [
      'title',
      'description',
      'duration',
      'totalMarks',
      'passingPercentage',
      'numberOfQuestions',
      'category',
      'isActive',
      'assignedStudents',
    ];
    const updateFields = {};
    for (const key of allowedUpdates) {
      if (key in updates) {
        if (key === 'category' && updates[key] && !mongoose.Types.ObjectId.isValid(updates[key])) {
          continue;
        }
        if (key === 'numberOfQuestions') {
          updateFields[key] =
            typeof updates[key] === 'number' && updates[key] > 0
              ? updates[key]
              : updates[key] === '' || updates[key] === null
              ? null
              : updateFields[key];
          continue;
        }
        updateFields[key] = updates[key];
      }
    }
    const updatedExam = await Exam.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true })
      .populate('category', 'name icon enabled description')
      .select('-__v');
    if (!updatedExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const questionCount = await Question.countDocuments({ exam: id });
    const examObj = updatedExam.toObject ? updatedExam.toObject() : updatedExam;
    examObj.totalQuestions = questionCount;
    examObj.questionCount = questionCount;

    return res.status(200).json({ message: 'Exam updated successfully', exam: examObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while updating exam', error: error.message });
  }
};

// @desc    Delete an exam (admin only)
// @route   DELETE /api/exams/:id
// @access  protect, adminOnly
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }
    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    await Promise.all([
      Question.deleteMany({ exam: id }),
      ExamAttempt.deleteMany({ exam: id }),
    ]);
    return res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while deleting exam', error: error.message });
  }
};

// @desc    Start or resume an exam attempt with randomized questions (Fixed options order)
// @route   POST /api/exams/:examId/start
// @access  Private / Student
const startExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    const { retry } = req.body;
    const studentId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId).populate('category', 'name icon');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    if (!exam.isActive) {
      return res.status(400).json({ message: 'Exam is not currently active' });
    }

    // STUDENT ACCESS CHECK: Verify student is assigned to this exam
    if (req.user?.role === 'student') {
      const studentIdStr = studentId.toString();
      if (Array.isArray(exam.assignedStudents) && exam.assignedStudents.length > 0) {
        const isAssigned = exam.assignedStudents.some((sId) => sId.toString() === studentIdStr);
        if (!isAssigned) {
          return res.status(403).json({ message: 'Forbidden: You are not assigned to this exam' });
        }
      }
    }

    // 1. Check for active in-progress attempt if not requesting a new retry
    if (!retry) {
      const activeAttempt = await ExamAttempt.findOne({
        student: studentId,
        exam: examId,
        status: 'in-progress',
      }).sort({ startedAt: -1 });

      if (activeAttempt && activeAttempt.questions?.length > 0) {
        const clientQuestions = activeAttempt.questions.map((item) => ({
          _id: item.question.toString(),
          id: item.question.toString(),
          questionText: item.questionText,
          options: item.options,
          marks: item.marks,
        }));

        return res.status(200).json({
          attemptId: activeAttempt._id,
          exam,
          questions: clientQuestions,
          startedAt: activeAttempt.startedAt,
          isResumed: true,
        });
      }
    } else {
      // Expire previous in-progress attempts
      await ExamAttempt.updateMany(
        { student: studentId, exam: examId, status: 'in-progress' },
        { status: 'expired' }
      );
    }

    // 2. Fetch all questions for this exam
    const allQuestions = await Question.find({ exam: examId });
    if (!allQuestions || allQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions found for this exam' });
    }

    // Determine target question count
    const targetCount =
      exam.numberOfQuestions &&
      exam.numberOfQuestions > 0 &&
      exam.numberOfQuestions <= allQuestions.length
        ? exam.numberOfQuestions
        : allQuestions.length;

    // Randomize question selection
    const shuffledQuestionPool = shuffleArray(allQuestions);
    const selectedQuestions = shuffledQuestionPool.slice(0, targetCount);

    console.log(`Total question bank: ${allQuestions.length}`);
    console.log(`Questions per attempt: ${exam.numberOfQuestions || 'All'}`);
    console.log(`Selected questions: ${selectedQuestions.length}`);

    // Prepare attempt questions with FIXED options order (Do NOT shuffle options)
    const attemptQuestions = selectedQuestions.map((q) => ({
      question: q._id,
      questionText: q.questionText,
      options: [...q.options],
      marks: q.marks || 1,
    }));

    // Create and save new attempt
    const newAttempt = await ExamAttempt.create({
      student: studentId,
      exam: examId,
      questions: attemptQuestions,
      startedAt: new Date(),
      status: 'in-progress',
    });

    console.log(`Attempt questions: ${newAttempt.questions.length}`);

    const clientQuestions = newAttempt.questions.map((item) => ({
      _id: item.question.toString(),
      id: item.question.toString(),
      questionText: item.questionText,
      options: item.options,
      marks: item.marks,
    }));

    return res.status(200).json({
      attemptId: newAttempt._id,
      exam,
      questions: clientQuestions,
      startedAt: newAttempt.startedAt,
      isResumed: false,
    });
  } catch (error) {
    console.error('Error starting exam attempt:', error);
    return res.status(500).json({
      message: 'Server error while starting exam attempt',
      error: error.message,
    });
  }
};

// @desc    Get active attempt details
// @route   GET /api/exams/:examId/attempt/:attemptId
// @access  Private / Student
const getExamAttempt = async (req, res) => {
  try {
    const { examId, attemptId } = req.params;
    const studentId = req.user?.id || req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: 'Invalid attempt ID' });
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    if (attempt.student.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this attempt' });
    }

    const exam = await Exam.findById(examId).populate('category', 'name icon');

    const clientQuestions = attempt.questions.map((item) => ({
      _id: item.question.toString(),
      id: item.question.toString(),
      questionText: item.questionText,
      options: item.options,
      marks: item.marks,
    }));

    console.log(`Returning questions: ${clientQuestions.length}`);

    return res.status(200).json({
      attemptId: attempt._id,
      exam,
      questions: clientQuestions,
      startedAt: attempt.startedAt,
      status: attempt.status,
    });
  } catch (error) {
    console.error('Error fetching exam attempt:', error);
    return res.status(500).json({
      message: 'Server error while retrieving attempt',
      error: error.message,
    });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  startExamAttempt,
  getExamAttempt,
};
