const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createAdminNotification,
  deleteNotification,
} = require('../controllers/notificationController');

// GET /api/notifications - Get logged-in user notifications
router.get('/', protect, getMyNotifications);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', protect, markAllAsRead);

// PATCH /api/notifications/:id/read - Mark one as read
router.patch('/:id/read', protect, markAsRead);

// POST /api/notifications - Admin create/broadcast notification
router.post('/', protect, adminOnly, createAdminNotification);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;
