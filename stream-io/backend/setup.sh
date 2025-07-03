#!/bin/bash

# StreamGuide Backend Setup Script
# Phase 1: Backend Infrastructure

echo "🚀 Setting up StreamGuide Backend API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and accessible."
fi

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database credentials and API keys"
fi

# Build the application
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed. Please check the TypeScript errors."
    exit 1
fi

echo "✅ Build completed successfully"

# Check if database is accessible
echo "🗄️  Testing database connection..."
if [ -f .env ]; then
    source .env
    if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
        if command -v psql &> /dev/null; then
            if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                echo "✅ Database connection successful"
                
                # Run migrations
                echo "🔄 Running database migrations..."
                npm run db:migrate
                
                if [ $? -eq 0 ]; then
                    echo "✅ Database migrations completed"
                    
                    # Ask if user wants to seed the database
                    read -p "🌱 Would you like to seed the database with sample data? (y/N): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        npm run db:seed
                        if [ $? -eq 0 ]; then
                            echo "✅ Database seeded successfully"
                            echo "🔑 Test user credentials:"
                            echo "   Email: test@streamguide.io"
                            echo "   Password: password123"
                        fi
                    fi
                else
                    echo "❌ Database migrations failed"
                fi
            else
                echo "❌ Cannot connect to database. Please check your .env configuration."
            fi
        else
            echo "⚠️  PostgreSQL client not available. Skipping database setup."
        fi
    else
        echo "⚠️  Database configuration incomplete in .env file"
    fi
fi

echo ""
echo "🎉 Backend setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your database credentials and API keys"
echo "2. Ensure PostgreSQL database is running and accessible"
echo "3. Run: npm run dev (to start development server)"
echo "4. Test: curl http://localhost:3001/health"
echo ""
echo "📚 Available commands:"
echo "  npm run dev        - Start development server"
echo "  npm run build      - Build for production"
echo "  npm run start      - Start production server"
echo "  npm run db:migrate - Run database migrations"
echo "  npm run db:seed    - Seed database with sample data"
echo ""
echo "🔗 API Endpoints:"
echo "  Health Check: GET /health"
echo "  Authentication: POST /api/auth/register, /api/auth/login"
echo "  User Management: /api/user/*"
echo "  Watchlists: /api/watchlist/*"
echo "  Search: /api/search/*" 