const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createQuestion,
  getQuestionsByExam,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');

// Create a question for a specific exam (admin only)
router.post('/exams/:examId/questions', protect, adminOnly, createQuestion);

// Get all questions for a specific exam (any authenticated user)
router.get('/exams/:examId/questions', protect, getQuestionsByExam);

// Get a single question (any authenticated user, hide correctAnswer)
router.get('/questions/:id', protect, getQuestionById);

// Update a question (admin only)
router.put('/questions/:id', protect, adminOnly, updateQuestion);

// Delete a question (admin only)
router.delete('/questions/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
