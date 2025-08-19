# 🚀 **AUTOMATED UPLOAD CONFIGURATION GUIDE**

## **Quick Setup - 3 Steps to Upload Your Website**

### **Step 1: Edit the Upload Script**
Open `upload-to-server.sh` and update these lines with your server details:

```bash
# Update these values with your actual server information
SERVER_IP="your-server-ip-here"        # Replace with your server IP
SERVER_USER="your-username-here"       # Replace with your server username
SERVER_PATH="/var/www/your-website"    # Replace with your website directory path
```

### **Step 2: Run the Upload Script**
```bash
./upload-to-server.sh
```

### **Step 3: Your Website is Live!**
The script will automatically:
- ✅ Upload all files
- ✅ Install dependencies
- ✅ Start the server
- ✅ Enable auto-restart
- ✅ Test the deployment

## **📋 What You Need:**

### **Server Information:**
1. **Server IP Address** (e.g., `192.168.1.100` or `your-domain.com`)
2. **Username** (e.g., `root`, `ubuntu`, `admin`)
3. **Website Directory Path** (e.g., `/var/www/html`, `/home/user/website`)

### **SSH Access:**
- SSH key authentication (recommended)
- OR password authentication enabled

## **🔧 Example Configuration:**

```bash
# For a VPS with IP 123.456.789.012
SERVER_IP="123.456.789.012"
SERVER_USER="root"
SERVER_PATH="/var/www/laiq-bags"

# For a shared hosting with domain
SERVER_IP="your-domain.com"
SERVER_USER="your-cpanel-username"
SERVER_PATH="/home/username/public_html"
```

## **🚀 What the Script Does:**

1. **Tests Connection** - Verifies SSH access to your server
2. **Uploads Files** - Uses rsync to upload all files efficiently
3. **Sets Permissions** - Makes deployment script executable
4. **Runs Deployment** - Executes the production deployment script
5. **Tests Server** - Verifies the website is running
6. **Provides Commands** - Shows you how to manage the server

## **📊 Expected Output:**

```
🚀 Starting automated upload and deployment process...
[INFO] Configuration:
  Server: root@123.456.789.012
  Server Path: /var/www/laiq-bags
  Local Path: /Users/mdhidayatullahshaikh/Desktop/Laiq_Bags

[INFO] Testing SSH connection...
[SUCCESS] SSH connection successful!
[INFO] Creating server directory if needed...
[SUCCESS] Server directory ready!
[INFO] Uploading files to server...
[SUCCESS] Files uploaded successfully!
[INFO] Setting file permissions...
[INFO] Starting deployment process...
[SUCCESS] Server is running successfully!

🎉 DEPLOYMENT COMPLETE! 🎉

Your website is now live at:
  http://123.456.789.012:3001
```

## **🔍 Troubleshooting:**

### **If SSH Connection Fails:**
1. Check server IP is correct
2. Verify username is correct
3. Ensure SSH key is set up or password auth is enabled
4. Check if server is accessible from your network

### **If Upload Fails:**
1. Check your internet connection
2. Verify server has enough disk space
3. Ensure you have write permissions to the server directory

### **If Deployment Fails:**
1. Check server has Node.js installed
2. Verify server has enough memory
3. Check server logs for specific errors

## **📞 Server Management Commands:**

After deployment, you can manage your server with:

```bash
# Check server status
ssh your-username@your-server-ip 'pm2 status'

# View server logs
ssh your-username@your-server-ip 'pm2 logs laiq-bags'

# Restart server
ssh your-username@your-server-ip 'pm2 restart laiq-bags'

# Stop server
ssh your-username@your-server-ip 'pm2 stop laiq-bags'
```

## **🎯 Final Result:**

**Your website will be running automatically and continuously!**

- ✅ Server starts automatically
- ✅ Auto-restart on crashes
- ✅ Auto-start on system reboot
- ✅ Health monitoring
- ✅ Log management

**Just run `./upload-to-server.sh` and your website will be live!** 🚀
