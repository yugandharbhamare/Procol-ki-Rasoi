#!/bin/bash

echo "🚀 Starting Netlify build process..."

# Exit on any error
set -e

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run the build
echo "🔨 Running build process..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output size:"
    du -sh dist/
    ls -la dist/
else
    echo "❌ Build output directory 'dist' not found!"
    exit 1
fi

echo "🎉 Netlify build completed successfully!"
