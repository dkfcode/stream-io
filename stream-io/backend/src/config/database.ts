import { Pool, PoolConfig } from 'pg';
import { logger } from './logger';

interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'streamguide',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // Increased to 10 seconds for Docker
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // In production, don't attempt to connect immediately if database is unavailable
  ...(process.env.NODE_ENV === 'production' && {
    connectionTimeoutMillis: 5000, // Shorter timeout in production
    query_timeout: 5000,
    keepAlive: false
  })
};

export const pool = new Pool(config);

// Test database connection with retries and comprehensive checks
export const testConnection = async (maxRetries: number = 10, retryDelay: number = 3000): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      
      const client = await pool.connect();
      
      // Test basic connectivity
      await client.query('SELECT NOW()');
      
      // Test if our database and tables exist
      const dbCheck = await client.query('SELECT current_database()');
      logger.info(`📊 Connected to database: ${dbCheck.rows[0].current_database}`);
      
      // Test if we can query tables (even if empty)
      try {
        const tableCheck = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `);
        logger.info(`📋 Found ${tableCheck.rows.length} tables in database`);
        
        if (tableCheck.rows.length === 0) {
          logger.warn('⚠️  No tables found - database may need initialization');
        }
      } catch (tableError) {
        logger.warn('⚠️  Could not query table information:', tableError);
      }
      
      client.release();
      logger.info('✅ Database connection and validation successful');
      return true;
      
    } catch (error) {
      logger.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        logger.error('🔴 All database connection attempts failed');
        return false;
      }
      
      logger.info(`⏳ Retrying database connection in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  return false;
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool:', error);
  }
};

// Handle pool errors - don't exit process in production when DB unavailable
pool.on('error', (err) => {
  logger.error('Database pool error:', err);
  
  // Only exit in development when we expect database to be available
  if (process.env.NODE_ENV === 'development') {
    logger.error('Exiting in development mode due to database error');
    process.exit(-1);
  } else {
    // In production, log error but continue running (database optional for content browsing)
    logger.warn('⚠️  Database unavailable - some features will be disabled');
  }
});

export default pool; 