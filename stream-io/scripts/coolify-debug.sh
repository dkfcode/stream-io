#!/bin/bash

echo "🔍 Coolify Production Debug & Management Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Update these with your Coolify details
COOLIFY_URL="${COOLIFY_URL:-your-coolify-instance.com}"
APP_NAME="${APP_NAME:-streamguide}"
PROJECT_ID="${PROJECT_ID:-your-project-id}"

echo -e "${BLUE}🎯 Coolify Production Management${NC}"
echo "App: $APP_NAME"
echo "Coolify: $COOLIFY_URL"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to display menu
show_menu() {
    echo -e "${GREEN}Available Actions:${NC}"
    echo "1. 🔄 Force Fresh Deployment (Equivalent to cleanup)"
    echo "2. 📊 Check Application Status"
    echo "3. 📋 View Recent Deployment Logs"
    echo "4. 🔍 Check Environment Variables"
    echo "5. 🚀 Restart Application Containers"
    echo "6. 🌐 Test Application Health"
    echo "7. 📈 Monitor Real-time Logs"
    echo "8. 🔧 Debug Container Issues"
    echo "9. 💾 Backup Current Configuration"
    echo "0. ❌ Exit"
    echo ""
}

# Function to test application health
test_health() {
    echo -e "${BLUE}🌐 Testing Application Health...${NC}"
    
    if [ -z "$APP_URL" ]; then
        echo -e "${YELLOW}⚠️  APP_URL not set. Please set it: export APP_URL=https://your-app.com${NC}"
        read -p "Enter your app URL: " APP_URL
    fi
    
    echo "Testing: $APP_URL/health"
    
    if command_exists curl; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/health" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_CODE)${NC}"
        else
            echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
        fi
        
        echo "Testing frontend..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Frontend accessible (HTTP $HTTP_CODE)${NC}"
        else
            echo -e "${RED}❌ Frontend not accessible (HTTP $HTTP_CODE)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  curl not found. Install curl to test endpoints.${NC}"
    fi
}

# Function to check recent commits
check_commits() {
    echo -e "${BLUE}📋 Recent Commits (Last 5):${NC}"
    git log --oneline -5
    echo ""
    
    echo -e "${BLUE}🔍 Current Branch Status:${NC}"
    echo "Branch: $(git branch --show-current)"
    echo "Status: $(git status --porcelain | wc -l | tr -d ' ') uncommitted changes"
    
    if [ "$(git status --porcelain | wc -l)" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes that won't be deployed!${NC}"
        git status --short
    else
        echo -e "${GREEN}✅ Working tree clean - all changes committed${NC}"
    fi
}

# Function to show deployment commands
show_deployment_commands() {
    echo -e "${BLUE}🚀 Coolify Deployment Commands:${NC}"
    echo ""
    echo -e "${GREEN}Manual Deployment Trigger:${NC}"
    echo "1. Go to: $COOLIFY_URL"
    echo "2. Navigate to: Projects → $APP_NAME"
    echo "3. Click: 'Deployments' tab"
    echo "4. Click: 'Deploy' button"
    echo ""
    echo -e "${GREEN}Environment Variables:${NC}"
    echo "1. Go to: 'Environment Variables' tab"
    echo "2. Verify VITE_TMDB_ACCESS_TOKEN is set"
    echo "3. Check all required variables are present"
    echo ""
    echo -e "${GREEN}Container Restart:${NC}"
    echo "1. Go to: 'Containers' or 'Services' tab"
    echo "2. Click: 'Restart' button"
}

# Function to validate environment for deployment
validate_deployment() {
    echo -e "${BLUE}🔍 Validating Deployment Readiness...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Not in StreamGuide project directory${NC}"
        return 1
    fi
    
    # Check for required files
    echo "Checking required files..."
    FILES=("Dockerfile" "docker-compose.yaml" "src/services/tmdb.ts")
    for file in "${FILES[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file${NC}"
        else
            echo -e "${RED}❌ $file missing${NC}"
        fi
    done
    
    # Check git status
    check_commits
    
    # Check if latest fixes are committed
    if git log --oneline -1 | grep -q "TMDB authentication\|tmdb"; then
        echo -e "${GREEN}✅ Latest TMDB fixes appear to be committed${NC}"
    else
        echo -e "${YELLOW}⚠️  Latest TMDB authentication fixes may not be committed${NC}"
    fi
}

# Function to show environment variable template
show_env_template() {
    echo -e "${BLUE}🔧 Required Environment Variables for Coolify:${NC}"
    echo ""
    echo "# Critical - Add these in Coolify Environment Variables tab:"
    echo "VITE_TMDB_ACCESS_TOKEN=your_tmdb_token_here"
    echo "VITE_API_URL=https://your-domain.com"
    echo "VITE_APP_URL=https://your-domain.com"
    echo ""
    echo "# Optional but recommended:"
    echo "VITE_GEMINI_API_KEY=your_gemini_key_here"
    echo "NODE_ENV=production"
    echo ""
    echo "# Database (if using separate DB service):"
    echo "DB_HOST=your-db-host"
    echo "DB_USER=your-db-user"
    echo "DB_PASSWORD=your-db-password"
    echo "DB_NAME=streamguide_production"
    echo ""
    echo "# JWT Secrets (generate with: openssl rand -base64 32):"
    echo "JWT_SECRET=your-jwt-secret"
    echo "JWT_REFRESH_SECRET=your-refresh-secret"
}

# Main script execution
echo -e "${GREEN}🎉 StreamGuide Production Debug Tool${NC}"
echo "This script helps manage your Coolify deployment"
echo ""

# Validate we're in the right place
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the StreamGuide project root directory${NC}"
    exit 1
fi

# Show menu and handle user input
while true; do
    show_menu
    read -p "Select an option (0-9): " choice
    echo ""
    
    case $choice in
        1)
            echo -e "${BLUE}🔄 Force Fresh Deployment${NC}"
            validate_deployment
            show_deployment_commands
            echo ""
            echo -e "${YELLOW}💡 After triggering deployment in Coolify, monitor the build logs for:${NC}"
            echo "   - Environment variable detection"
            echo "   - Successful frontend build"
            echo "   - Container startup success"
            ;;
        2)
            echo -e "${BLUE}📊 Application Status Check${NC}"
            validate_deployment
            ;;
        3)
            echo -e "${BLUE}📋 Deployment Information${NC}"
            check_commits
            echo ""
            echo -e "${YELLOW}💡 Check these logs in Coolify dashboard:${NC}"
            echo "   - Build logs (Deployments tab)"
            echo "   - Container logs (Containers tab)"
            echo "   - Application logs (Runtime logs)"
            ;;
        4)
            show_env_template
            ;;
        5)
            echo -e "${BLUE}🚀 Container Restart Instructions${NC}"
            show_deployment_commands
            ;;
        6)
            test_health
            ;;
        7)
            echo -e "${BLUE}📈 Real-time Log Monitoring${NC}"
            echo "Monitor logs in Coolify dashboard:"
            echo "1. Go to your application"
            echo "2. Click 'Logs' or 'Container Logs'"
            echo "3. Enable 'Follow logs' for real-time monitoring"
            ;;
        8)
            echo -e "${BLUE}🔧 Debug Container Issues${NC}"
            echo ""
            echo "Common production issues and solutions:"
            echo ""
            echo -e "${GREEN}Issue: TMDB 401 errors (content not loading)${NC}"
            echo "Solution: Add VITE_TMDB_ACCESS_TOKEN in Coolify environment variables"
            echo ""
            echo -e "${GREEN}Issue: App shows error page${NC}"
            echo "Solution: Check container logs for startup errors"
            echo ""
            echo -e "${GREEN}Issue: Build fails${NC}"
            echo "Solution: Ensure all dependencies are in package.json"
            echo ""
            echo -e "${GREEN}Issue: Container won't start${NC}"
            echo "Solution: Force fresh deployment to recreate containers"
            ;;
        9)
            echo -e "${BLUE}💾 Current Configuration Backup${NC}"
            echo "Git commit hash: $(git rev-parse HEAD)"
            echo "Branch: $(git branch --show-current)"
            echo "Timestamp: $(date)"
            echo ""
            echo "To restore this exact state later:"
            echo "git checkout $(git rev-parse HEAD)"
            ;;
        0)
            echo -e "${GREEN}👋 Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Please try again.${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done 