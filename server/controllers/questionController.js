const Exam = require('../models/Exam');
const Question = require('../models/Question');
const mongoose = require('mongoose');

// @desc    Create a new question for an exam (admin only)
// @route   POST /api/exams/:examId/questions
// @access  protect, adminOnly
const createQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const { questionText, options, correctAnswer, marks } = req.body;
    // Validate required fields
    if (!questionText || !options || !correctAnswer) {
      return res
        .status(400)
        .json({ message: 'questionText, options and correctAnswer are required' });
    }
    if (!Array.isArray(options) || options.length !== 4) {
      return res
        .status(400)
        .json({ message: 'Exactly 4 options must be provided' });
    }

    const question = await Question.create({
      exam: examId,
      questionText,
      options,
      correctAnswer,
      marks: marks || 1,
    });

    return res.status(201).json({ message: 'Question created', question });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error while creating question', error: error.message });
  }
};

// @desc    Get all questions for a specific exam (any authenticated user)
// @route   GET /api/exams/:examId/questions
// @access  protect
const getQuestionsByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const questions = await Question.find({ exam: examId }).select('-correctAnswer -__v');
    return res.status(200).json({ questions });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error while fetching questions', error: error.message });
  }
};

// @desc    Get a single question (any authenticated user, hide correctAnswer)
// @route   GET /api/questions/:id
// @access  protect
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const question = await Question.findById(id).select('-correctAnswer -__v');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json({ question });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error while fetching question', error: error.message });
  }
};

// @desc    Update a question (admin only)
// @route   PUT /api/questions/:id
// @access  protect, adminOnly
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const updates = req.body;
    if (updates.options && (!Array.isArray(updates.options) || updates.options.length !== 4)) {
      return res
        .status(400)
        .json({ message: 'If provided, options must be an array of exactly 4 strings' });
    }
    const allowed = ['questionText', 'options', 'correctAnswer', 'marks'];
    const filtered = {};
    for (const key of allowed) {
      if (key in updates) filtered[key] = updates[key];
    }
    const updated = await Question.findByIdAndUpdate(id, filtered, {
      new: true,
      runValidators: true,
    }).select('-correctAnswer -__v');
    if (!updated) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json({ message: 'Question updated', question: updated });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error while updating question', error: error.message });
  }
};

// @desc    Delete a question (admin only)
// @route   DELETE /api/questions/:id
// @access  protect, adminOnly
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Server error while deleting question', error: error.message });
  }
};

module.exports = {
  createQuestion,
  getQuestionsByExam,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
