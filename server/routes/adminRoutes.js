const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getRecentActivity,
  getMentors,
  getMentorAssignments,
  assignStudentMentor,
  removeStudentMentor,
  createMentor,
} = require('../controllers/adminController');

// GET /api/admin/stats (Protected, Admin Only)
router.get('/stats', protect, adminOnly, getAdminStats);

// GET /api/admin/users (Protected, Admin Only)
router.get('/users', protect, adminOnly, getAllUsers);

// DELETE /api/admin/users/:id (Protected, Admin Only)
router.delete('/users/:id', protect, adminOnly, deleteUser);

// GET /api/admin/recent-activity (Protected, Admin Only)
router.get('/recent-activity', protect, adminOnly, getRecentActivity);

// Mentor Management Routes (Admin Only)
// GET /api/admin/mentors
router.get('/mentors', protect, adminOnly, getMentors);

// GET /api/admin/mentor-assignments
router.get('/mentor-assignments', protect, adminOnly, getMentorAssignments);

// POST /api/admin/mentors
router.post('/mentors', protect, adminOnly, createMentor);

// PUT /api/admin/students/:studentId/mentor
router.put('/students/:studentId/mentor', protect, adminOnly, assignStudentMentor);

// DELETE /api/admin/students/:studentId/mentor
router.delete('/students/:studentId/mentor', protect, adminOnly, removeStudentMentor);

module.exports = router;
