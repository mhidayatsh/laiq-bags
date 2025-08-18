#!/bin/bash

echo "🔄 Starting server restart process..."

# Kill any existing node processes
echo "🔪 Killing existing Node.js processes..."
pkill -f "node server.js" 2>/dev/null || echo "No existing server processes found"
pkill -f "npm start" 2>/dev/null || echo "No existing npm processes found"

# Wait for processes to terminate
sleep 3

# Check for any remaining processes on port 3001
echo "🔍 Checking for processes on port 3001..."
PORT_3001_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$PORT_3001_PID" ]; then
    echo "🔪 Killing process on port 3001: $PORT_3001_PID"
    kill -9 $PORT_3001_PID 2>/dev/null || echo "Process already terminated"
fi

# Check for any remaining processes on port 3443
echo "🔍 Checking for processes on port 3443..."
PORT_3443_PID=$(lsof -ti:3443 2>/dev/null)
if [ ! -z "$PORT_3443_PID" ]; then
    echo "🔪 Killing process on port 3443: $PORT_3443_PID"
    kill -9 $PORT_3443_PID 2>/dev/null || echo "Process already terminated"
fi

# Wait for ports to be freed
sleep 2

# Run database cleanup first
echo "🗄️ Running database cleanup..."
node fix-database.js

# Wait for database cleanup to complete
sleep 3

# Start the server
echo "🚀 Starting server..."
node server.js &

# Wait a moment for server to start
sleep 5

# Check if server started successfully
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Server started successfully!"
    echo "🌐 Server running on: http://localhost:3001"
    echo "🔗 API Health Check: http://localhost:3001/api/health"
    echo "🔐 Admin Panel: http://localhost:3001/admin.html"
    echo "🏪 Customer Site: http://localhost:3001/index.html"
else
    echo "❌ Server failed to start properly"
    echo "📋 Checking server logs..."
    tail -n 20 server.log 2>/dev/null || echo "No server logs found"
fi

echo "🎉 Server restart process completed!" 