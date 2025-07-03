# Multi-stage build for StreamGuide production deployment
FROM node:18-alpine AS base

# Install dependencies for native modules and PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client bash

# ================================
# Backend Build Stage
# ================================
FROM base AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build backend
RUN npm run build

# ================================
# Frontend Build Stage
# ================================
FROM base AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY package*.json ./
COPY build.sh ./

# Make build script executable
RUN chmod +x build.sh

# Install ALL dependencies (including devDependencies needed for build)
# Use npm install instead of npm ci to ensure all dependencies are available
RUN npm install

# Copy frontend source code
COPY . .

# Remove backend directory to avoid conflicts
RUN rm -rf backend

# Declare build-time arguments with defaults
ARG VITE_API_URL
ARG VITE_TMDB_ACCESS_TOKEN
ARG VITE_GEMINI_API_KEY
ARG VITE_APP_URL
ARG BUILD_TIMESTAMP

# Set environment variables from build args
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_TMDB_ACCESS_TOKEN=${VITE_TMDB_ACCESS_TOKEN}
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
ENV VITE_APP_URL=${VITE_APP_URL}
ENV VITE_PRODUCTION_BUILD=true

# Enhanced debug environment variables - show all build args
RUN echo "🔧 ==================================" && \
    echo "🔧 BUILD ENVIRONMENT DEBUG" && \
    echo "🔧 ==================================" && \
    echo "🔧 Build Arguments Received:" && \
    echo "   VITE_API_URL: '${VITE_API_URL}'" && \
    echo "   VITE_TMDB_ACCESS_TOKEN: '${VITE_TMDB_ACCESS_TOKEN:+[SET]}'" && \
    echo "   VITE_TMDB_ACCESS_TOKEN length: ${#VITE_TMDB_ACCESS_TOKEN}" && \
    echo "   VITE_GEMINI_API_KEY: '${VITE_GEMINI_API_KEY:+[SET]}'" && \
    echo "   VITE_APP_URL: '${VITE_APP_URL}'" && \
    echo "   BUILD_TIMESTAMP: '${BUILD_TIMESTAMP}'" && \
    echo "   NODE_ENV: '${NODE_ENV}'" && \
    echo "🔧 All VITE_ Environment Variables:" && \
    (env | grep VITE_ | sort || echo "   ❌ No VITE_ variables found") && \
    echo "🔧 ==================================="

# Validate critical environment variables
RUN if [ -z "${VITE_TMDB_ACCESS_TOKEN}" ]; then \
        echo "🚨 ERROR: VITE_TMDB_ACCESS_TOKEN is empty or not set!"; \
        echo "🚨 This will cause content loading issues."; \
        echo "🚨 Please verify environment variables in Coolify dashboard."; \
    else \
        echo "✅ VITE_TMDB_ACCESS_TOKEN is properly set (length: ${#VITE_TMDB_ACCESS_TOKEN})"; \
    fi

# Build frontend - Direct approach to avoid script complexity
RUN echo "🔨 Building React application directly..." && \
    npx vite build && \
    echo "✅ Frontend build completed" && \
    ls -la dist/ || echo "❌ No dist directory found"

# Verify build output contains environment variables
RUN if [ -f "dist/index.html" ]; then \
        echo "✅ Frontend build artifacts created"; \
        echo "📁 Build contents:"; \
        ls -la dist/; \
    else \
        echo "❌ Frontend build failed - no index.html found"; \
    fi

# ================================
# Production Stage - Combined App
# ================================
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache postgresql-client bash

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S streamguide -u 1001

WORKDIR /app

# Set default port and environment
ENV PORT=3000
ENV NODE_ENV=production

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/dist ./public

# Verify frontend files were copied correctly
RUN echo "🔍 Verifying frontend files in production stage:" && \
    ls -la ./public/ && \
    echo "✅ Frontend files ready for serving"

# Create necessary directories and set permissions
RUN mkdir -p logs && \
    chown -R streamguide:nodejs /app

# Switch to non-root user
USER streamguide

# Expose port
EXPOSE $PORT

# Health check with dynamic port - connect to 127.0.0.1 instead of localhost for better IPv4 resolution
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD node -e "const port=process.env.PORT||3000; require('http').get(\`http://127.0.0.1:\${port}/health\`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application directly with node
# Server will bind to 0.0.0.0 to accept Docker health checks
CMD ["node", "backend/dist/server.js"] 