# 🔒 **SSL Certificate & Environment Variables Setup Guide**

## 🔐 **Step 3: SSL Certificate Setup**

### **Option 1: Free SSL with Let's Encrypt (Recommended)**

#### **For Hosting Platforms (Automatic SSL):**

**Render (Recommended for beginners):**
```bash
# SSL is automatically provided when you:
1. Connect your domain to Render
2. Render automatically issues SSL certificate
3. No manual configuration needed
```

**Railway:**
```bash
# SSL is automatically provided
1. Deploy your app to Railway
2. Connect custom domain
3. SSL certificate auto-generated
```

**Heroku:**
```bash
# SSL is automatically provided
1. Deploy to Heroku
2. Add custom domain
3. SSL certificate auto-generated
```

#### **For VPS/Server (Manual SSL):**

**Using Certbot (Let's Encrypt):**
```bash
# Install Certbot
sudo apt update
sudo apt install certbot

# Get SSL certificate
sudo certbot --nginx -d laiqbags.com -d www.laiqbags.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Option 2: Cloudflare SSL (Free)**

**Setup Steps:**
1. **Sign up for Cloudflare** (free)
2. **Add your domain** to Cloudflare
3. **Update DNS** to use Cloudflare nameservers
4. **Enable SSL/TLS** in Cloudflare dashboard
5. **Set SSL mode** to "Full" or "Full (strict)"

**Benefits:**
- ✅ Free SSL certificate
- ✅ CDN for faster loading
- ✅ DDoS protection
- ✅ Easy setup

### **Option 3: Hosting Provider SSL**

**Most hosting providers offer free SSL:**
- **Namecheap**: Free SSL with hosting
- **GoDaddy**: Free SSL with hosting
- **Hostinger**: Free SSL with hosting
- **Bluehost**: Free SSL with hosting

---

## ⚙️ **Step 4: Environment Variables Setup**

### **Step 4.1: MongoDB Atlas Setup**

**1. Create MongoDB Atlas Account:**
```bash
# Go to: https://www.mongodb.com/atlas
# Sign up for free account
# Create new cluster (free tier available)
```

**2. Get Connection String:**
```bash
# In MongoDB Atlas:
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace <password> with your database password
```

**Example Connection String:**
```bash
MONGODB_URI=mongodb+srv://laiqbags:YourPassword123@cluster0.abc123.mongodb.net/laiq_bags_production?retryWrites=true&w=majority
```

### **Step 4.2: Razorpay Live Keys Setup**

**1. Create Razorpay Account:**
```bash
# Go to: https://razorpay.com
# Sign up for business account
# Complete KYC verification
```

**2. Get Live API Keys:**
```bash
# In Razorpay Dashboard:
1. Go to Settings > API Keys
2. Generate new key pair
3. Copy Key ID and Key Secret
```

**Example Razorpay Keys:**
```bash
RAZORPAY_KEY_ID=rzp_live_ABC123DEF456
RAZORPAY_KEY_SECRET=abcdef123456789xyz
```

### **Step 4.3: Email Service Setup**

**Option 1: Gmail (Free)**
```bash
# 1. Enable 2-Factor Authentication on Gmail
# 2. Generate App Password:
#    - Go to Google Account settings
#    - Security > 2-Step Verification > App passwords
#    - Generate password for "Mail"

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Option 2: SendGrid (Free tier available)**
```bash
# 1. Sign up at sendgrid.com
# 2. Get API key
# 3. Update environment variables

EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### **Step 4.4: Generate Strong Secrets**

**JWT Secret (64 characters):**
```bash
# Generate using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Encryption Key (32 characters):**
```bash
# Generate using Node.js:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Example output:
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234
```

**Session Secret:**
```bash
# Generate using Node.js:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Example output:
SESSION_SECRET=a1b2c3d4e5f6789012345678901234
```

---

## 🚀 **Complete Environment Variables Setup**

### **Final Production Environment File:**

Create `config.env.production` with real values:

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

# JWT Configuration
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
JWT_EXPIRE=7d

# Server Configuration
PORT=process.env.PORT
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://laiqbags.com

# Business Configuration
BUSINESS_NAME=Laiq_Bags
BUSINESS_TYPE=Proprietorship
GST_NUMBER=Your_GST_Number
PAN_NUMBER=Your_PAN_Number
BUSINESS_ADDRESS=Your_Business_Address

# Security Configuration
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234
SESSION_SECRET=a1b2c3d4e5f6789012345678901234
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🌐 **Hosting Platform Setup**

### **Render (Recommended for Beginners):**

**1. Sign up at render.com**
**2. Connect your GitHub repository**
**3. Set environment variables:**
```bash
# In Render dashboard:
1. Go to your service
2. Click "Environment"
3. Add each variable from config.env.production
4. Deploy automatically
```

### **Railway:**

**1. Sign up at railway.app**
**2. Connect your GitHub repository**
**3. Set environment variables:**
```bash
# In Railway dashboard:
1. Go to your project
2. Click "Variables"
3. Add each variable from config.env.production
4. Deploy automatically
```

### **Heroku:**

**1. Sign up at heroku.com**
**2. Install Heroku CLI**
**3. Set environment variables:**
```bash
# Using Heroku CLI:
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set RAZORPAY_KEY_ID="your-razorpay-key"
heroku config:set RAZORPAY_KEY_SECRET="your-razorpay-secret"
# ... add all other variables
```

---

## ✅ **Testing Checklist**

### **After Setup, Test:**

1. **SSL Certificate:**
   - Visit https://your-domain.com
   - Check for green padlock in browser
   - Test payment processing

2. **Environment Variables:**
   - Test admin login
   - Test product creation
   - Test payment processing
   - Test email sending
   - Test user registration

3. **Security:**
   - Check HTTPS redirect
   - Test rate limiting
   - Verify JWT tokens work

---

## 🎯 **Quick Setup Commands**

### **Generate Secrets:**
```bash
# Run these commands to generate secure secrets:
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo "ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")"
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")"
```

### **Test Environment:**
```bash
# Test your environment variables:
node -e "
require('dotenv').config({ path: './config.env.production' });
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('Razorpay Key:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('Email Config:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
"
```

**Your SSL and environment variables will be ready in 30 minutes! 🚀**
