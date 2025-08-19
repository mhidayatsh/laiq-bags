# 🚀 Production Deployment Guide

## 📋 **Quick Deployment Steps**

### **Step 1: Upload Files to Production Server**
Upload these files to your production server:
```
📁 Upload these files:
├── server.js (✅ FIXED)
├── package.json (✅ UPDATED)
├── config.env.production (✅ CREATED)
├── deploy-production.sh (✅ NEW)
├── All HTML, CSS, JS files
└── All asset files (images, etc.)
```

### **Step 2: Run Deployment Script**
```bash
# Make script executable
chmod +x deploy-production.sh

# Run deployment
./deploy-production.sh
```

### **Step 3: Server Will Start Automatically**
The script will:
- ✅ Install dependencies
- ✅ Set up PM2 process manager
- ✅ Create systemd service (if root)
- ✅ Start server automatically
- ✅ Enable auto-restart on reboot
- ✅ Perform health checks

## 🔧 **Automatic Server Management**

### **PM2 Process Manager (Recommended)**
- **Auto-restart**: Server restarts if it crashes
- **Auto-start**: Server starts on system reboot
- **Logging**: All logs saved to `logs/` directory
- **Monitoring**: Built-in monitoring and health checks

### **Systemd Service (If running as root)**
- **System service**: Runs as system service
- **Auto-restart**: Automatic restart on failure
- **Boot startup**: Starts automatically on system boot

## 📊 **Monitoring Commands**

```bash
# Check server status
pm2 status

# View logs
pm2 logs laiq-bags

# Restart server
pm2 restart laiq-bags

# Stop server
pm2 stop laiq-bags

# Health check
./health-check.sh
```

## 🏥 **Health Monitoring**

The deployment includes:
- **Health Check Script**: `./health-check.sh`
- **Monitoring Script**: `./monitor-server.sh`
- **Auto-restart**: Server restarts automatically if it goes down
- **Log Management**: All logs saved to `logs/` directory

## 🔄 **Automatic Features**

✅ **Server starts automatically** on system boot  
✅ **Auto-restart** if server crashes  
✅ **Health monitoring** every 30 seconds  
✅ **Log rotation** and management  
✅ **Process management** with PM2  
✅ **System service** (if root access)  

## 📞 **Troubleshooting**

### **If server doesn't start:**
```bash
# Check logs
tail -f logs/server.log

# Check PM2 status
pm2 status

# Manual restart
pm2 restart laiq-bags
```

### **If MongoDB connection fails:**
```bash
# Check MongoDB connection
./health-check.sh

# Check environment variables
cat config.env.production
```

### **If static files don't load:**
```bash
# Check file permissions
ls -la assets/
ls -la css/
ls -la js/

# Check server logs
pm2 logs laiq-bags
```

## 🎯 **Expected Results**

After deployment:
- ✅ Website loads at `http://your-domain:3001`
- ✅ All static files (CSS, JS, images) load correctly
- ✅ MongoDB connection works
- ✅ All API endpoints respond
- ✅ Server restarts automatically on crashes
- ✅ Server starts automatically on system reboot

## 🚀 **One-Command Deployment**

```bash
# Upload all files, then run:
./deploy-production.sh
```

**That's it! Your server will be running automatically and continuously!** 🎉
