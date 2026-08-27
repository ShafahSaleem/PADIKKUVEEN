const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation: Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      status: 'active',
    });

    // Return response without password
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Check required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If user registered only with Google and has no password
    if (!user.password && user.googleId) {
      return res.status(400).json({
        message: 'This account was created with Google Sign-In. Please sign in using Continue with Google.',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'exampro_secret_key',
      { expiresIn: '7d' }
    );

    // Return response without password
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Google OAuth Sign-In / Sign-Up
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      console.warn('[Google Auth] 400: No credential provided in request body');
      return res.status(400).json({
        message: 'Google credential (ID token) is required.',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const isRealClientIdConfigured =
      clientId &&
      !clientId.includes('your_google_client_id_here') &&
      clientId.trim() !== '';

    console.log(
      '[Google Auth] Verifying Google ID token. Client ID configured:',
      isRealClientIdConfigured
    );

    let payload;
    try {
      const client = new OAuth2Client(isRealClientIdConfigured ? clientId : undefined);
      
      const verifyOptions = { idToken: credential };
      if (isRealClientIdConfigured) {
        verifyOptions.audience = clientId;
      }

      const ticket = await client.verifyIdToken(verifyOptions);
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[Google Auth] Verification error:', verifyErr.message);
      return res.status(401).json({
        message: `Google authentication failed: ${verifyErr.message || 'Invalid or expired token.'}`,
      });
    }

    if (!payload || !payload.email) {
      console.warn('[Google Auth] 400: Payload missing email');
      return res.status(400).json({
        message: 'Unable to retrieve email from verified Google account.',
      });
    }

    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase();

    console.log(`[Google Auth] Token verified successfully for user: ${name} (${normalizedEmail})`);

    // 1. Try finding user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2. If not found by googleId, find by email
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // Link Google ID to existing account
        user.googleId = googleId;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
        console.log(`[Google Auth] Associated Google ID with existing user: ${user.email}`);
      } else {
        // 3. Create new user (Always assign student role for new Google signups!)
        user = await User.create({
          name: name || 'Google User',
          email: normalizedEmail,
          googleId,
          avatar: picture || '',
          role: 'student',
          status: 'active',
        });
        console.log(`[Google Auth] Created new student user: ${user.email}`);
      }
    }

    // Check account status
    if (user.status === 'inactive') {
      return res.status(403).json({
        message: 'Your account is inactive. Please contact an administrator.',
      });
    }

    // Generate existing application JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'exampro_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    console.error('[Google Auth] Server Error:', error.message);
    return res.status(500).json({
      message: 'Server error during Google authentication',
      error: error.message,
    });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  getProfile,
};
