#!/bin/bash
echo "🚀 Starting Laiq Bags Production Server..."

# Set production environment
export NODE_ENV=production

# Check if port is available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is already in use. Stopping existing process..."
    pkill -f "node server.js"
    sleep 2
fi

# Start the server
echo "🔧 Starting server with production configuration..."
node server.js
