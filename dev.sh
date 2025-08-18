#!/bin/bash

echo "🚀 Starting Laiq Bags Development Environment..."

# Kill any existing processes
echo "🔧 Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null || echo "✅ No Node.js server running"
pkill -f "python.*http.server" 2>/dev/null || echo "✅ No Python server running"

# Wait for cleanup
sleep 2

# Start backend server
echo "🔧 Starting backend server..."
./start-server.sh &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🌐 Starting frontend server..."
python3 -m http.server 8000 &
FRONTEND_PID=$!

echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:8000"
echo "🔗 Backend: http://localhost:3001"
echo "🏥 Health Check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait 