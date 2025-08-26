# Domain Consistency Issue Report

## 🚨 Issue Identified
When searching for "laiq backpack" on Google, two different URLs are showing up:
1. `https://laiq.shop` (non-www version)
2. `https://www.laiq.shop > shop` (www version)

This indicates Google has indexed both versions of your domain, causing duplicate content issues.

## ✅ Current Server Configuration
Your server is correctly configured to redirect `laiq.shop` to `www.laiq.shop` with a 301 redirect:

```javascript
// From server.js lines 188-192
if (process.env.NODE_ENV === 'production' && 
    host === 'laiq.shop' && 
    !host.startsWith('www.')) {
  
  // Redirect to www version with HTTPS
  const redirectUrl = `https://www.laiq.shop${req.url}`;
  return res.redirect(301, redirectUrl);
}
```

## 🎯 Solution Steps

### 1. Google Search Console Setup
- Add both domains to Google Search Console
- Set `www.laiq.shop` as the preferred domain
- Request removal of `laiq.shop` URLs

### 2. Canonical URLs
Ensure all pages have canonical URLs pointing to the www version.

### 3. Sitemap Consistency
Your sitemap correctly uses `www.laiq.shop` URLs.

### 4. Robots.txt
Your robots.txt correctly references `www.laiq.shop`.

## 📋 Action Plan

1. **Immediate**: The 301 redirects are working correctly
2. **Google Search Console**: Set preferred domain to www
3. **Monitor**: Watch for consolidation of search results
4. **Time**: This process typically takes 2-4 weeks

## 🔍 Verification
- ✅ 301 redirects are in place
- ✅ Sitemap uses www version
- ✅ Robots.txt uses www version
- ✅ All internal links use www version

The technical setup is correct. The issue is that Google needs time to process the redirects and consolidate the indexed URLs.
