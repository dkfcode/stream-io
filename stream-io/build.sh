#!/bin/bash

# Build script to avoid Deno/Supabase detection issues
echo "🚀 Starting StreamGuide build process..."

# Temporarily move supabase directory to prevent Deno detection
echo "📦 Temporarily moving supabase directory..."
if [ -d "supabase" ]; then
    mv supabase supabase_temp
    echo "✅ Supabase directory moved to supabase_temp"
fi

# Remove any nixpacks files that might regenerate
rm -rf .nixpacks*
echo "✅ Removed any nixpacks files"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Verify vite is available
echo "🔍 Checking if vite is available..."
echo "📋 Installed packages in node_modules/.bin:"
ls -la node_modules/.bin/ | grep vite || echo "No vite found in .bin"

echo "📋 Checking for vite package:"
if [ -d "node_modules/vite" ]; then
    echo "✅ Vite package directory exists"
    echo "📦 Vite package.json:"
    head -10 node_modules/vite/package.json || echo "Can't read vite package.json"
else
    echo "❌ Vite package directory missing"
fi

if command -v npx >/dev/null 2>&1; then
    if npx vite --version >/dev/null 2>&1; then
        echo "✅ Vite is available via npx"
        npx vite --version
    else
        echo "❌ Vite not found via npx"
        exit 1
    fi
else
    echo "❌ npx not found"
    exit 1
fi

# Build the application
echo "🔨 Building React application..."
if npm run build:frontend; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Verify dist directory was created
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found after build"
    exit 1
fi

# Restore supabase directory after build
echo "📦 Restoring supabase directory..."
if [ -d "supabase_temp" ]; then
    mv supabase_temp supabase
    echo "✅ Supabase directory restored"
fi

echo "🎉 Build completed successfully!" 