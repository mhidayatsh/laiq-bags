#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT=3001

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "🚀 Starting server with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
else
    echo "🚀 Starting server with Node.js..."
    nohup node server.js > logs/server.log 2>&1 &
    echo $! > server.pid
fi

echo "✅ Server started successfully!"
echo "📊 Monitor logs: tail -f logs/server.log"
echo "🔗 Server URL: http://localhost:3001"
