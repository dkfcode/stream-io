import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { logger } from '../config/logger';
import { optionalAuth } from '../middleware/auth';
import { validate, schemas, validateQuery } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Search endpoint (public with optional auth)
router.get('/', optionalAuth, validateQuery(schemas.search), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, type = 'general', filters } = req.query as {
      query: string;
      type?: string;
      filters?: any;
    };

    // Store search in history if user is authenticated
    if (req.user) {
      try {
        const historyQuery = `
          INSERT INTO search_history (user_id, query, search_type, filters)
          VALUES ($1, $2, $3, $4)
        `;
        
        await pool.query(historyQuery, [
          req.user.id,
          query,
          type,
          filters ? JSON.stringify(filters) : null
        ]);
      } catch (historyError) {
        // Don't fail the search if history storage fails
        logger.warn('Failed to store search history:', historyError);
      }
    }

    // For now, return a placeholder response
    // This will be replaced with actual TMDB API integration
    const searchResults = {
      query,
      type,
      results: [],
      total_results: 0,
      total_pages: 0,
      page: 1
    };

    res.json({
      success: true,
      data: searchResults,
      message: 'Search completed successfully'
    });

  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// Get search history (authenticated users only)
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const query = `
      SELECT query, search_type, result_count, created_at
      FROM search_history 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM search_history 
      WHERE user_id = $1
    `;

    const [historyResult, countResult] = await Promise.all([
      pool.query(query, [req.user.id, limit, offset]),
      pool.query(countQuery, [req.user.id])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: historyResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      message: 'Search history retrieved successfully'
    });

  } catch (error) {
    logger.error('Get search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search history'
    });
  }
});

// Clear search history
router.delete('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    await pool.query('DELETE FROM search_history WHERE user_id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Search history cleared successfully'
    });

  } catch (error) {
    logger.error('Clear search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear search history'
    });
  }
});

// AI-powered search endpoint (placeholder)
router.post('/ai', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, context, user_preferences } = req.body;

    // Store search in history if user is authenticated
    if (req.user) {
      try {
        const historyQuery = `
          INSERT INTO search_history (user_id, query, search_type, result_count)
          VALUES ($1, $2, 'ai', 0)
        `;
        
        await pool.query(historyQuery, [req.user.id, query]);
      } catch (historyError) {
        logger.warn('Failed to store AI search history:', historyError);
      }
    }

    // Placeholder AI search response
    // This will be replaced with actual Gemini API integration
    const aiResponse = {
      interpretation: `Looking for: ${query}`,
      search_suggestions: [
        `${query} movies`,
        `${query} TV shows`,
        `Similar to ${query}`
      ],
      content_recommendations: [],
      confidence: 0.8
    };

    res.json({
      success: true,
      data: aiResponse,
      message: 'AI search completed successfully'
    });

  } catch (error) {
    logger.error('AI search error:', error);
    res.status(500).json({
      success: false,
      message: 'AI search failed'
    });
  }
});

export default router; 