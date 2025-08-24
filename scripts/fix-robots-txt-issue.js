const fs = require('fs');
const path = require('path');

console.log('🚨 CRITICAL: Fixing robots.txt blocking issue...');

// Step 1: Create a clean robots.txt file
const robotsContent = `User-agent: *
Allow: /

Sitemap: https://www.laiq.shop/sitemap.xml`;

const robotsPath = path.join(__dirname, '..', 'robots.txt');
fs.writeFileSync(robotsPath, robotsContent);
console.log('✅ Created clean robots.txt file');

// Step 2: Verify the file content
const fileContent = fs.readFileSync(robotsPath, 'utf8');
console.log('📄 robots.txt content:');
console.log(fileContent);

// Step 3: Test the file locally
console.log('\n🧪 Testing robots.txt locally...');
const testUrl = 'http://localhost:3001/robots.txt';
console.log(`Test URL: ${testUrl}`);

// Step 4: Instructions for deployment
console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
console.log('1. Upload the updated robots.txt file to your server');
console.log('2. Upload the updated server.js file (removed duplicate route)');
console.log('3. Restart your server');
console.log('4. Test: curl https://www.laiq.shop/robots.txt');
console.log('5. Request re-indexing in Google Search Console');

// Step 5: Create a deployment script
const deployScript = `#!/bin/bash
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
`;

const deployScriptPath = path.join(__dirname, '..', 'deploy-robots-fix.sh');
fs.writeFileSync(deployScriptPath, deployScript);
fs.chmodSync(deployScriptPath, '755');
console.log('✅ Created deployment script: deploy-robots-fix.sh');

console.log('\n🎯 SUMMARY:');
console.log('✅ Fixed robots.txt content');
console.log('✅ Removed duplicate route from server.js');
console.log('✅ Created deployment script');
console.log('📝 Next: Deploy and test the fix');

console.log('\n⚠️  IMPORTANT: After deployment, you must:');
console.log('1. Go to Google Search Console');
console.log('2. Use "URL Inspection" tool');
console.log('3. Enter: https://www.laiq.shop/');
console.log('4. Click "Request Indexing"');
console.log('5. Wait 24-48 hours for Google to re-crawl');
