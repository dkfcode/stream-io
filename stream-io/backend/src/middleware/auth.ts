import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { TokenPayload, AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Verify the token
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (payload.type !== 'access') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
      return;
    }

    // Get user from database
    const userQuery = `
      SELECT id, email, first_name, last_name, is_verified, created_at, updated_at, last_login_at
      FROM users 
      WHERE id = $1 AND is_verified = true
    `;
    
    const result = await pool.query(userQuery, [payload.user_id]);

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User not found or not verified'
      });
      return;
    }

    // Attach user and token info to request
    req.user = result.rows[0];
    req.token = payload;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    // Try to verify token, but don't fail if invalid
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      if (payload.type === 'access') {
        const userQuery = `
          SELECT id, email, first_name, last_name, is_verified, created_at, updated_at, last_login_at
          FROM users 
          WHERE id = $1 AND is_verified = true
        `;
        
        const result = await pool.query(userQuery, [payload.user_id]);

        if (result.rows.length > 0) {
          req.user = result.rows[0];
          req.token = payload;
        }
      }
    } catch (tokenError) {
      // Invalid token, but continue without user
      logger.debug('Optional auth token invalid:', tokenError);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(); // Continue even if error
  }
};

export const generateTokens = (user_id: string, email: string) => {
  const accessToken = jwt.sign(
    { 
      user_id, 
      email, 
      type: 'access' 
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      user_id, 
      email, 
      type: 'refresh' 
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return payload;
};

export const requireVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.is_verified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
    return;
  }
  next();
};

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const identifier = req.user?.id || (req as any).ip;
    const now = Date.now();
    
    const userRequests = requests.get(identifier);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        retry_after: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }
    
    userRequests.count++;
    next();
  };
}; 