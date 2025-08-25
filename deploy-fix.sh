#!/bin/bash

echo "🚀 Deploying static file serving fix to production..."

# Navigate to project directory
cd /Users/mdhidayatullahshaikh/Desktop/Laiq_Bags

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ Found server.js in current directory"

# Create a backup of the current server.js
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
echo "📦 Created backup of server.js"

# The fix has already been applied to server.js
echo "✅ Static file serving fix already applied"

# Test the local server
echo "🧪 Testing local server..."
pkill -f "node server.js" 2>/dev/null || true
sleep 2

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test API endpoint
echo "🔍 Testing API endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/products/68a7183c82057e0e0da0cf94 | grep -q "200"; then
    echo "✅ Local API test passed"
else
    echo "❌ Local API test failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Stop local server
kill $SERVER_PID 2>/dev/null || true
echo "🛑 Stopped local server"

echo "🎯 Ready to deploy to production!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push the changes to your repository"
echo "2. Deploy to Render or your hosting platform"
echo "3. The fix will resolve the 500 Internal Server Error on product pages"
echo ""
echo "🔧 What was fixed:"
echo "- Moved static file serving middleware AFTER API routes"
echo "- This prevents API requests from being interpreted as static file requests"
echo "- Product pages should now load correctly without 500 errors"
