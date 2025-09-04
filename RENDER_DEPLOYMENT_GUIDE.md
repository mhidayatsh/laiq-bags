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
EMAIL_USER=laiqbags.shop@gmail.com
EMAIL_PASS=tlph yvvh uxrg wszb
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

