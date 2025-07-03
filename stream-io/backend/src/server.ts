import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import 'express-async-errors';

import { logger, morganStream } from './config/logger';
import { testConnection, closePool } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import watchlistRoutes from './routes/watchlist';
import searchRoutes from './routes/search';

const startServer = async () => {
  try {
    console.log('🔧 Starting StreamGuide server...');
    console.log('🔧 Environment variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT || 3000}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`);
    console.log(`   Working directory: ${process.cwd()}`);
    
    // Test database connection first (with retries)
    console.log('🗄️  Testing database connection...');
    const dbConnected = await testConnection(5, 3000); // 5 attempts, 3 second delay
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but continuing to start server...');
      console.warn('⚠️  Some features may not work without database connection');
    } else {
      console.log('✅ Database connection successful');
    }

    const app = express();
    const PORT = process.env.PORT || 3000;

    // Temporarily log to console only to capture startup errors
    logger.transports.forEach(t => (t.silent = true));
    logger.add(new (require('winston')).transports.Console());
    
    // Trust proxy (for Coolify deployment)
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-eval'"], // Allow eval for Vite in production
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:", "blob:"],
          frameSrc: ["'none'"],
          workerSrc: ["'self'", "blob:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    const corsOptions = {
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://streamguide.io',
          'https://www.streamguide.io'
        ];
        
        // Add Coolify domain if specified
        if (process.env.COOLIFY_FQDN) {
          allowedOrigins.push(`https://${process.env.COOLIFY_FQDN}`);
          allowedOrigins.push(`http://${process.env.COOLIFY_FQDN}`);
        }
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        
        // In production, also allow same-origin requests (when API and frontend are served from same domain)
        if (process.env.NODE_ENV === 'production') {
          return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };

    app.use(cors(corsOptions));

    // Compression middleware
    app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use(limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      const morgan = require('morgan');
      app.use(morgan('combined', { stream: morganStream }));
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/watchlist', watchlistRoutes);
    app.use('/api/search', searchRoutes);

    // In production, serve frontend static files
    if (process.env.NODE_ENV === 'production') {
      const frontendPath = path.join(__dirname, '../../public');
      
      console.log('🔧 Static file configuration:');
      console.log(`   __dirname: ${__dirname}`);
      console.log(`   frontendPath: ${frontendPath}`);
      console.log(`   frontendPath exists: ${require('fs').existsSync(frontendPath)}`);
      
      // Try to list contents if directory exists
      try {
        const files = require('fs').readdirSync(frontendPath);
        console.log(`   Frontend files found: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      } catch (error) {
        console.log(`   ❌ Cannot read frontend directory: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Serve static files
      app.use(express.static(frontendPath, {
        maxAge: '1y', // Cache static assets for 1 year
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
          // Cache HTML files for a shorter time
          if (path.extname(filePath) === '.html') {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          }
        }
      }));
      
      // Handle client-side routing - serve index.html for all non-API routes
      app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return res.status(404).json({
            success: false,
            message: 'API route not found'
          });
        }
        
        const indexPath = path.join(frontendPath, 'index.html');
        
        // Check if index.html exists before sending
        if (require('fs').existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.log(`❌ index.html not found at: ${indexPath}`);
          res.status(404).json({
            success: false,
            message: 'Frontend application not found. Static files may not be properly deployed.',
            path: frontendPath,
            requested: req.path
          });
        }
      });
    } else {
      // 404 handler for development (API only)
      app.use('*', (req, res) => {
        res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      });
    }

    // Global error handler
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      
      // Don't leak error details in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message;
      
      res.status(error.status || 500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    });

    // Graceful shutdown
    let server: any = null;

    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            await closePool();
            logger.info('Database connections closed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      }
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 30000);
    };

    server = app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 Server binding: 0.0.0.0:${PORT} (Docker-compatible)`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('🔴 CRITICAL: Failed to start server:', error);
    console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    console.error('🔴 Process will exit in 5 seconds...');
    
    // Add a delay to ensure logs are flushed
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
};

// Global error handlers to catch any uncaught issues
process.on('uncaughtException', (error) => {
  console.error('🔴 UNCAUGHT EXCEPTION:', error);
  console.error('🔴 Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 UNHANDLED REJECTION at:', promise);
  console.error('🔴 Reason:', reason);
  process.exit(1);
});

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default startServer; 