import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool, testConnection } from '../config/database';
import { logger } from '../config/logger';

const runMigration = async (): Promise<void> => {
  try {
    logger.info('Starting database migration...');

    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    logger.info('✅ Database migration completed successfully');
    logger.info('Tables created:');
    logger.info('  - users');
    logger.info('  - user_sessions');
    logger.info('  - user_preferences');
    logger.info('  - user_settings');
    logger.info('  - watchlists');
    logger.info('  - watchlist_items');
    logger.info('  - search_history');
    logger.info('  - user_activity');

  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default runMigration; 