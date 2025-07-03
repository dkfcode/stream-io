# StreamGuide Environment Setup Guide

This guide will help you set up all the necessary environment variables for StreamGuide development and production.

## 🚀 Quick Setup

### 1. Frontend Environment Variables

Copy the example file and fill in your values:
```bash
cp .env.example .env.local
```

### 2. Backend Environment Variables

Copy the example file and fill in your values:
```bash
cp backend/.env.example backend/.env
```

## 📋 Required Environment Variables

### 🔥 Absolutely Required (App won't work without these)

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3001                    # Backend API URL
VITE_TMDB_ACCESS_TOKEN=your_tmdb_token_here          # Movie/TV data
```

#### Backend (backend/.env)
```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=stream-io-db
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret

# Server
PORT=3001
NODE_ENV=development

# TMDB API
TMDB_ACCESS_TOKEN=your_tmdb_token_here
```

### 🌟 Highly Recommended (Enhanced features)

#### Frontend (.env.local)
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here         # AI-powered search
```

#### Backend (backend/.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here              # AI features
```

### 🔧 Optional (Advanced features)

#### TV Data Providers
```env
# Frontend
VITE_GRACENOTE_API_KEY=your_gracenote_key
VITE_EPG_BEST_API_KEY=your_epg_best_key

# Backend
GRACENOTE_API_KEY=your_gracenote_key
EPG_BEST_API_KEY=your_epg_best_key
```

## 🔑 How to Get API Keys

### 1. TMDB (The Movie Database) - **REQUIRED**

1. Go to [TMDB](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key
5. Copy the **"API Read Access Token"** (not the API Key)
6. Use this token for both `VITE_TMDB_ACCESS_TOKEN` and `TMDB_ACCESS_TOKEN`

**Format:** `eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ...` (long Bearer token)

### 2. Google Gemini AI - **RECOMMENDED**

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Use this for both `VITE_GEMINI_API_KEY` and `GEMINI_API_KEY`

**Format:** `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q`

**Free Tier:** 15 requests per minute, 1,500 requests per day

### 3. JWT Secrets - **REQUIRED**

Generate secure random strings for JWT tokens:

```bash
# Method 1: Using Node.js
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 64
```

### 4. TV Data Providers - **OPTIONAL**

#### Gracenote (Premium)
- Contact Gracenote for enterprise API access
- Cost: $$$ (enterprise pricing)

#### EPG.best (Affordable)
- Sign up at [EPG.best](https://www.epg.best/)
- Cost: ~$10-50/month depending on usage

#### TVMaze (Free)
- No API key required
- Already configured in the app

## 🌍 Environment-Specific Configurations

### Development (.env.local + backend/.env)
```env
NODE_ENV=development
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_DEBUG_LOGS=true
ENABLE_SWAGGER=true
ENABLE_DEBUG_LOGS=true
```

### Production (Coolify/Railway/Vercel)
```env
NODE_ENV=production
VITE_PRODUCTION_BUILD=true
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_DEBUG_LOGS=false
ENABLE_SWAGGER=false
ENABLE_DEBUG_LOGS=false

# Production URLs
VITE_APP_URL=https://streamguide.yourdomain.com
VITE_API_URL=https://api.streamguide.yourdomain.com
CORS_ORIGIN=https://streamguide.yourdomain.com
```

## 🗄️ Database Setup

### Local Development (PostgreSQL)

1. **Install PostgreSQL:**
   ```bash
   # macOS (Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database:**
   ```bash
   # Create database
   createdb stream-io-db
   
   # Create user (optional)
   psql -c "CREATE USER your_username WITH PASSWORD 'your_password';"
   psql -c "GRANT ALL PRIVILEGES ON DATABASE 'stream-io-db' TO your_username;"
   ```

3. **Update backend/.env:**
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=stream-io-db
   DB_USER=your_username     # or your system username
   DB_PASSWORD=your_password # or leave empty for local dev
   ```

### Production Database

For production, use a managed PostgreSQL service:
- **Railway:** Built-in PostgreSQL addon
- **Coolify:** Configurable PostgreSQL container
- **Vercel:** Vercel Postgres
- **AWS RDS:** Enterprise-grade PostgreSQL

## 🔒 Security Best Practices

### 1. Environment File Security
```bash
# Never commit .env files
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore

# Set proper permissions
chmod 600 .env.local backend/.env
```

### 2. JWT Secret Requirements
- **Minimum 64 characters** (512 bits)
- **Use cryptographically secure random generation**
- **Different secrets for JWT and refresh tokens**
- **Rotate regularly in production**

### 3. Database Security
- **Strong passwords** (mixed case, numbers, symbols)
- **Limited user privileges** (only necessary permissions)
- **SSL/TLS connections** in production
- **Regular backups**

## 🚀 Production Deployment Variables

### Coolify Deployment
Set these in your Coolify dashboard:

```env
# Application
NODE_ENV=production
PORT=3001

# Database (provided by Coolify PostgreSQL service)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=streamguide_production
DB_USER=streamguide_user
DB_PASSWORD=your_secure_production_password

# JWT (generate new secrets for production)
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret

# APIs
TMDB_ACCESS_TOKEN=your_tmdb_token
GEMINI_API_KEY=your_gemini_key

# URLs (replace with your domain)
CORS_ORIGIN=https://streamguide.yourdomain.com

# Frontend Build Variables
VITE_API_URL=https://api.streamguide.yourdomain.com
VITE_APP_URL=https://streamguide.yourdomain.com
VITE_TMDB_ACCESS_TOKEN=your_tmdb_token
VITE_GEMINI_API_KEY=your_gemini_key
```

## ✅ Verification

### Test Your Setup

1. **Check environment files exist:**
   ```bash
   ls -la .env.local backend/.env
   ```

2. **Test database connection:**
   ```bash
   npm run dev:setup
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Verify API endpoints:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001/health
   - API Docs: http://localhost:3001/api-docs (if Swagger enabled)

### Common Issues

**Database Connection Failed:**
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l | grep stream-io-db`
- Check credentials in backend/.env

**TMDB API Errors:**
- Verify you're using the "API Read Access Token" not "API Key"
- Test the token: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.themoviedb.org/3/movie/popular`

**Gemini AI Errors:**
- Check API key format starts with "AIzaSy"
- Verify you're within free tier limits (15 requests/minute)
- Test the key: Check Google AI Studio dashboard

**Port Already in Use:**
- Kill existing processes: `lsof -i :3001` then `kill -9 <PID>`
- Use different ports in .env files

## 📚 Additional Resources

- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---

**Need Help?** Check the [troubleshooting section](README.md#-troubleshooting) in the main README or create an issue on GitHub. 