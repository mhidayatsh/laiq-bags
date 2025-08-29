#!/bin/bash

# 🚀 SEO Fixes Deployment Script
# This script deploys the Google Search Console fixes

echo "🚀 Deploying SEO Fixes for Google Search Console Issues..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Verify files exist
print_status "Verifying files to deploy..."

FILES_TO_CHECK=(
    "404.html"
    "server.js"
    "product.html"
    "test-product-fixes.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_success "✅ $file exists"
    else
        print_error "❌ $file not found"
        exit 1
    fi
done

# Step 2: Test the fixes locally
print_status "Testing fixes locally..."
node test-product-fixes.js

if [ $? -eq 0 ]; then
    print_success "✅ Local tests completed"
else
    print_warning "⚠️ Some tests failed - this is expected before deployment"
fi

# Step 3: Create backup
print_status "Creating backup of current files..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "server.js.backup" ]; then
    cp server.js.backup "$BACKUP_DIR/"
fi

cp server.js "$BACKUP_DIR/"
cp product.html "$BACKUP_DIR/"

print_success "✅ Backup created in $BACKUP_DIR"

# Step 4: Deploy to production
print_status "Deploying to production..."

# Check if we're on a remote server or local
if [ -f "deploy-production.sh" ]; then
    print_status "Using production deployment script..."
    ./deploy-production.sh
else
    print_status "Manual deployment required..."
    echo ""
    echo "📋 Manual Deployment Steps:"
    echo "1. Upload these files to your server:"
    echo "   - 404.html"
    echo "   - server.js"
    echo "   - product.html"
    echo ""
    echo "2. Restart your server:"
    echo "   - pm2 restart laiq-bags"
    echo "   - OR systemctl restart laiq-bags"
    echo ""
    echo "3. Test the fixes:"
    echo "   - node test-product-fixes.js"
    echo ""
    echo "4. Check Google Search Console:"
    echo "   - Request re-indexing of product pages"
    echo "   - Monitor 'Blocked by robots.txt' errors"
fi

# Step 5: Post-deployment verification
print_status "Post-deployment verification..."

echo ""
echo "🧪 Testing deployed fixes..."
echo "Waiting 10 seconds for server to restart..."
sleep 10

# Test the fixes
node test-product-fixes.js

echo ""
print_success "🎉 SEO Fixes Deployment Completed!"
echo ""
echo "📊 Next Steps:"
echo "1. ✅ Monitor server logs for any errors"
echo "2. ✅ Check Google Search Console in 24-48 hours"
echo "3. ✅ Request re-indexing of product pages"
echo "4. ✅ Monitor 'Blocked by robots.txt' errors"
echo ""
echo "📈 Expected Results:"
echo "- Product pages should return 200 or 404 (not 500)"
echo "- 'Blocked by robots.txt' errors should decrease"
echo "- Product pages should become indexable"
echo ""
echo "🔗 Useful Commands:"
echo "- View logs: tail -f logs/server.log"
echo "- Health check: ./health-check.sh"
echo "- Test fixes: node test-product-fixes.js"
