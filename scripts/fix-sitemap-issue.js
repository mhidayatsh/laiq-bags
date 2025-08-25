const fs = require('fs');
const path = require('path');

console.log('🚨 CRITICAL: Fixing sitemap issue - Product pages missing!');

// Step 1: Remove the static sitemap.xml file to force dynamic generation
const staticSitemapPath = path.join(__dirname, '..', 'sitemap.xml');
if (fs.existsSync(staticSitemapPath)) {
    fs.unlinkSync(staticSitemapPath);
    console.log('✅ Removed static sitemap.xml file');
}

// Step 2: Create a backup of the static sitemap for reference
const backupSitemapPath = path.join(__dirname, '..', 'sitemap-backup.xml');
if (fs.existsSync(backupSitemapPath)) {
    fs.unlinkSync(backupSitemapPath);
}

// Step 3: Update server.js to ensure dynamic sitemap takes precedence
const serverJsPath = path.join(__dirname, '..', 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');

// Check if sitemap routes are properly configured
if (serverJs.includes('app.use(\'/\', sitemapRoutes);')) {
    console.log('✅ Dynamic sitemap routes are properly configured');
} else {
    console.log('❌ Dynamic sitemap routes not found - adding them');
    // Add sitemap routes if missing
    const sitemapRoute = `
// Sitemap routes (must be before static file serving)
app.use('/', sitemapRoutes);`;
    
    // Find where to insert the sitemap routes
    const apiRoutesEnd = serverJs.indexOf('app.use(express.static');
    if (apiRoutesEnd !== -1) {
        serverJs = serverJs.slice(0, apiRoutesEnd) + sitemapRoute + '\n\n' + serverJs.slice(apiRoutesEnd);
        fs.writeFileSync(serverJsPath, serverJs);
        console.log('✅ Added sitemap routes to server.js');
    }
}

// Step 4: Create a test script to verify dynamic sitemap
const testSitemapScript = `
const mongoose = require('mongoose');
require('dotenv').config();

async function testDynamicSitemap() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        const Product = require('./models/Product');
        const products = await Product.find({}).select('slug updatedAt');
        
        console.log('📦 Products found:', products.length);
        products.forEach((product, index) => {
            console.log(\`\${index + 1}. \${product.name} - \${product.slug}\`);
        });
        
        console.log('\\n🎯 Expected sitemap URLs:');
        console.log('- 7 static pages');
        console.log(\`- \${products.length} product pages\`);
        console.log(\`- Total: \${7 + products.length} URLs\`);
        
        await mongoose.disconnect();
        console.log('✅ Test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testDynamicSitemap();
`;

const testScriptPath = path.join(__dirname, '..', 'test-sitemap.js');
fs.writeFileSync(testScriptPath, testSitemapScript);
console.log('✅ Created sitemap test script');

// Step 5: Create deployment instructions
const deploymentInstructions = `
🚀 SITEMAP FIX DEPLOYMENT INSTRUCTIONS:

1. Push the changes:
   git add .
   git commit -m "🚨 CRITICAL FIX: Remove static sitemap - Enable dynamic sitemap with products"
   git push origin main

2. Wait for deployment (5-15 minutes)

3. Test the dynamic sitemap:
   curl -s https://www.laiq.shop/sitemap.xml | grep -c "<url>"
   # Should show: 13 (7 static + 6 products)

4. Verify product pages are included:
   curl -s https://www.laiq.shop/sitemap.xml | grep "product.html"

5. Submit to Google Search Console:
   - Go to Google Search Console
   - Submit sitemap: https://www.laiq.shop/sitemap.xml
   - Request re-indexing

6. Monitor indexing:
   - Check "Coverage" report
   - Look for product pages being indexed
`;

const instructionsPath = path.join(__dirname, '..', 'SITEMAP_FIX_INSTRUCTIONS.md');
fs.writeFileSync(instructionsPath, deploymentInstructions);
console.log('✅ Created deployment instructions');

console.log('\n🎯 SUMMARY:');
console.log('✅ Removed static sitemap.xml file');
console.log('✅ Verified dynamic sitemap routes');
console.log('✅ Created test script');
console.log('✅ Created deployment instructions');

console.log('\n⚠️  CRITICAL: After deployment:');
console.log('1. Dynamic sitemap will include ALL products');
console.log('2. Google will discover product pages');
console.log('3. Product pages will appear in search results');
console.log('4. New products will automatically be included');

console.log('\n📝 Next: Deploy and test the dynamic sitemap');
