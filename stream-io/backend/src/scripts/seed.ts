import bcrypt from 'bcryptjs';
import { pool, testConnection } from '../config/database';
import { logger } from '../config/logger';

const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('Starting database seeding...');

    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Create test user
    const password_hash = await bcrypt.hash('password123', 12);
    
    const userQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, is_verified)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `;

    const userResult = await pool.query(userQuery, [
      'test@streamguide.io',
      password_hash,
      'Test',
      'User',
      true
    ]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      logger.info(`✅ Test user created: ${user.email}`);

      // Add sample watchlist items (popular movies/shows)
      const sampleItems = [
        {
          tmdb_id: 550,
          media_type: 'movie',
          title: 'Fight Club',
          poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          release_date: '1999-10-15',
          rating: 8.8,
          genres: ['Drama', 'Thriller']
        },
        {
          tmdb_id: 238,
          media_type: 'movie', 
          title: 'The Godfather',
          poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          release_date: '1972-03-14',
          rating: 9.2,
          genres: ['Crime', 'Drama']
        },
        {
          tmdb_id: 1399,
          media_type: 'tv',
          title: 'Game of Thrones',
          poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
          release_date: '2011-04-17',
          rating: 9.3,
          genres: ['Action & Adventure', 'Drama', 'Sci-Fi & Fantasy']
        },
        {
          tmdb_id: 94605,
          media_type: 'tv',
          title: 'Arcane',
          poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
          release_date: '2021-11-06',
          rating: 9.0,
          genres: ['Animation', 'Sci-Fi & Fantasy', 'Action & Adventure']
        }
      ];

      // Get default watchlists
      const watchlistsQuery = `
        SELECT id, list_type FROM watchlists 
        WHERE user_id = $1 AND is_default = true
      `;

      const watchlists = await pool.query(watchlistsQuery, [user.id]);

      for (const watchlist of watchlists.rows) {
        for (const item of sampleItems) {
          // Add different items to different lists
          if (
            (watchlist.list_type === 'favorites' && item.rating >= 9.0) ||
            (watchlist.list_type === 'watch_later' && item.rating < 9.0)
          ) {
            const itemQuery = `
              INSERT INTO watchlist_items (
                watchlist_id, tmdb_id, media_type, title, poster_path, 
                release_date, rating, genres
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (watchlist_id, tmdb_id, media_type) DO NOTHING
            `;

            await pool.query(itemQuery, [
              watchlist.id,
              item.tmdb_id,
              item.media_type,
              item.title,
              item.poster_path,
              new Date(item.release_date),
              item.rating,
              item.genres
            ]);
          }
        }
      }

      logger.info('✅ Sample watchlist items added');

      // Add sample search history
      const searchQueries = [
        'superhero movies',
        'science fiction',
        'comedy shows',
        'christopher nolan',
        'marvel movies'
      ];

      for (const query of searchQueries) {
        const historyQuery = `
          INSERT INTO search_history (user_id, query, search_type, result_count)
          VALUES ($1, $2, 'general', $3)
        `;

        await pool.query(historyQuery, [user.id, query, Math.floor(Math.random() * 50) + 1]);
      }

      logger.info('✅ Sample search history added');
    }

    logger.info('✅ Database seeding completed successfully');

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding script failed:', error);
      process.exit(1);
    });
}

export default seedDatabase; 