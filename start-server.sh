#!/bin/bash

echo "🚀 Starting Laiq Bags Server..."

# Kill any existing Node.js processes on port 3001
echo "🔧 Checking for existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "✅ No existing processes found"

# Wait for port to be free
sleep 2

# Check if MongoDB is accessible
echo "📊 Checking MongoDB connection..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "❌ Port 3001 is still in use"
    exit 1
fi

# Start the server
echo "🚀 Starting server..."
node server.js 