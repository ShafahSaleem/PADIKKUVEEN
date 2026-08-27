const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes & verify JWT token
const protect = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let token;

  if (req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'exampro_secret_key');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      return next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, invalid header format' });
  }
};

// Middleware to restrict access to admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = {
  protect,
  adminOnly,
};
