const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  startExamAttempt,
  getExamAttempt,
} = require('../controllers/examController');
const { submitExam } = require('../controllers/resultController');

// Create exam (admin only)
router.post('/', protect, adminOnly, createExam);

// Start or resume an exam attempt with randomized questions
router.post('/:examId/start', protect, startExamAttempt);

// Get attempt details
router.get('/:examId/attempt/:attemptId', protect, getExamAttempt);

// Submit exam attempt (supports both /:examId/attempt/:attemptId/submit and /:examId/submit)
router.post('/:examId/attempt/:attemptId/submit', protect, submitExam);
router.post('/:examId/submit', protect, submitExam);

// Get all active exams (students see ONLY mentor-assigned exams)
router.get('/', protect, getExams);
router.get('/student/exams', protect, getExams);

// Get single exam by ID (any authenticated user, verifies assignment)
router.get('/:id', protect, getExamById);

// Update exam (admin only)
router.put('/:id', protect, adminOnly, updateExam);

// Delete exam (admin only)
router.delete('/:id', protect, adminOnly, deleteExam);

module.exports = router;
