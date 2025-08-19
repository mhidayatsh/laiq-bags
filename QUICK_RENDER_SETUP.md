# 🚀 **QUICK RENDER SETUP GUIDE**
## **For GoDaddy Domain + MongoDB Atlas + Render Hosting**

### **📋 What You Need:**
- ✅ GoDaddy domain (you have this)
- ✅ MongoDB Atlas database (you have this)
- ✅ Render account (create at https://render.com)
- ✅ GitHub account (create at https://github.com)

---

## **🚀 STEP-BY-STEP PROCESS:**

### **Step 1: Create GitHub Repository**
1. Go to https://github.com
2. Click "New repository"
3. Name it: `laiq-bags`
4. Make it **Public** (for free Render)
5. Click "Create repository"

### **Step 2: Push Your Code to GitHub**
```bash
# In your project directory, run:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/laiq-bags.git
git push -u origin main
```

### **Step 3: Create Render Account**
1. Go to https://render.com
2. Sign up with your GitHub account
3. Verify your email

### **Step 4: Create Web Service in Render**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `laiq-bags`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### **Step 5: Set Environment Variables**
In Render dashboard → Your Service → Environment → Add these variables:

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

### **Step 6: Deploy**
1. Click "Create Web Service"
2. Wait 2-5 minutes for deployment
3. Your app will be live at: `https://laiq-bags.onrender.com`

### **Step 7: Connect Your GoDaddy Domain**
1. In Render → Your Service → Settings → Custom Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Go to GoDaddy DNS management
4. Add CNAME record:
   - **Name**: `@` (or leave empty)
   - **Value**: `laiq-bags.onrender.com`
   - **TTL**: `600`

---

## **🎯 Expected Timeline:**
- **GitHub setup**: 5 minutes
- **Render setup**: 10 minutes
- **Deployment**: 5 minutes
- **Domain setup**: 10 minutes
- **DNS propagation**: 24-48 hours

---

## **🔧 Quick Commands:**

### **To update your website later:**
```bash
git add .
git commit -m "Update website"
git push origin main
# Render will automatically redeploy!
```

### **To check deployment status:**
- Go to Render dashboard → Your service → Logs

---

## **📞 Support:**

### **If deployment fails:**
1. Check Render logs
2. Verify environment variables
3. Ensure MongoDB connection works

### **If domain doesn't work:**
1. Wait 24-48 hours for DNS
2. Check GoDaddy DNS settings
3. Verify custom domain in Render

---

## **🎉 Success!**

Your website will be available at:
- **Render URL**: `https://laiq-bags.onrender.com`
- **Custom Domain**: `https://yourdomain.com`

**Your website will run automatically and restart on crashes!** 🚀
