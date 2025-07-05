import { Router } from 'express';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken, requireVerified } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { AuthenticatedRequest, UserPreferences, UserSettings } from '../types';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Get user preferences
router.get('/preferences', async (req: AuthenticatedRequest, res) => {
  try {
    const query = `
      SELECT id, user_id, selected_genres, selected_services, selected_providers,
             selected_broadcast_types, language, region, timezone, theme, created_at, updated_at
      FROM user_preferences 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [req.user!.id]);

    if (result.rows.length === 0) {
      // Create default preferences if none exist
      const createQuery = `
        INSERT INTO user_preferences (user_id)
        VALUES ($1)
        RETURNING id, user_id, selected_genres, selected_services, selected_providers,
                  selected_broadcast_types, language, region, timezone, theme, created_at, updated_at
      `;

      const createResult = await pool.query(createQuery, [req.user!.id]);
      return res.json({
        success: true,
        data: createResult.rows[0],
        message: 'Default preferences created'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Preferences retrieved successfully'
    });

  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences'
    });
  }
});

// Update user preferences
router.put('/preferences', validate(schemas.updatePreferences), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      selected_genres,
      selected_services,
      selected_providers,
      selected_broadcast_types,
      language,
      region,
      timezone,
      theme
    } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [req.user!.id];
    let paramCount = 1;

    if (selected_genres !== undefined) {
      updateFields.push(`selected_genres = $${++paramCount}`);
      values.push(selected_genres);
    }
    if (selected_services !== undefined) {
      updateFields.push(`selected_services = $${++paramCount}`);
      values.push(selected_services);
    }
    if (selected_providers !== undefined) {
      updateFields.push(`selected_providers = $${++paramCount}`);
      values.push(selected_providers);
    }
    if (selected_broadcast_types !== undefined) {
      updateFields.push(`selected_broadcast_types = $${++paramCount}`);
      values.push(selected_broadcast_types);
    }
    if (language !== undefined) {
      updateFields.push(`language = $${++paramCount}`);
      values.push(language);
    }
    if (region !== undefined) {
      updateFields.push(`region = $${++paramCount}`);
      values.push(region);
    }
    if (timezone !== undefined) {
      updateFields.push(`timezone = $${++paramCount}`);
      values.push(timezone);
    }
    if (theme !== undefined) {
      updateFields.push(`theme = $${++paramCount}`);
      values.push(theme);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const query = `
      UPDATE user_preferences 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING id, user_id, selected_genres, selected_services, selected_providers,
                selected_broadcast_types, language, region, timezone, theme, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // Create preferences if they don't exist
      const createQuery = `
        INSERT INTO user_preferences (
          user_id, selected_genres, selected_services, selected_providers,
          selected_broadcast_types, language, region, timezone, theme
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, selected_genres, selected_services, selected_providers,
                  selected_broadcast_types, language, region, timezone, theme, created_at, updated_at
      `;

      const createResult = await pool.query(createQuery, [
        req.user!.id,
        selected_genres || [],
        selected_services || [],
        selected_providers || [],
        selected_broadcast_types || [],
        language || 'en',
        region || 'US',
        timezone || 'America/New_York',
        theme || 'dark'
      ]);

      return res.json({
        success: true,
        data: createResult.rows[0],
        message: 'Preferences created successfully'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// Get user settings
router.get('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const query = `
      SELECT id, user_id, notifications_enabled, email_notifications, 
             push_notifications, auto_play_trailers, mature_content,
             privacy_mode, data_sharing, created_at, updated_at
      FROM user_settings 
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [req.user!.id]);

    if (result.rows.length === 0) {
      // Create default settings if none exist
      const createQuery = `
        INSERT INTO user_settings (user_id)
        VALUES ($1)
        RETURNING id, user_id, notifications_enabled, email_notifications, 
                  push_notifications, auto_play_trailers, mature_content,
                  privacy_mode, data_sharing, created_at, updated_at
      `;

      const createResult = await pool.query(createQuery, [req.user!.id]);
      return res.json({
        success: true,
        data: createResult.rows[0],
        message: 'Default settings created'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Settings retrieved successfully'
    });

  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
});

// Update user settings
router.put('/settings', validate(schemas.updateSettings), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      notifications_enabled,
      email_notifications,
      push_notifications,
      auto_play_trailers,
      mature_content,
      privacy_mode,
      data_sharing
    } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [req.user!.id];
    let paramCount = 1;

    if (notifications_enabled !== undefined) {
      updateFields.push(`notifications_enabled = $${++paramCount}`);
      values.push(notifications_enabled);
    }
    if (email_notifications !== undefined) {
      updateFields.push(`email_notifications = $${++paramCount}`);
      values.push(email_notifications);
    }
    if (push_notifications !== undefined) {
      updateFields.push(`push_notifications = $${++paramCount}`);
      values.push(push_notifications);
    }
    if (auto_play_trailers !== undefined) {
      updateFields.push(`auto_play_trailers = $${++paramCount}`);
      values.push(auto_play_trailers);
    }
    if (mature_content !== undefined) {
      updateFields.push(`mature_content = $${++paramCount}`);
      values.push(mature_content);
    }
    if (privacy_mode !== undefined) {
      updateFields.push(`privacy_mode = $${++paramCount}`);
      values.push(privacy_mode);
    }
    if (data_sharing !== undefined) {
      updateFields.push(`data_sharing = $${++paramCount}`);
      values.push(data_sharing);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const query = `
      UPDATE user_settings 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING id, user_id, notifications_enabled, email_notifications, 
                push_notifications, auto_play_trailers, mature_content,
                privacy_mode, data_sharing, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // Create settings if they don't exist
      const createQuery = `
        INSERT INTO user_settings (
          user_id, notifications_enabled, email_notifications, push_notifications,
          auto_play_trailers, mature_content, privacy_mode, data_sharing
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, notifications_enabled, email_notifications, 
                  push_notifications, auto_play_trailers, mature_content,
                  privacy_mode, data_sharing, created_at, updated_at
      `;

      const createResult = await pool.query(createQuery, [
        req.user!.id,
        notifications_enabled ?? true,
        email_notifications ?? true,
        push_notifications ?? true,
        auto_play_trailers ?? true,
        mature_content ?? false,
        privacy_mode ?? false,
        data_sharing ?? true
      ]);

      return res.json({
        success: true,
        data: createResult.rows[0],
        message: 'Settings created successfully'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Settings updated successfully'
    });

  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Update user profile
router.put('/profile', validate(schemas.updateProfile), async (req: AuthenticatedRequest, res) => {
  try {
    const { first_name, last_name } = req.body;

    const updateFields: string[] = [];
    const values: any[] = [req.user!.id];
    let paramCount = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${++paramCount}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${++paramCount}`);
      values.push(last_name);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, first_name, last_name, is_verified, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Delete user account
router.delete('/account', async (req: AuthenticatedRequest, res) => {
  try {
    // Delete user (cascades to all related data)
    await pool.query('DELETE FROM users WHERE id = $1', [req.user!.id]);

    logger.info(`User account deleted: ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

export default router; 