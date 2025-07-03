# Use official Node.js runtime as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ postgresql-client netcat-openbsd

# Copy package files for installing all dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Builder stage: Build TypeScript to JavaScript
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app
RUN apk add --no-cache postgresql-client netcat-openbsd # Redundant but safe
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeapp -u 1001

# Copy production node_modules and wait script
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/scripts/wait-for-postgres.sh /usr/local/bin/wait-for-postgres.sh
RUN chmod +x /usr/local/bin/wait-for-postgres.sh

# Create logs directory and change ownership of all app files
RUN mkdir -p /app/logs
RUN chown -R nodeapp:nodejs /app

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"] 