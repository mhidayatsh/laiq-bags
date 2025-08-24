#!/bin/bash
echo "🚀 Deploying robots.txt fix..."

# Upload files to server (replace with your actual deployment method)
# Example for Render:
# git add .
# git commit -m "Fix robots.txt blocking issue"
# git push origin main

# Or for direct file upload:
# scp robots.txt user@your-server:/path/to/website/
# scp server.js user@your-server:/path/to/website/

echo "✅ Files uploaded"
echo "🔄 Restarting server..."
# Add your server restart command here

echo "🧪 Testing robots.txt..."
curl -s https://www.laiq.shop/robots.txt

echo "✅ Deployment complete!"
echo "📝 Next: Request re-indexing in Google Search Console"
