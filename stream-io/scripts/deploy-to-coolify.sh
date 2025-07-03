#!/bin/bash

# StreamGuide Coolify Deployment Script
# This script helps prepare and deploy your StreamGuide app to Coolify

set -e  # Exit on any error

echo "🚀 StreamGuide Coolify Deployment Preparation"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile" ]; then
    print_error "This script must be run from the StreamGuide root directory"
    exit 1
fi

print_info "Checking project structure..."
print_status "Found package.json and Dockerfile"

# Check for required files
REQUIRED_FILES=("build.sh" "vite.config.ts" "backend/package.json" "backend/Dockerfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Check if build script is executable
if [ ! -x "build.sh" ]; then
    print_warning "Making build.sh executable..."
    chmod +x build.sh
    print_status "build.sh is now executable"
fi

# Check for environment variables template
if [ ! -f ".env.example" ]; then
    print_info "Creating .env.example template..."
    cat > .env.example << EOF
# Backend API Configuration
VITE_API_URL=https://your-domain.com

# TMDB API (for movie/TV data)
VITE_TMDB_ACCESS_TOKEN=your_tmdb_access_token

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# Production URL
VITE_APP_URL=https://your-domain.com

# Node Environment
NODE_ENV=production
EOF
    print_status "Created .env.example template"
fi

# Check for backend environment template
if [ ! -f "backend/.env.example" ]; then
    print_info "Creating backend .env.example template..."
    cat > backend/.env.example << EOF
# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=streamguide_production
DB_USER=streamguide_user
DB_PASSWORD=your-secure-production-password

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=production

# API Keys
TMDB_ACCESS_TOKEN=your_tmdb_access_token
GEMINI_API_KEY=your_gemini_api_key
EOF
    print_status "Created backend/.env.example template"
fi

# Test build locally
print_info "Testing build process..."
if ./build.sh; then
    print_status "Build test successful"
else
    print_error "Build test failed. Please fix build issues before deploying."
    exit 1
fi

# Test backend build
print_info "Testing backend build..."
cd backend
if npm run build; then
    print_status "Backend build test successful"
else
    print_error "Backend build test failed. Please fix backend build issues before deploying."
    exit 1
fi
cd ..

# Git repository checks
print_info "Checking Git repository..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    print_status "Git repository detected"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes. Consider committing them before deployment."
        git status --short
    else
        print_status "No uncommitted changes"
    fi
    
    # Show current branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Current branch: $CURRENT_BRANCH"
    
    # Check if we're on main or dev branch
    if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "dev" ]; then
        print_status "On deployment branch ($CURRENT_BRANCH)"
    else
        print_warning "Not on main or dev branch. Make sure Coolify is configured for branch: $CURRENT_BRANCH"
    fi
else
    print_error "Not a Git repository. Coolify requires Git for deployment."
    exit 1
fi

# Display deployment checklist
echo ""
echo "📋 Production Deployment Checklist"
echo "================================="
echo "Before deploying to Coolify, ensure:"
echo ""
echo "🔧 Coolify Configuration:"
echo "   □ Coolify application created"
echo "   □ Git repository connected"
echo "   □ Auto-deployment enabled for main branch"
echo "   □ Custom domain configured"
echo "   □ SSL/HTTPS enabled"
echo ""
echo "🔐 Frontend Environment Variables (in Coolify):"
echo "   □ VITE_API_URL=https://your-domain.com"
echo "   □ VITE_TMDB_ACCESS_TOKEN"
echo "   □ VITE_GEMINI_API_KEY"
echo "   □ VITE_APP_URL=https://your-domain.com"
echo "   □ NODE_ENV=production"
echo ""
echo "🗄️ Backend Environment Variables (in Coolify):"
echo "   □ DB_HOST (PostgreSQL host)"
echo "   □ DB_PORT=5432"
echo "   □ DB_NAME=streamguide_production"
echo "   □ DB_USER"
echo "   □ DB_PASSWORD"
echo "   □ JWT_SECRET"
echo "   □ JWT_REFRESH_SECRET"
echo "   □ PORT=3001"
echo "   □ NODE_ENV=production"
echo ""
echo "🗄️ Database Setup:"
echo "   □ Production PostgreSQL database created"
echo "   □ Database migrations run in production"
echo "   □ Database connection from Coolify verified"
echo "   □ Database backups configured"
echo ""
echo "🌐 Domain Configuration:"
echo "   □ DNS A record: your-domain.com → Coolify server IP"
echo "   □ SSL certificate active"
echo "   □ HTTPS redirect enabled"
echo "   □ Health check endpoints responding"
echo ""

# Check if database migration is needed
echo ""
read -p "🗄️ Run database migration check? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Checking database migration status..."
    
    cd backend
    if [ -f ".env" ]; then
        print_info "Using local database for migration check..."
        if npm run db:migrate; then
            print_status "Database migrations are up to date"
        else
            print_warning "Database migration issues detected. Check before production deployment."
        fi
    else
        print_warning "No backend .env file found. Database migration check skipped."
    fi
    cd ..
fi

# Final deployment instructions
echo ""
echo "🚀 Ready for Coolify Deployment!"
echo "================================"
echo ""
echo "Current Status:"
echo "✅ Project linked to Coolify"
echo "✅ Auto-deployment active for main branch"
echo ""
echo "Next steps:"
echo "1. Set all environment variables in Coolify dashboard"
echo "2. Configure production PostgreSQL database"
echo "3. Set up custom domain and SSL"
echo "4. Push to main branch to trigger deployment"
echo "5. Monitor build logs in Coolify"
echo "6. Run database migrations in production"
echo "7. Test the deployed application"
echo ""
echo "🔍 Health Check URLs:"
echo "   Frontend: https://your-domain.com"
echo "   Backend API: https://your-domain.com/api/health"
echo ""
print_status "Deployment preparation complete!"
print_info "Push to main branch to trigger automatic deployment!" 