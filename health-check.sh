#!/bin/bash

# Health check script
SERVER_URL="http://localhost:3001/api/health"
MONGODB_URL="http://localhost:3001/api/settings"

echo "🏥 Performing health check..."

# Check server
if curl -s -f $SERVER_URL > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding"
    exit 1
fi

# Check MongoDB connection
if curl -s -f $MONGODB_URL > /dev/null; then
    echo "✅ MongoDB connection is working"
else
    echo "❌ MongoDB connection failed"
    exit 1
fi

# Check static files
STATIC_FILES=(
    "http://localhost:3001/css/styles.css"
    "http://localhost:3001/js/main.js"
    "http://localhost:3001/assets/laiq-logo.png"
)

for file in "${STATIC_FILES[@]}"; do
    if curl -s -f -I $file | grep -q "200 OK"; then
        echo "✅ Static file accessible: $(basename $file)"
    else
        echo "❌ Static file not accessible: $(basename $file)"
    fi
done

echo "🎉 Health check completed successfully!"
