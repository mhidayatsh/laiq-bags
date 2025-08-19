#!/bin/bash
echo "🔄 Restarting Laiq Bags Server..."

# Stop existing processes
echo "🛑 Stopping existing server processes..."
pkill -f "node server.js"
sleep 2

# Start the server
echo "🚀 Starting server..."
npm start
