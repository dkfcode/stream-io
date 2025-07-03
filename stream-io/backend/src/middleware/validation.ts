import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../config/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
      return;
    }

    req.query = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
    first_name: Joi.string().min(1).max(100).optional(),
    last_name: Joi.string().min(1).max(100).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().min(1).max(100).optional(),
    last_name: Joi.string().min(1).max(100).optional()
  }),

  updatePreferences: Joi.object({
    selected_genres: Joi.array().items(Joi.string()).optional(),
    selected_services: Joi.array().items(Joi.string()).optional(),
    selected_providers: Joi.array().items(Joi.string()).optional(),
    language: Joi.string().length(2).optional(),
    region: Joi.string().length(2).optional(),
    timezone: Joi.string().optional(),
    theme: Joi.string().valid('light', 'dark').optional()
  }),

  updateSettings: Joi.object({
    notifications_enabled: Joi.boolean().optional(),
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    auto_play_trailers: Joi.boolean().optional(),
    mature_content: Joi.boolean().optional(),
    privacy_mode: Joi.boolean().optional(),
    data_sharing: Joi.boolean().optional()
  }),

  createWatchlist: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    is_public: Joi.boolean().default(false)
  }),

  updateWatchlist: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    is_public: Joi.boolean().optional()
  }),

  addToWatchlist: Joi.object({
    tmdb_id: Joi.number().integer().positive().required(),
    media_type: Joi.string().valid('movie', 'tv').required(),
    title: Joi.string().min(1).max(255).required(),
    poster_path: Joi.string().optional(),
    release_date: Joi.date().optional(),
    rating: Joi.number().min(0).max(10).optional(),
    genres: Joi.array().items(Joi.string()).optional(),
    streaming_platforms: Joi.array().items(Joi.object({
      provider_id: Joi.number().required(),
      provider_name: Joi.string().required(),
      logo_path: Joi.string().required(),
      display_priority: Joi.number().default(1)
    })).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  updateWatchlistItem: Joi.object({
    notes: Joi.string().max(1000).optional(),
    is_watched: Joi.boolean().optional(),
    watched_date: Joi.date().optional()
  }),

  search: Joi.object({
    query: Joi.string().min(1).max(255).required(),
    type: Joi.string().valid('general', 'ai', 'voice').default('general'),
    filters: Joi.object().optional()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

// UUID validation middleware
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuid || !uuidRegex.test(uuid)) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
      return;
    }
    
    next();
  };
}; 