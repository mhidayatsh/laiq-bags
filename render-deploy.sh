#!/bin/bash

# 🚀 Render Deployment Script for Laiq Bags
# This script will prepare your files for Render deployment

echo "🚀 Preparing files for Render deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from your project directory."
    exit 1
fi

print_status "Creating Render-specific configuration..."

# Create render.yaml for Render deployment
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

print_success "Created render.yaml configuration file"

# Update package.json for Render
print_status "Updating package.json for Render..."

# Check if package.json exists and update it
if [ -f "package.json" ]; then
    # Add render-specific scripts
    sed -i '' 's/"scripts": {/"scripts": {\n    "render-build": "npm install",/g' package.json
    sed -i '' 's/"start": "node server.js"/"start": "node server.js",\n    "render-build": "npm install"/g' package.json
fi

print_success "Updated package.json"

# Create .env file for local testing (will be ignored by git)
print_status "Creating .env file for local testing..."
cat > .env << 'EOF'
# Local development environment variables
# These will be overridden by Render environment variables in production
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://laiqbags:CVnxzKLO8U6WtY2A@cluster0.eoti40j.mongodb.net/laiq_bags_production?retryWrites=true&w=majority
RAZORPAY_KEY_ID=rzp_test_R6phvDnUNW
RAZORPAY_KEY_SECRET=xzg73Bh1a3QPPePk1Dr
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hida7149@gmail.com
EMAIL_PASS=xmgr afzj tcef vmdv
JWT_SECRET=6741df7bc1e5d0aa28ca314d7f86954d2eb3870ecea64cd533a7490ba7954126
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3001
ENCRYPTION_KEY=7cc8264468b77ed7a80964d8c13d1ab9
SESSION_SECRET=1175f0fbb9df4eaebcf83df83ee30793
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_BASE_LIMITER=true
EOF

print_success "Created .env file for local testing"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_status "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
config.env
config.env.production

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Render specific
.render-buildlogs/
EOF
    print_success "Created .gitignore file"
fi

# Create deployment instructions
print_status "Creating deployment instructions..."
cat > RENDER_DEPLOYMENT_GUIDE.md << 'EOF'
# 🚀 Render Deployment Guide for Laiq Bags

## 📋 Prerequisites
- Render account (https://render.com)
- GoDaddy domain
- MongoDB Atlas database
- Git repository (GitHub, GitLab, etc.)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository
1. Push your code to GitHub/GitLab:
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Create Render Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: laiq-bags
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

### Step 3: Set Environment Variables
In your Render dashboard, go to your service → Environment → Add Environment Variable:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://laiqbags:CVnxzKLO8U6WtY2A@cluster0.eoti40j.mongodb.net/laiq_bags_production?retryWrites=true&w=majority
RAZORPAY_KEY_ID=rzp_test_R6phvDnUNW
RAZORPAY_KEY_SECRET=xzg73Bh1a3QPPePk1Dr
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hida7149@gmail.com
EMAIL_PASS=xmgr afzj tcef vmdv
JWT_SECRET=6741df7bc1e5d0aa28ca314d7f86954d2eb3870ecea64cd533a7490ba7954126
JWT_EXPIRE=7d
FRONTEND_URL=https://your-domain.com
ENCRYPTION_KEY=7cc8264468b77ed7a80964d8c13d1ab9
SESSION_SECRET=1175f0fbb9df4eaebcf83df83ee30793
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_BASE_LIMITER=true
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Wait for deployment to complete (usually 2-5 minutes)

### Step 5: Connect Your Domain
1. In Render dashboard, go to your service → Settings → Custom Domains
2. Add your GoDaddy domain
3. Update DNS settings in GoDaddy (see DNS setup below)

## 🌐 DNS Configuration (GoDaddy)

### Option 1: Using CNAME (Recommended)
1. Go to GoDaddy DNS management
2. Add CNAME record:
   - **Name**: @ (or leave empty)
   - **Value**: your-app-name.onrender.com
   - **TTL**: 600

### Option 2: Using A Record
1. Go to GoDaddy DNS management
2. Add A record:
   - **Name**: @
   - **Value**: 76.76.19.19 (Render's IP)
   - **TTL**: 600

## 🔧 Troubleshooting

### If deployment fails:
1. Check build logs in Render dashboard
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct
4. Check if all dependencies are in package.json

### If domain doesn't work:
1. Wait 24-48 hours for DNS propagation
2. Verify DNS settings in GoDaddy
3. Check custom domain settings in Render

## 📊 Monitoring

- **Logs**: View in Render dashboard → Logs
- **Status**: Check service status in dashboard
- **Performance**: Monitor in Render dashboard → Metrics

## 🎉 Success!

Your website will be available at:
- Render URL: https://your-app-name.onrender.com
- Custom Domain: https://your-domain.com

EOF

print_success "Created RENDER_DEPLOYMENT_GUIDE.md"

print_status "Creating quick deployment script..."
cat > deploy-to-render.sh << 'EOF'
#!/bin/bash

echo "🚀 Quick Render Deployment Script"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin YOUR_GITHUB_REPO_URL"
    echo "   git push -u origin main"
    exit 1
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Git remote not set. Please add your GitHub repository:"
    echo "   git remote add origin YOUR_GITHUB_REPO_URL"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy to Render - $(date)"
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🚀 Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Create new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Set environment variables (see RENDER_DEPLOYMENT_GUIDE.md)"
echo "5. Deploy!"
echo ""
echo "📖 For detailed instructions, see: RENDER_DEPLOYMENT_GUIDE.md"
EOF

chmod +x deploy-to-render.sh
print_success "Created deploy-to-render.sh script"

echo ""
echo "🎉 Render deployment files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./deploy-to-render.sh"
echo "2. Follow the guide in RENDER_DEPLOYMENT_GUIDE.md"
echo "3. Set up your domain in GoDaddy"
echo ""
echo "📖 For complete instructions, see: RENDER_DEPLOYMENT_GUIDE.md"
