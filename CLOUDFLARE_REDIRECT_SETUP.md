# Cloudflare Redirect Setup Guide

## 🚨 Issue Identified
The redirect from `laiq.shop` is going to `https://laiq.shop/` instead of `https://www.laiq.shop/`. This is because Cloudflare is handling the redirect before it reaches your server.

## ✅ Solution: Cloudflare Page Rules

You need to configure Cloudflare Page Rules to properly redirect to the www version.

### Step 1: Access Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `laiq.shop`
3. Go to **Rules** → **Page Rules**

### Step 2: Create Page Rules

Create these Page Rules in order:

#### Rule 1: HTTP to HTTPS Redirect
- **URL Pattern**: `http://laiq.shop/*`
- **Settings**:
  - **Always Use HTTPS**: On
- **Priority**: 1

#### Rule 2: Non-www to www Redirect
- **URL Pattern**: `https://laiq.shop/*`
- **Settings**:
  - **Forwarding URL**: `https://www.laiq.shop/$1`
  - **Status Code**: 301 - Permanent Redirect
- **Priority**: 2

#### Rule 3: HTTP Non-www to HTTPS www
- **URL Pattern**: `http://laiq.shop/*`
- **Settings**:
  - **Forwarding URL**: `https://www.laiq.shop/$1`
  - **Status Code**: 301 - Permanent Redirect
- **Priority**: 3

### Step 3: Alternative Method (Redirect Rules)

If Page Rules don't work, use **Redirect Rules**:

1. Go to **Rules** → **Redirect Rules**
2. Create a new rule:
   - **Name**: "Non-www to www redirect"
   - **If incoming requests match**: `(http|https)://laiq.shop/*`
   - **Then**: `301 redirect to https://www.laiq.shop/$1`

### Step 4: Test the Redirects

After setting up the rules, test:

```bash
# Test HTTP non-www to HTTPS www
curl -I http://laiq.shop

# Test HTTPS non-www to HTTPS www  
curl -I https://laiq.shop

# Both should redirect to https://www.laiq.shop
```

## 🔍 Verification

### Expected Results:
- `http://laiq.shop` → `https://www.laiq.shop` (301)
- `https://laiq.shop` → `https://www.laiq.shop` (301)
- `http://www.laiq.shop` → `https://www.laiq.shop` (301)

### Check Headers:
```bash
curl -I http://laiq.shop
# Should show: Location: https://www.laiq.shop/
```

## ⚠️ Important Notes

1. **Page Rules Limit**: Free Cloudflare accounts have 3 Page Rules limit
2. **Priority Order**: Higher priority rules execute first
3. **Cache**: Changes may take a few minutes to propagate
4. **SSL/TLS**: Ensure SSL/TLS is set to "Full" or "Full (strict)"

## 🎯 Benefits

After setup:
- ✅ All traffic redirects to www version
- ✅ Google will see consistent URLs
- ✅ SEO performance consolidates
- ✅ Better user experience

## 📞 Need Help?

If you need assistance with Cloudflare configuration:
1. Check Cloudflare documentation
2. Contact Cloudflare support
3. The redirect rules are straightforward to set up

**This will solve your Google search duplicate URL issue! 🎯**
