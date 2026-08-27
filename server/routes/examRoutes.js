const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
} = require('../controllers/examController');
const { submitExam } = require('../controllers/resultController');

// Create exam (admin only)
router.post('/', protect, adminOnly, createExam);
// Submit exam (students)
router.post('/:examId/submit', protect, submitExam);

// Get all active exams (any authenticated user)
router.get('/', protect, getExams);

// Get single exam by ID (any authenticated user)
router.get('/:id', protect, getExamById);

// Update exam (admin only)
router.put('/:id', protect, adminOnly, updateExam);

// Delete exam (admin only)
router.delete('/:id', protect, adminOnly, deleteExam);

module.exports = router;
