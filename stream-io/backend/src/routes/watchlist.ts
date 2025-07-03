import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import { validate, schemas, validateUUID } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();

// All watchlist routes require authentication
router.use(authenticateToken);

// Get user's watchlists
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = `
      SELECT w.*, 
             COUNT(wi.id) as item_count
      FROM watchlists w
      LEFT JOIN watchlist_items wi ON w.id = wi.watchlist_id
      WHERE w.user_id = $1
      GROUP BY w.id
      ORDER BY w.sort_order ASC, w.created_at ASC
    `;

    const result = await pool.query(query, [req.user!.id]);

    res.json({
      success: true,
      data: result.rows,
      message: 'Watchlists retrieved successfully'
    });

  } catch (error) {
    logger.error('Get watchlists error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get watchlists'
    });
  }
});

// Get specific watchlist with items
router.get('/:id', validateUUID('id'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const watchlistId = req.params.id;

    // Get watchlist
    const watchlistQuery = `
      SELECT * FROM watchlists 
      WHERE id = $1 AND user_id = $2
    `;

    const watchlistResult = await pool.query(watchlistQuery, [watchlistId, req.user!.id]);

    if (watchlistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Get watchlist items
    const itemsQuery = `
      SELECT * FROM watchlist_items 
      WHERE watchlist_id = $1
      ORDER BY added_at DESC
    `;

    const itemsResult = await pool.query(itemsQuery, [watchlistId]);

    const watchlist = {
      ...watchlistResult.rows[0],
      items: itemsResult.rows
    };

    res.json({
      success: true,
      data: watchlist,
      message: 'Watchlist retrieved successfully'
    });

  } catch (error) {
    logger.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get watchlist'
    });
  }
});

// Create new watchlist
router.post('/', validate(schemas.createWatchlist), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, is_public } = req.body;

    // Check if watchlist name already exists for user
    const existingQuery = `
      SELECT id FROM watchlists 
      WHERE user_id = $1 AND name = $2
    `;

    const existing = await pool.query(existingQuery, [req.user!.id, name]);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Watchlist with this name already exists'
      });
    }

    // Get next sort order
    const sortQuery = `
      SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort
      FROM watchlists 
      WHERE user_id = $1
    `;

    const sortResult = await pool.query(sortQuery, [req.user!.id]);
    const sortOrder = sortResult.rows[0].next_sort;

    // Create watchlist
    const createQuery = `
      INSERT INTO watchlists (user_id, name, description, is_public, sort_order, list_type)
      VALUES ($1, $2, $3, $4, $5, 'custom')
      RETURNING *
    `;

    const result = await pool.query(createQuery, [
      req.user!.id,
      name,
      description || null,
      is_public || false,
      sortOrder
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Watchlist created successfully'
    });

  } catch (error) {
    logger.error('Create watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create watchlist'
    });
  }
});

// Update watchlist
router.put('/:id', validateUUID('id'), validate(schemas.updateWatchlist), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const watchlistId = req.params.id;
    const { name, description, is_public } = req.body;

    // Check ownership
    const ownershipQuery = `
      SELECT id FROM watchlists 
      WHERE id = $1 AND user_id = $2
    `;

    const ownership = await pool.query(ownershipQuery, [watchlistId, req.user!.id]);

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    const updateFields: string[] = [];
    const values: any[] = [watchlistId];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${++paramCount}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${++paramCount}`);
      values.push(description);  
    }
    if (is_public !== undefined) {
      updateFields.push(`is_public = $${++paramCount}`);
      values.push(is_public);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const query = `
      UPDATE watchlists 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Watchlist updated successfully'
    });

  } catch (error) {
    logger.error('Update watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update watchlist'
    });
  }
});

// Delete watchlist
router.delete('/:id', validateUUID('id'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const watchlistId = req.params.id;

    // Check ownership and prevent deletion of default lists
    const watchlistQuery = `
      SELECT * FROM watchlists 
      WHERE id = $1 AND user_id = $2
    `;

    const watchlist = await pool.query(watchlistQuery, [watchlistId, req.user!.id]);

    if (watchlist.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    if (watchlist.rows[0].is_default) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default watchlist'
      });
    }

    // Delete watchlist (items will be cascade deleted)
    await pool.query('DELETE FROM watchlists WHERE id = $1', [watchlistId]);

    res.json({
      success: true,
      message: 'Watchlist deleted successfully'
    });

  } catch (error) {
    logger.error('Delete watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete watchlist'
    });
  }
});

// Add item to watchlist
router.post('/:id/items', validateUUID('id'), validate(schemas.addToWatchlist), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const watchlistId = req.params.id;
    const {
      tmdb_id,
      media_type,
      title,
      poster_path,
      release_date,
      rating,
      genres,
      streaming_platforms,
      notes
    } = req.body;

    // Check watchlist ownership
    const ownershipQuery = `
      SELECT id FROM watchlists 
      WHERE id = $1 AND user_id = $2
    `;

    const ownership = await pool.query(ownershipQuery, [watchlistId, req.user!.id]);

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    // Check if item already exists in watchlist
    const existingQuery = `
      SELECT id FROM watchlist_items 
      WHERE watchlist_id = $1 AND tmdb_id = $2 AND media_type = $3
    `;

    const existing = await pool.query(existingQuery, [watchlistId, tmdb_id, media_type]);

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Item already exists in watchlist'
      });
    }

    // Add item to watchlist
    const insertQuery = `
      INSERT INTO watchlist_items (
        watchlist_id, tmdb_id, media_type, title, poster_path, 
        release_date, rating, genres, streaming_platforms, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      watchlistId,
      tmdb_id,
      media_type,
      title,
      poster_path || null,
      release_date ? new Date(release_date) : null,
      rating || null,
      genres || [],
      streaming_platforms ? JSON.stringify(streaming_platforms) : null,
      notes || null
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Item added to watchlist successfully'
    });

  } catch (error) {
    logger.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to watchlist'
    });
  }
});

// Update watchlist item
router.put('/items/:itemId', validateUUID('itemId'), validate(schemas.updateWatchlistItem), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = req.params.itemId;
    const { notes, is_watched, watched_date } = req.body;

    // Check ownership through watchlist
    const ownershipQuery = `
      SELECT wi.* FROM watchlist_items wi
      JOIN watchlists w ON wi.watchlist_id = w.id
      WHERE wi.id = $1 AND w.user_id = $2
    `;

    const ownership = await pool.query(ownershipQuery, [itemId, req.user!.id]);

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist item not found'
      });
    }

    const updateFields: string[] = [];
    const values: any[] = [itemId];
    let paramCount = 1;

    if (notes !== undefined) {
      updateFields.push(`notes = $${++paramCount}`);
      values.push(notes);
    }
    if (is_watched !== undefined) {
      updateFields.push(`is_watched = $${++paramCount}`);
      values.push(is_watched);
    }
    if (watched_date !== undefined) {
      updateFields.push(`watched_date = $${++paramCount}`);
      values.push(watched_date ? new Date(watched_date) : null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const query = `
      UPDATE watchlist_items 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Watchlist item updated successfully'
    });

  } catch (error) {
    logger.error('Update watchlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update watchlist item'
    });
  }
});

// Remove item from watchlist
router.delete('/items/:itemId', validateUUID('itemId'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const itemId = req.params.itemId;

    // Check ownership through watchlist
    const ownershipQuery = `
      SELECT wi.id FROM watchlist_items wi
      JOIN watchlists w ON wi.watchlist_id = w.id
      WHERE wi.id = $1 AND w.user_id = $2
    `;

    const ownership = await pool.query(ownershipQuery, [itemId, req.user!.id]);

    if (ownership.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist item not found'
      });
    }

    // Delete item
    await pool.query('DELETE FROM watchlist_items WHERE id = $1', [itemId]);

    res.json({
      success: true,
      message: 'Item removed from watchlist successfully'
    });

  } catch (error) {
    logger.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from watchlist'
    });
  }
});

export default router; 