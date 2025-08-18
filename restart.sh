#!/bin/bash

echo "🔄 Restarting Laiq Bags Server..."

# Kill any existing node processes on port 3001
echo "🔪 Killing existing processes on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No processes found on port 3001"

# Kill any existing node processes on port 3443
echo "🔪 Killing existing processes on port 3443..."
lsof -ti:3443 | xargs kill -9 2>/dev/null || echo "No processes found on port 3443"

# Wait a moment
echo "⏳ Waiting 2 seconds..."
sleep 2

# Start the server
echo "🚀 Starting server..."
node server.js 