const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  getProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);

module.exports = router;
