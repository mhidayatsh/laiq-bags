#!/bin/bash

# 🚀 Laiq Bags Production Deployment Script
# This script deploys the application and ensures it runs automatically

echo "🚀 Starting Laiq Bags Production Deployment..."

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

# Check if running as root (for systemd service)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root - will install systemd service"
    INSTALL_SYSTEMD=true
else
    print_status "Running as user - will use PM2 for process management"
    INSTALL_SYSTEMD=false
fi

# Step 1: Stop any existing processes
print_status "Stopping existing server processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "pm2" 2>/dev/null || true
sleep 2

# Step 2: Install dependencies
print_status "Installing Node.js dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed successfully"

# Step 3: Set up environment
print_status "Setting up production environment..."
export NODE_ENV=production

# Step 4: Create PM2 ecosystem file for process management
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'laiq-bags',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Step 5: Create logs directory
mkdir -p logs

# Step 6: Create startup script
print_status "Creating startup script..."
cat > start-server.sh << 'EOF'
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
EOF

chmod +x start-server.sh

# Step 7: Create systemd service (if running as root)
if [ "$INSTALL_SYSTEMD" = true ]; then
    print_status "Creating systemd service..."
    cat > /etc/systemd/system/laiq-bags.service << EOF
[Unit]
Description=Laiq Bags E-commerce Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=laiq-bags

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable laiq-bags.service
    print_success "Systemd service created and enabled"
fi

# Step 8: Create monitoring script
print_status "Creating monitoring script..."
cat > monitor-server.sh << 'EOF'
#!/bin/bash

# Server monitoring script
SERVER_URL="http://localhost:3001/api/health"
LOG_FILE="logs/monitor.log"

echo "$(date): Starting server monitoring..." >> $LOG_FILE

while true; do
    if curl -s -f $SERVER_URL > /dev/null; then
        echo "$(date): Server is running" >> $LOG_FILE
    else
        echo "$(date): Server is down, restarting..." >> $LOG_FILE
        ./start-server.sh
    fi
    sleep 30
done
EOF

chmod +x monitor-server.sh

# Step 9: Create health check script
print_status "Creating health check script..."
cat > health-check.sh << 'EOF'
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
EOF

chmod +x health-check.sh

# Step 10: Start the server
print_status "Starting the server..."

if [ "$INSTALL_SYSTEMD" = true ]; then
    systemctl start laiq-bags.service
    systemctl status laiq-bags.service --no-pager
else
    # Install PM2 if not available
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        npm install -g pm2
    fi
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
fi

# Step 11: Wait for server to start
print_status "Waiting for server to start..."
sleep 5

# Step 12: Perform health check
print_status "Performing health check..."
./health-check.sh

if [ $? -eq 0 ]; then
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Server Information:"
    echo "   🌐 URL: http://localhost:3001"
    echo "   📊 Health Check: http://localhost:3001/api/health"
    echo "   📝 Logs: tail -f logs/server.log"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Start server: ./start-server.sh"
    echo "   Stop server: pm2 stop laiq-bags (or systemctl stop laiq-bags)"
    echo "   Restart server: pm2 restart laiq-bags (or systemctl restart laiq-bags)"
    echo "   Monitor server: ./monitor-server.sh"
    echo "   Health check: ./health-check.sh"
    echo ""
    echo "🚀 Server will automatically restart on system reboot!"
else
    print_error "❌ Health check failed. Please check the logs."
    exit 1
fi
