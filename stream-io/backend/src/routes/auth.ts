import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { validate, schemas } from '../middleware/validation';
import { authenticateToken, generateTokens, verifyRefreshToken } from '../middleware/auth';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  User,
  AuthenticatedRequest
} from '../types';

const router = Router();

// Rate limiting for auth endpoints
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.'
  }
});

// Register endpoint
router.post('/register', registerLimiter, validate(schemas.register), async (req, res) => {
  try {
    const { email, password, first_name, last_name }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, verification_token, verification_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, is_verified, created_at
    `;

    const result = await pool.query(userQuery, [
      email.toLowerCase(),
      password_hash,
      first_name || null,
      last_name || null,
      verification_token,
      verification_expires_at
    ]);

    const user = result.rows[0];

    // Generate tokens (even for unverified users, they can verify later)
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Store refresh token
    const sessionQuery = `
      INSERT INTO user_sessions (user_id, refresh_token, expires_at, device_info, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: 'web'
    };

    await pool.query(sessionQuery, [
      user.id,
      refreshToken,
      expiresAt,
      JSON.stringify(deviceInfo),
      req.ip
    ]);

    logger.info(`User registered: ${user.email}`);

    // TODO: Send verification email
    // For now, we'll auto-verify in development
    if (process.env.NODE_ENV === 'development') {
      await pool.query(
        'UPDATE users SET is_verified = true WHERE id = $1',
        [user.id]
      );
      user.is_verified = true;
    }

    const response: AuthResponse = {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 15 * 60 // 15 minutes
    };

    res.status(201).json({
      success: true,
      data: response,
      message: 'User registered successfully'
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Get user
    const userQuery = `
      SELECT id, email, password_hash, first_name, last_name, is_verified, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;

    const result = await pool.query(userQuery, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Store refresh token
    const sessionQuery = `
      INSERT INTO user_sessions (user_id, refresh_token, expires_at, device_info, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: 'web'
    };

    await pool.query(sessionQuery, [
      user.id,
      refreshToken,
      expiresAt,
      JSON.stringify(deviceInfo),
      req.ip
    ]);

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password_hash from response
    delete user.password_hash;

    logger.info(`User logged in: ${user.email}`);

    const response: AuthResponse = {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 15 * 60 // 15 minutes
    };

    res.json({
      success: true,
      data: response,
      message: 'Login successful'
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', validate(schemas.refreshToken), async (req, res) => {
  try {
    const { refresh_token } = req.body;

    // Verify refresh token
    const payload = verifyRefreshToken(refresh_token);

    // Check if refresh token exists in database
    const sessionQuery = `
      SELECT us.*, u.email, u.is_verified 
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.refresh_token = $1 AND us.expires_at > CURRENT_TIMESTAMP
    `;

    const result = await pool.query(sessionQuery, [refresh_token]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const session = result.rows[0];

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.user_id, 
      session.email
    );

    // Update refresh token in database
    const updateQuery = `
      UPDATE user_sessions 
      SET refresh_token = $1, last_used_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    await pool.query(updateQuery, [newRefreshToken, session.id]);

    // Get user data
    const userQuery = `
      SELECT id, email, first_name, last_name, is_verified, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;

    const userResult = await pool.query(userQuery, [session.user_id]);
    const user = userResult.rows[0];

    const response: AuthResponse = {
      user,
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 15 * 60 // 15 minutes
    };

    res.json({
      success: true,
      data: response,
      message: 'Tokens refreshed successfully'
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      // Remove specific session
      await pool.query(
        'DELETE FROM user_sessions WHERE refresh_token = $1',
        [refresh_token]
      );
    } else {
      // Remove all sessions for user
      await pool.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [req.user!.id]
      );
    }

    logger.info(`User logged out: ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
      message: 'User data retrieved successfully'
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

// Verify email endpoint (placeholder)
router.post('/verify-email', validate(schemas.verifyEmail), async (req, res) => {
  try {
    const { token } = req.body;

    const userQuery = `
      UPDATE users 
      SET is_verified = true, verification_token = null, verification_expires_at = null
      WHERE verification_token = $1 AND verification_expires_at > CURRENT_TIMESTAMP
      RETURNING id, email
    `;

    const result = await pool.query(userQuery, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    const user = result.rows[0];
    logger.info(`Email verified: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

export default router; 