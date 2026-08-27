const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Category = require('../models/Category');

// @desc    Create a new exam (admin only)
// @route   POST /api/exams
// @access  protect, adminOnly
const createExam = async (req, res) => {
  try {
    const { title, description, duration, totalMarks, category, passingPercentage } = req.body;

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

// @desc    Get all active exams
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
    const allowedUpdates = ['title', 'description', 'duration', 'totalMarks', 'passingPercentage', 'category', 'isActive'];
    const updateFields = {};
    for (const key of allowedUpdates) {
      if (key in updates) {
        if (key === 'category' && updates[key] && !mongoose.Types.ObjectId.isValid(updates[key])) {
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
    return res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error while deleting exam', error: error.message });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
};
