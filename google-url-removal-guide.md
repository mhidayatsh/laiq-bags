# Google URL Removal Guide - Fix Duplicate Content Issue

## 🚨 URGENT: Duplicate Content Problem

Your website is appearing TWICE in Google search results:
- `laiq.shop` (old domain)
- `www.laiq.shop` (correct domain)

This causes duplicate content penalties and SEO issues.

## 🔧 IMMEDIATE FIXES:

### Step 1: Deploy Updated Code
1. Upload the updated `server.js` to your hosting server
2. The redirect logic will automatically redirect `laiq.shop` → `www.laiq.shop`

### Step 2: Remove Old URLs from Google Index

#### Option A: Google Search Console URL Removal
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your `www.laiq.shop` property
3. Go to **Indexing** → **Removals**
4. Click **"New request"**
5. Add these URLs to remove:
   ```
   https://laiq.shop/
   https://laiq.shop/shop.html
   https://laiq.shop/about.html
   https://laiq.shop/contact.html
   https://laiq.shop/product.html
   https://laiq.shop/customer-login.html
   https://laiq.shop/customer-register.html
   https://laiq.shop/forgot-password.html
   https://laiq.shop/checkout.html
   ```
6. Select **"Temporarily hide"** and submit

#### Option B: Add No-Index Meta Tags (Temporary)
If you can't deploy immediately, add this to your HTML files:
```html
<meta name="robots" content="noindex, nofollow">
```

### Step 3: Update DNS Configuration
Ensure both domains point to your hosting:
- `laiq.shop` → Your hosting IP
- `www.laiq.shop` → Your hosting IP

### Step 4: Monitor and Wait
1. Wait 24-48 hours for changes to take effect
2. Check Google Search Console for URL removal status
3. Monitor search results for improvement

## 📊 Expected Results:
- ✅ Only `www.laiq.shop` appears in search results
- ✅ No more duplicate content penalties
- ✅ Better search rankings
- ✅ Cleaner analytics data

## ⚠️ Important Notes:
- URL removal is temporary (6 months)
- After 6 months, old URLs may reappear if not properly redirected
- The server-side redirects are the permanent solution
- Always use `www.laiq.shop` in all your marketing and links

## 🎯 Priority Actions:
1. **DEPLOY** the updated `server.js` immediately
2. **REMOVE** old URLs from Google Search Console
3. **TEST** both domains work correctly
4. **MONITOR** search results for improvement
