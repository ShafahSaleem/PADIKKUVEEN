const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyResults,
  getMyPerformance,
  getResultById,
  deleteResult,
} = require('../controllers/resultController');

// GET /api/results/my - get logged-in student's results
router.get('/my', protect, getMyResults);

// GET /api/results/my-performance - get student performance summary & analytics
router.get('/my-performance', protect, getMyPerformance);

// GET /api/results/:id - get a single result (owner or admin)
router.get('/:id', protect, getResultById);

// DELETE /api/results/:id - delete a single result (owner student or admin)
router.delete('/:id', protect, deleteResult);

module.exports = router;
