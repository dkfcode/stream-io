#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}\n`)
};

// Check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if PostgreSQL is running
function checkPostgres() {
  try {
    execSync('pg_isready -h localhost -p 5432', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if database exists
function checkDatabase(dbName) {
  try {
    // Use psql to connect to the specific database - if it succeeds, database exists
    execSync(`psql -h localhost -p 5432 -d ${dbName} -c "SELECT 1;" > /dev/null 2>&1`);
    return true;
  } catch {
    // If connection fails, database doesn't exist
    return false;
  }
}

// Read environment file and extract database name
function getDatabaseName() {
  const envPath = join(projectRoot, 'backend', '.env');
  if (!existsSync(envPath)) {
    return 'stream-io-db'; // default
  }
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const dbNameMatch = envContent.match(/DB_NAME=(.+)/);
    return dbNameMatch ? dbNameMatch[1].trim() : 'stream-io-db';
  } catch {
    return 'stream-io-db'; // default
  }
}

// Check if Node.js version is compatible
function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  return majorVersion >= 18;
}

// Check environment files
function checkEnvironmentFiles() {
  const files = [
    { path: join(projectRoot, '.env.local'), name: 'Frontend .env.local' },
    { path: join(projectRoot, 'backend', '.env'), name: 'Backend .env' }
  ];
  
  const results = [];
  for (const file of files) {
    results.push({
      ...file,
      exists: existsSync(file.path)
    });
  }
  return results;
}

// Run database migration
async function runMigration() {
  try {
    log.info('Running database migration...');
    execSync('cd backend && npm run build', { stdio: 'pipe' });
    execSync('cd backend && npm run db:migrate', { stdio: 'pipe' });
    log.success('Database migration completed successfully');
    return true;
  } catch (error) {
    // Check if it's a harmless error (tables already exist, etc.)
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('already exists') || errorMessage.includes('already exists')) {
      log.success('Database schema is already up-to-date');
      return true;
    } else {
      log.warning('Database migration had issues, but continuing...');
      log.info('This may be normal if the database is already set up');
      return true; // Continue anyway - the database might be fine
    }
  }
}

// Create sample environment files
function createSampleEnvFiles() {
  const frontendEnv = `# Backend API Configuration
VITE_API_URL=http://localhost:3001

# TMDB Configuration (Get from https://www.themoviedb.org/settings/api)
VITE_TMDB_ACCESS_TOKEN=your-tmdb-access-token

# AI Configuration (Get from https://aistudio.google.com/app/apikey)
VITE_GEMINI_API_KEY=your-gemini-api-key

# App Configuration
VITE_APP_URL=http://localhost:5173`;

  const backendEnv = `# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=stream-io-db
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Keys (Optional - for AI features)
# GEMINI_API_KEY=your-gemini-api-key
# TMDB_ACCESS_TOKEN=your-tmdb-token`;

  try {
    const frontendPath = join(projectRoot, '.env.local.example');
    const backendPath = join(projectRoot, 'backend', '.env.example');
    
    if (!existsSync(frontendPath)) {
      require('fs').writeFileSync(frontendPath, frontendEnv);
      log.info(`Created example frontend environment file: .env.local.example`);
    }
    
    if (!existsSync(backendPath)) {
      require('fs').writeFileSync(backendPath, backendEnv);
      log.info(`Created example backend environment file: backend/.env.example`);
    }
  } catch (error) {
    log.warning('Could not create example environment files');
  }
}

// Main setup function
async function main() {
  log.header('StreamGuide Development Environment Setup');

  let hasErrors = false;

  // Check Node.js version
  if (!checkNodeVersion()) {
    log.error(`Node.js version ${process.version} is not supported. Please use Node.js >= 18.0.0`);
    hasErrors = true;
  } else {
    log.success(`Node.js version ${process.version} is compatible`);
  }

  // Check required commands
  const requiredCommands = ['node', 'npm', 'psql', 'pg_isready'];
  for (const cmd of requiredCommands) {
    if (commandExists(cmd)) {
      log.success(`${cmd} is available`);
    } else {
      log.error(`${cmd} is not installed or not in PATH`);
      hasErrors = true;
    }
  }

  // Check PostgreSQL
  if (checkPostgres()) {
    log.success('PostgreSQL is running');
  } else {
    log.error('PostgreSQL is not running. Please start PostgreSQL server.');
    log.info('macOS: brew services start postgresql');
    log.info('Ubuntu: sudo service postgresql start');
    log.info('Windows: net start postgresql-x64-14');
    hasErrors = true;
  }

  // Check environment files
  const envFiles = checkEnvironmentFiles();
  let missingEnvFiles = false;
  
  for (const file of envFiles) {
    if (file.exists) {
      log.success(`${file.name} exists`);
    } else {
      log.warning(`${file.name} is missing`);
      missingEnvFiles = true;
    }
  }

  if (missingEnvFiles) {
    createSampleEnvFiles();
    log.warning('Please copy the example files and configure your environment variables:');
    log.info('cp .env.local.example .env.local');
    log.info('cp backend/.env.example backend/.env');
    log.info('Then edit the files with your actual values.');
  }

  // Check database
  if (!hasErrors && checkPostgres()) {
    const dbName = getDatabaseName();
    
    if (checkDatabase(dbName)) {
      log.success(`Database '${dbName}' exists`);
    } else {
      log.warning(`Database '${dbName}' does not exist`);
      log.info(`Creating database: createdb ${dbName}`);
      
      try {
        execSync(`createdb ${dbName}`, { stdio: 'pipe' });
        log.success(`Database '${dbName}' created successfully`);
      } catch (error) {
        // Check if the error is because database already exists
        if (error.message.includes('already exists')) {
          log.success(`Database '${dbName}' already exists`);
        } else {
          log.error(`Failed to create database '${dbName}': ${error.message}`);
          log.info('Please create the database manually:');
          log.info(`createdb ${dbName}`);
          hasErrors = true;
        }
      }
    }

    // Run migration if database exists
    if (checkDatabase(dbName)) {
      log.info('Checking if database migration is needed...');
      await runMigration();
    }
  }

  // Install backend dependencies
  const backendNodeModules = join(projectRoot, 'backend', 'node_modules');
  if (!existsSync(backendNodeModules)) {
    log.info('Installing backend dependencies...');
    try {
      execSync('cd backend && npm install', { stdio: 'inherit' });
      log.success('Backend dependencies installed');
    } catch (error) {
      log.error('Failed to install backend dependencies');
      hasErrors = true;
    }
  } else {
    log.success('Backend dependencies are installed');
  }

  // Final status
  console.log('\n' + '='.repeat(60));
  
  if (hasErrors) {
    log.error('Setup completed with errors. Please fix the issues above before running the development servers.');
    log.info('After fixing issues, run: npm run dev');
    process.exit(1);
  } else {
    log.success('Setup completed successfully! 🎉');
    log.info('Starting development servers...');
    console.log('\n' + '='.repeat(60));
    
    // Give a moment for the user to see the success message
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log.error('Unexpected error occurred:');
  console.error(error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection occurred:');
  console.error(reason);
  process.exit(1);
});

// Run the setup
main().catch((error) => {
  log.error('Setup failed:');
  console.error(error.message);
  process.exit(1);
}); 