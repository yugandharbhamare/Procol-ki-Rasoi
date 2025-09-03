#!/bin/bash

echo "🧪 Testing build process for Netlify deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "   Node.js: $NODE_VERSION"
echo "   npm: $NPM_VERSION"

# Check if Node.js version meets requirements
NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required. Current version: $NODE_VERSION"
    echo "   Please update Node.js to version 20 or higher."
    exit 1
else
    echo "✅ Node.js version meets requirements"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Build may fail due to missing environment variables."
    echo "   Make sure to create a .env file with your Firebase configuration."
else
    echo "✅ .env file found"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Run the build
echo "🔨 Running build process..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output created in 'dist' folder"
    echo "🚀 Ready for Netlify deployment!"
    
    # Show build output size
    echo "📊 Build output size:"
    du -sh dist/
    
    # Clean up
    echo "🧹 Cleaning up build files..."
    rm -rf dist
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi

echo "✨ Build test completed!"
