#!/bin/bash

echo "🚀 Deploying Product Sharing Fix..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found server.js"

# Create backup
echo "📦 Creating backup..."
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
cp product.html product.html.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Test the server locally
echo "🧪 Testing server locally..."
node -c server.js
if [ $? -eq 0 ]; then
    echo "✅ Server.js syntax is valid"
else
    echo "❌ Server.js has syntax errors"
    exit 1
fi

# Check if we're on production
if [ "$1" = "--production" ]; then
    echo "🌐 Deploying to production..."
    
    # Deploy to production
    if [ -f "deploy-production.sh" ]; then
        echo "📤 Running production deployment..."
        ./deploy-production.sh
    else
        echo "⚠️  deploy-production.sh not found, using manual deployment"
        echo "📤 Please deploy manually to your production server"
    fi
else
    echo "🔧 Local deployment complete"
    echo "📋 Next steps:"
    echo "   1. Test with: node test-product-sharing-fix.js"
    echo "   2. View cache refresh guide: node social-media-cache-refresh.js"
    echo "   3. Deploy to production: ./deploy-product-sharing-fix.sh --production"
fi

echo ""
echo "🎯 Product Sharing Fix Summary:"
echo "==============================="
echo "✅ Added cache-busting headers to server.js"
echo "✅ Enhanced meta tags in product.html"
echo "✅ Added cache-busting parameters to image URLs"
echo "✅ Created test and cache refresh scripts"
echo ""
echo "📱 To fix the sharing issue:"
echo "   1. Deploy these changes to production"
echo "   2. Clear social media caches (see social-media-cache-refresh.js)"
echo "   3. Wait 24-48 hours for WhatsApp cache to refresh"
echo "   4. Test with Facebook Debugger"
echo ""
echo "✅ Deployment complete!"
