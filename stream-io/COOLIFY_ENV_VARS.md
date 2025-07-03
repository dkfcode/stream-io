# Coolify Environment Variables for StreamGuide

## Required Environment Variables

Add these environment variables in your Coolify application settings:

### Build-Time Variables (Frontend)
These are embedded into the frontend build at build time:

```bash
# API URL - should point to your Coolify domain
VITE_API_URL=https://your-coolify-domain.com

# TMDB API Access Token (get from https://www.themoviedb.org/settings/api)
VITE_TMDB_ACCESS_TOKEN=your_tmdb_access_token_here

# Gemini AI API Key (get from https://ai.google.dev/)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# App URL - should match your domain
VITE_APP_URL=https://your-coolify-domain.com
```

### Runtime Variables (Backend)

```bash
# Database Configuration
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=streamguide_production
DB_USER=streamguide_user
DB_PASSWORD=your_secure_database_password

# JWT Configuration (GENERATE SECURE RANDOM STRINGS!)
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_chars_long
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_different_from_jwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production

# API Keys (Backend)
TMDB_ACCESS_TOKEN=your_tmdb_access_token_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Auto-Set by Coolify
These are automatically set by Coolify:

```bash
COOLIFY_FQDN=your-coolify-domain.com
```

## Security Notes

1. **Generate strong JWT secrets using**: `openssl rand -base64 32`
2. **Use a secure database password**
3. **Get TMDB API key from**: https://www.themoviedb.org/settings/api
4. **Get Gemini API key from**: https://ai.google.dev/
5. **Never commit actual secrets to git** - only use this as a template

## Setup Instructions

1. In Coolify dashboard, go to your application
2. Navigate to "Environment Variables" section
3. Add all the variables listed above
4. Make sure to replace placeholder values with actual keys/passwords
5. Redeploy the application after setting variables 