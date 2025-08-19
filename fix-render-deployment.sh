#!/bin/bash

echo "🔧 Render Deployment Fix Script"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Check git status
echo "📊 Checking git status..."
if [ -d ".git" ]; then
    git status --porcelain
    echo ""
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  You have uncommitted changes. Committing them..."
        git add .
        git commit -m "Fix: Update deployment - $(date)"
    fi
    
    # Push to GitHub
    echo "📤 Pushing to GitHub..."
    git push origin main
    echo "✅ Code pushed to GitHub"
else
    echo "❌ Git repository not found. Please initialize git first."
    exit 1
fi

echo ""
echo "🔍 Checking Render deployment status..."
echo ""

# Check if render.yaml exists and is correct
if [ -f "render.yaml" ]; then
    echo "✅ render.yaml found"
    echo "📋 Current configuration:"
    cat render.yaml
else
    echo "❌ render.yaml not found. Creating one..."
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: laiq-bags
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: RAZORPAY_KEY_ID
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false
      - key: EMAIL_HOST
        sync: false
      - key: EMAIL_PORT
        sync: false
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASS
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: ENCRYPTION_KEY
        sync: false
      - key: SESSION_SECRET
        sync: false
      - key: RATE_LIMIT_WINDOW_MS
        sync: false
      - key: RATE_LIMIT_MAX_REQUESTS
        sync: false
      - key: ENABLE_BASE_LIMITER
        sync: false
EOF
    echo "✅ render.yaml created"
fi

echo ""
echo "🔧 Next steps to fix the 502 error:"
echo ""
echo "1. 📱 Go to https://dashboard.render.com"
echo "2. 🔍 Find your 'laiq-bags' service"
echo "3. 📊 Check the 'Logs' tab for error messages"
echo "4. 🔄 Click 'Manual Deploy' → 'Deploy latest commit'"
echo "5. ⏳ Wait for deployment to complete (2-5 minutes)"
echo ""
echo "🔍 Common issues and solutions:"
echo ""
echo "❌ If MongoDB connection fails:"
echo "   - Check MONGODB_URI environment variable"
echo "   - Verify MongoDB Atlas is accessible"
echo "   - Check IP whitelist in MongoDB Atlas"
echo ""
echo "❌ If port issues:"
echo "   - Ensure PORT=10000 is set in environment variables"
echo "   - Check if the port is not already in use"
echo ""
echo "❌ If build fails:"
echo "   - Check package.json dependencies"
echo "   - Verify all required files are committed"
echo "   - Check for syntax errors in code"
echo ""
echo "📞 If the issue persists:"
echo "   - Check Render service status page"
echo "   - Contact Render support"
echo "   - Verify your Render account is active"
echo ""
echo "✅ Script completed. Please follow the steps above to fix your deployment."
