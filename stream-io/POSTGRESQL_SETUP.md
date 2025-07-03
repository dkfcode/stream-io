# PostgreSQL Setup Guide for StreamGuide

This guide will help you set up PostgreSQL for StreamGuide to enable **full settings functionality** with data persistence.

## 🚨 **Why You Need This**

**After removing Supabase**, StreamGuide now uses:
- ✅ **PostgreSQL Database** - For user settings, preferences, watchlists 
- ✅ **Express.js API** - Already implemented with full CRUD endpoints
- ✅ **Hybrid Settings Store** - Works locally + syncs to database when available

**Current Status:**
- ❌ PostgreSQL not running → Settings only work locally
- ✅ PostgreSQL running → Settings persist across devices/sessions

## 🔧 **Quick Setup (Recommended)**

### **Option 1: Using Docker (Easiest)**

```bash
# Start PostgreSQL with Docker
docker run --name streamguide-postgres \
  -e POSTGRES_DB=streamguide \
  -e POSTGRES_USER=streamguide_user \
  -e POSTGRES_PASSWORD=streamguide_password \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps | grep streamguide-postgres
```

### **Option 2: Using Homebrew (macOS)**

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database and user
createdb streamguide
psql streamguide -c "CREATE USER streamguide_user WITH PASSWORD 'streamguide_password';"
psql streamguide -c "GRANT ALL PRIVILEGES ON DATABASE streamguide TO streamguide_user;"
```

### **Option 3: Using Package Manager (Ubuntu/Debian)**

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb streamguide
sudo -u postgres psql -c "CREATE USER streamguide_user WITH PASSWORD 'streamguide_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE streamguide TO streamguide_user;"
```

## 📋 **Environment Configuration**

Create `backend/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=streamguide
DB_USER=streamguide_user
DB_PASSWORD=streamguide_password

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here

# Server
PORT=3001
NODE_ENV=development

# External APIs (for content)
TMDB_ACCESS_TOKEN=your_tmdb_token_here
GEMINI_API_KEY=your_gemini_key_here
```

## 🚀 **Complete Setup Script**

Run this script to set up everything:

```bash
# 1. Start PostgreSQL (choose one method above)

# 2. Install dependencies and initialize database
npm install
cd backend && npm install && cd ..

# 3. Initialize database schema
cd backend
npm run migrate  # This creates all tables
cd ..

# 4. Start backend server
cd backend
npm run dev  # Backend on http://localhost:3001
```

In another terminal:
```bash
# 5. Start frontend
npm run dev  # Frontend on http://localhost:5173
```

## ✅ **Verification Steps**

### **Test Database Connection**
```bash
cd backend
npm run test:db  # Check if database is accessible
```

### **Test API Endpoints**
```bash
# Health check
curl http://localhost:3001/health

# Database status
curl http://localhost:3001/api/status
```

### **Test Settings in App**
1. Open http://localhost:5173
2. Go to Settings (gear icon)
3. Change any setting
4. **Success indicators:**
   - ✅ "Settings saved to account" → Database working
   - ⚠️ "Settings saved locally" → Database not connected

## 🔧 **Troubleshooting**

### **Connection Refused Error**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres  # For Docker
brew services list | grep postgres  # For Homebrew
sudo systemctl status postgresql  # For Linux
```

### **Authentication Failed**
```bash
# Reset user permissions
psql streamguide -c "ALTER USER streamguide_user WITH PASSWORD 'streamguide_password';"
psql streamguide -c "GRANT ALL PRIVILEGES ON DATABASE streamguide TO streamguide_user;"
```

### **Database Doesn't Exist**
```bash
# Create database
createdb streamguide
# Or with Docker:
docker exec -it streamguide-postgres createdb -U postgres streamguide
```

### **Port Already in Use**
```bash
# Find what's using port 5432
lsof -i :5432
# Kill if needed
kill -9 <PID>
```

## 📊 **What You Get After Setup**

### **Settings Features** (Now Working!)
- ✅ **Notifications Settings** - Persist across sessions
- ✅ **Privacy Settings** - Stored securely in database  
- ✅ **App Settings** - Synchronized across devices
- ✅ **User Preferences** - Genres, services, providers
- ✅ **Watchlists** - Full CRUD with cloud sync

### **API Endpoints** (Available)
- `GET/PUT /api/user/settings` - User settings management
- `GET/PUT /api/user/preferences` - User preferences 
- `GET/POST/PUT/DELETE /api/watchlist/*` - Watchlist management
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication

### **Development Benefits**
- 🔄 **Real-time sync** between frontend and backend
- 🛡️ **Data persistence** - no data loss on refresh
- 👥 **Multi-user support** - each user has separate settings
- 🔐 **Secure storage** - JWT authentication for all API calls

## 🎯 **Next Steps After Setup**

1. **Test user registration:** Create account in app
2. **Test settings sync:** Change settings and verify persistence  
3. **Test watchlists:** Add movies/shows to custom lists
4. **Production deployment:** Deploy with PostgreSQL service

---

**Need Help?** Check the backend logs: `cd backend && npm run dev`
**Still Issues?** Settings will continue working locally until database is connected. 