#!/bin/bash

# StreamGuide Production Startup Script
# Serves both backend API and frontend static files

set -e

echo "🚀 Starting StreamGuide in production mode..."

# Set default port if not specified
export PORT=${PORT:-3000}
export NODE_ENV=${NODE_ENV:-production}

echo "🔧 Environment Configuration:"
echo "   PORT: $PORT"
echo "   NODE_ENV: $NODE_ENV"
echo "   DB_HOST: ${DB_HOST:-not_set}"
echo "   Working directory: $(pwd)"

# Wait for database to be ready (if DB_HOST is set)
if [ -n "$DB_HOST" ]; then
    echo "⏳ Waiting for database connection..."
    until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" 2>/dev/null; do
        echo "Database not ready, waiting..."
        sleep 2
    done
    echo "✅ Database connection established"
fi

# Run database migrations if needed
if [ -n "$DB_HOST" ] && [ "$NODE_ENV" = "production" ]; then
    echo "🔄 Running database migrations..."
    cd backend
    npm run db:migrate || echo "⚠️ Migration failed or no migrations needed"
    cd ..
fi

# Verify file structure before starting
echo "📁 Verifying application structure:"
echo "   Backend server: $(ls -la backend/dist/server.js 2>/dev/null || echo 'NOT FOUND')"
echo "   Frontend files: $(ls -la public/index.html 2>/dev/null || echo 'NOT FOUND')"

echo "🌐 Starting StreamGuide server..."
echo "📊 Health check will be available at: http://localhost:$PORT/health"
echo "🔗 Frontend will be served at: http://localhost:$PORT"
echo "🔧 API endpoints at: http://localhost:$PORT/api/*"

# Start the backend server (which will also serve frontend static files)
# Use the correct path to the built server file
exec node backend/dist/server.js 