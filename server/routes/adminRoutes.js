const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getRecentActivity,
} = require('../controllers/adminController');

// GET /api/admin/stats (Protected, Admin Only)
router.get('/stats', protect, adminOnly, getAdminStats);

// GET /api/admin/users (Protected, Admin Only)
router.get('/users', protect, adminOnly, getAllUsers);

// DELETE /api/admin/users/:id (Protected, Admin Only)
router.delete('/users/:id', protect, adminOnly, deleteUser);

// GET /api/admin/recent-activity (Protected, Admin Only)
router.get('/recent-activity', protect, adminOnly, getRecentActivity);

module.exports = router;
