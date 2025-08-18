# 🚀 **Render Deployment Guide - Laiq Bags**

## ✅ **Complete Step-by-Step Deployment on Render**

Let's deploy your Laiq Bags website on Render! This guide will take you through the entire process.

---

## 📋 **Pre-Deployment Checklist**

### **Before We Start, Ensure You Have:**
- ✅ **GitHub Repository**: Your code is on GitHub
- ✅ **MongoDB Atlas**: Production database ready
- ✅ **Razorpay Account**: Live keys ready
- ✅ **Email Service**: Gmail or SendGrid ready
- ✅ **Domain**: laiqbags.com or similar (optional)

---

## 🎯 **Step 1: Prepare Your Repository**

### **1.1 Push Your Code to GitHub**
```bash
# If not already done, push your code to GitHub:
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### **1.2 Verify Repository Structure**
Your repository should have:
```
laiq-bags/
├── server.js
├── package.json
├── config.env.production
├── models/
├── routes/
├── middleware/
├── js/
├── css/
├── *.html
└── assets/
```

---

## 🌐 **Step 2: Set Up Render Account**

### **2.1 Create Render Account**
```bash
1. Go to: https://render.com
2. Click "Get Started"
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories
```

### **2.2 Connect Your Repository**
```bash
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account
4. Find and select your "laiq-bags" repository
5. Click "Connect"
```

---

## ⚙️ **Step 3: Configure Deployment Settings**

### **3.1 Basic Configuration**
```bash
# Fill in these details:
Name: laiq-bags
Region: Choose closest to your customers
Branch: main
Root Directory: (leave empty - root of repository)
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### **3.2 Environment Variables**
Click "Environment" and add these variables:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://laiqbags:YourPassword123@cluster0.abc123.mongodb.net/laiq_bags_production?retryWrites=true&w=majority

# Payment Gateway Configuration (LIVE KEYS)
RAZORPAY_KEY_ID=rzp_live_ABC123DEF456
RAZORPAY_KEY_SECRET=abcdef123456789xyz

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# JWT Configuration (Use the generated secret)
JWT_SECRET=e4117c76c8604aebc86b3bb3ace0826d4df2c4ba5f4446e4ca8d134de0bf414f
JWT_EXPIRE=7d

# Server Configuration
PORT=process.env.PORT
NODE_ENV=production

# Frontend URL (Update with your domain)
FRONTEND_URL=https://laiqbags.com

# Business Configuration
BUSINESS_NAME=Laiq_Bags
BUSINESS_TYPE=Proprietorship
GST_NUMBER=Your_GST_Number
PAN_NUMBER=Your_PAN_Number
BUSINESS_ADDRESS=Your_Business_Address

# Security Configuration (Use the generated secrets)
ENCRYPTION_KEY=183472b3c04c0e13452ee2770596f632
SESSION_SECRET=f8d9d4b750eb089a728471dcb8c7615d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔧 **Step 4: Get Production Credentials**

### **4.1 MongoDB Atlas Setup**
```bash
1. Go to: https://www.mongodb.com/atlas
2. Sign up/Login to your account
3. Create new cluster (free tier)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace <password> with your database password
8. Add ?retryWrites=true&w=majority at the end
```

### **4.2 Razorpay Live Keys**
```bash
1. Go to: https://razorpay.com
2. Login to your business account
3. Complete KYC if not done
4. Go to Settings → API Keys
5. Generate new key pair
6. Copy Key ID and Key Secret
```

### **4.3 Email Setup (Gmail)**
```bash
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account → Security → App passwords
3. Generate password for "Mail"
4. Use that password in EMAIL_PASS
```

---

## 🚀 **Step 5: Deploy on Render**

### **5.1 Start Deployment**
```bash
1. Click "Create Web Service"
2. Render will start building your application
3. Watch the build logs for any errors
4. Wait for deployment to complete (5-10 minutes)
```

### **5.2 Monitor Build Process**
You should see logs like:
```bash
✅ Cloning repository
✅ Installing dependencies
✅ Building application
✅ Starting server
✅ Deployment successful
```

### **5.3 Get Your Render URL**
After deployment, you'll get:
```
https://laiq-bags.onrender.com
```

---

## 🌐 **Step 6: Configure Custom Domain (Optional)**

### **6.1 Add Custom Domain**
```bash
1. In Render dashboard, go to your service
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter: laiqbags.com
5. Click "Add"
```

### **6.2 Update DNS Records**
```bash
# In your domain registrar (GoDaddy, Namecheap, etc.):
1. Go to DNS management
2. Add CNAME record:
   Name: @
   Value: your-app-name.onrender.com
3. Add CNAME record for www:
   Name: www
   Value: your-app-name.onrender.com
```

---

## ✅ **Step 7: Test Your Deployment**

### **7.1 Basic Functionality Test**
```bash
# Test these features:
1. Visit your website: https://laiq-bags.onrender.com
2. Test admin login: /admin.html
3. Test product creation
4. Test payment processing
5. Test email sending
6. Test user registration
```

### **7.2 Payment Testing**
```bash
# Test payment with Razorpay test card:
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
```

### **7.3 Email Testing**
```bash
# Test email functionality:
1. Register a new user
2. Try password reset
3. Check if emails are sent
```

---

## 🔍 **Step 8: Troubleshooting Common Issues**

### **8.1 Build Failures**
```bash
# Common issues and solutions:

# Issue: npm install fails
Solution: Check package.json is valid

# Issue: Port binding error
Solution: Ensure PORT=process.env.PORT in environment

# Issue: MongoDB connection fails
Solution: Check MONGODB_URI is correct
```

### **8.2 Runtime Errors**
```bash
# Check Render logs:
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. Look for error messages
4. Fix issues and redeploy
```

### **8.3 Environment Variable Issues**
```bash
# Verify environment variables:
1. Go to Environment tab
2. Check all variables are set
3. Ensure no typos in values
4. Redeploy after fixing
```

---

## 📊 **Step 9: Monitor Performance**

### **9.1 Render Dashboard**
```bash
# Monitor in Render dashboard:
1. Uptime and performance
2. Request logs
3. Error logs
4. Resource usage
```

### **9.2 Set Up Monitoring**
```bash
# Recommended monitoring:
1. Google Analytics
2. Google Search Console
3. Uptime monitoring
4. Error tracking
```

---

## 🎉 **Step 10: Go Live!**

### **10.1 Final Checklist**
- [ ] Website loads correctly
- [ ] Admin panel works
- [ ] Payment processing works
- [ ] Email sending works
- [ ] User registration works
- [ ] SSL certificate is active
- [ ] Custom domain works (if added)

### **10.2 Launch Your Website**
```bash
# Your website is now live at:
https://laiq-bags.onrender.com

# Or with custom domain:
https://laiqbags.com
```

---

## 🚀 **Deployment Summary**

### **What We Accomplished:**
- ✅ Deployed Node.js application on Render
- ✅ Configured production environment
- ✅ Set up MongoDB Atlas database
- ✅ Integrated Razorpay payment gateway
- ✅ Configured email service
- ✅ Set up SSL certificate
- ✅ Added custom domain (optional)

### **Your Website Features:**
- ✅ Full e-commerce functionality
- ✅ Admin panel
- ✅ Payment processing
- ✅ Email notifications
- ✅ User management
- ✅ SEO optimization
- ✅ Mobile responsive

### **Next Steps:**
1. **Test everything thoroughly**
2. **Set up analytics**
3. **Monitor performance**
4. **Start marketing your website**

**Your Laiq Bags website is now live and ready for customers! 🎉**
