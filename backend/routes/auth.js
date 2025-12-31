const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Hash admin password on startup (in production, use proper user management)
let ADMIN_PASSWORD_HASH;
bcrypt.hash(ADMIN_PASSWORD, 10).then(hash => {
  ADMIN_PASSWORD_HASH = hash;
  console.log('✅ Admin credentials initialized');
});

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password required'
      });
    }

    // Check username
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const token = jwt.sign(
      {
        username,
        loginTime: new Date().toISOString()
      },
      JWT_SECRET,
      { expiresIn }
    );

    res.json({
      success: true,
      token,
      user: {
        username,
        role: 'admin'
      },
      expiresIn
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future session management
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/verify
 * Verify current token validity
 */
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      valid: true,
      user: {
        username: decoded.username,
        role: 'admin'
      }
    });

  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Unauthorized',
      message: error.message
    });
  }
});

module.exports = router;
