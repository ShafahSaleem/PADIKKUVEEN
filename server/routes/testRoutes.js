const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public test route
router.get('/', (req, res) => {
  res.json({ message: 'ExamPro API is working' });
});

// Protected test route (Any authenticated user)
router.get('/protected', protect, (req, res) => {
  res.json({
    message: 'Protected route accessed successfully',
    user: req.user,
  });
});

// Admin-only test route (Authenticated admin only)
router.get('/admin', protect, adminOnly, (req, res) => {
  res.json({
    message: 'Admin route accessed successfully',
    user: req.user,
  });
});

module.exports = router;
