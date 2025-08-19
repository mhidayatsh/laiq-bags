#!/bin/bash

# 🚀 Automated Upload and Deployment Script for Laiq Bags
# This script will upload all files and deploy your website automatically

echo "🚀 Starting automated upload and deployment process..."

# Configuration - UPDATE THESE VALUES
SERVER_IP="your-server-ip-here"
SERVER_USER="your-username-here"
SERVER_PATH="/var/www/your-website"
LOCAL_PATH="/Users/mdhidayatullahshaikh/Desktop/Laiq_Bags"

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

# Check if configuration is set
if [ "$SERVER_IP" = "your-server-ip-here" ] || [ "$SERVER_USER" = "your-username-here" ]; then
    print_error "Please update the SERVER_IP and SERVER_USER variables in this script first!"
    echo ""
    echo "Edit this file and update these lines:"
    echo "SERVER_IP=\"your-actual-server-ip\""
    echo "SERVER_USER=\"your-actual-username\""
    echo "SERVER_PATH=\"/path/to/your/website\""
    exit 1
fi

# Check if local path exists
if [ ! -d "$LOCAL_PATH" ]; then
    print_error "Local path does not exist: $LOCAL_PATH"
    exit 1
fi

print_status "Configuration:"
echo "  Server: $SERVER_USER@$SERVER_IP"
echo "  Server Path: $SERVER_PATH"
echo "  Local Path: $LOCAL_PATH"
echo ""

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" exit 2>/dev/null; then
    print_error "Cannot connect to server. Please check:"
    echo "  1. Server IP is correct"
    echo "  2. Username is correct"
    echo "  3. SSH key is set up or password authentication is enabled"
    echo "  4. Server is accessible from your network"
    exit 1
fi
print_success "SSH connection successful!"

# Create server directory if it doesn't exist
print_status "Creating server directory if needed..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $SERVER_PATH"
print_success "Server directory ready!"

# Upload files using rsync
print_status "Uploading files to server..."
print_warning "This may take a few minutes depending on your connection speed..."

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'logs' \
    --exclude '*.log' \
    --exclude '.env' \
    --exclude 'config.env' \
    "$LOCAL_PATH/" \
    "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

if [ $? -eq 0 ]; then
    print_success "Files uploaded successfully!"
else
    print_error "Upload failed! Please check your connection and try again."
    exit 1
fi

# Set proper permissions
print_status "Setting file permissions..."
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && chmod +x deploy-production.sh"

# Run deployment script
print_status "Starting deployment process..."
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && ./deploy-production.sh"

# Check deployment status
print_status "Checking deployment status..."
sleep 5

# Test if server is running
print_status "Testing server connectivity..."
if ssh "$SERVER_USER@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001" | grep -q "200"; then
    print_success "Server is running successfully!"
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE! 🎉"
    echo ""
    echo "Your website is now live at:"
    echo "  http://$SERVER_IP:3001"
    echo ""
    echo "Server management commands:"
    echo "  Check status: ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
    echo "  View logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs laiq-bags'"
    echo "  Restart: ssh $SERVER_USER@$SERVER_IP 'pm2 restart laiq-bags'"
    echo "  Stop: ssh $SERVER_USER@$SERVER_IP 'pm2 stop laiq-bags'"
    echo ""
    print_success "Your server will run automatically and restart on crashes!"
else
    print_warning "Server might still be starting up. Please wait a few minutes and check:"
    echo "  http://$SERVER_IP:3001"
    echo ""
    echo "To check server status:"
    echo "  ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
fi

print_success "Upload and deployment process completed!"
