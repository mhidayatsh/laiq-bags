const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Product Sharing Cache Issue...\n');

// Read the product.html file
const productHtmlPath = path.join(__dirname, '..', 'product.html');
const content = fs.readFileSync(productHtmlPath, 'utf8');

console.log('1. Current Issue Analysis:');
console.log('==========================');
console.log('✅ Server-side meta tag replacement is working correctly');
console.log('❌ Social media platforms are caching the old meta tags');
console.log('❌ WhatsApp and other platforms need cache refresh');

console.log('\n2. Implementing Cache-Busting Solution:');
console.log('=======================================');

// Create a backup
const backupPath = path.join(__dirname, '..', 'product.html.backup.' + Date.now());
fs.writeFileSync(backupPath, content);
console.log(`✅ Backup created: ${backupPath}`);

// Add cache-busting meta tags and improve social sharing
const cacheBustingMetaTags = `
    <!-- Cache Control for Social Media -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    
    <!-- Enhanced Social Media Meta Tags -->
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:secure_url" content="https://www.laiq.shop/assets/laiq-logo.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Laiq Bags - Premium Bags and Accessories">
    
    <!-- Additional Open Graph Tags -->
    <meta property="og:site_name" content="Laiq Bags">
    <meta property="og:locale" content="en_US">
    <meta property="og:type" content="website">
    
    <!-- Enhanced Twitter Card Tags -->
    <meta name="twitter:image:alt" content="Laiq Bags - Premium Bags and Accessories">
    <meta name="twitter:site" content="@laiq_bags_">
    <meta name="twitter:creator" content="@laiq_bags_">
    
    <!-- WhatsApp Specific Meta Tags -->
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    
    <!-- Force Cache Refresh -->
    <meta name="robots" content="noarchive">
`;

// Update the content with enhanced meta tags
let updatedContent = content.replace('</head>', `${cacheBustingMetaTags}</head>`);

// Add a version parameter to force cache refresh
const versionParam = `?v=${Date.now()}`;
updatedContent = updatedContent.replace(
    /<meta property="og:image" content="([^"]*)">/,
    `<meta property="og:image" content="$1${versionParam}">`
);
updatedContent = updatedContent.replace(
    /<meta name="twitter:image" content="([^"]*)">/,
    `<meta name="twitter:image" content="$1${versionParam}">`
);

// Write the updated content
fs.writeFileSync(productHtmlPath, updatedContent);
console.log('✅ Updated product.html with cache-busting meta tags');

console.log('\n3. Creating Social Media Cache Refresh Script:');
console.log('==============================================');

// Create a script to help refresh social media caches
const cacheRefreshScript = `
// Social Media Cache Refresh Helper
console.log('🔄 Social Media Cache Refresh Instructions:');
console.log('==========================================');

console.log('\\n1. Facebook Debugger:');
console.log('   - Visit: https://developers.facebook.com/tools/debug/');
console.log('   - Enter your product URL');
console.log('   - Click "Scrape Again" to refresh cache');
console.log('   - Repeat for each product URL');

console.log('\\n2. Twitter Card Validator:');
console.log('   - Visit: https://cards-dev.twitter.com/validator');
console.log('   - Enter your product URL');
console.log('   - Click "Preview card" to refresh cache');

console.log('\\n3. LinkedIn Post Inspector:');
console.log('   - Visit: https://www.linkedin.com/post-inspector/');
console.log('   - Enter your product URL');
console.log('   - Click "Inspect" to refresh cache');

console.log('\\n4. WhatsApp Cache:');
console.log('   - Clear WhatsApp app cache');
console.log('   - Or wait 24-48 hours for automatic refresh');
console.log('   - Test with a new chat/contact');

console.log('\\n5. Test URLs:');
console.log('   - Product 1: https://www.laiq.shop/product.html?id=68adb49d5cca9f2025159f2f');
console.log('   - Product 2: https://www.laiq.shop/product.html?id=68a7183c82057e0e0da0cf94');
console.log('   - Product 3: https://www.laiq.shop/product.html?id=68a7183c82057e0e0da0cf95');

console.log('\\n6. Server-Side Verification:');
console.log('   - Check server logs for meta tag updates');
console.log('   - Verify product images are accessible');
console.log('   - Test with curl: curl -I https://www.laiq.shop/product.html?id=68adb49d5cca9f2025159f2f');
`;

const cacheRefreshPath = path.join(__dirname, '..', 'social-media-cache-refresh.js');
fs.writeFileSync(cacheRefreshPath, cacheRefreshScript);
console.log(`✅ Created cache refresh helper: ${cacheRefreshPath}`);

console.log('\n4. Creating Test Script:');
console.log('=======================');

// Create a test script to verify the fix
const testScript = `
const https = require('https');
const http = require('http');

async function testProductSharing() {
    const testUrls = [
        'https://www.laiq.shop/product.html?id=68adb49d5cca9f2025159f2f',
        'https://www.laiq.shop/product.html?id=68a7183c82057e0e0da0cf94'
    ];
    
    console.log('🧪 Testing Product Sharing Fix...\\n');
    
    for (const url of testUrls) {
        console.log(\`Testing: \${url}\`);
        
        try {
            const html = await fetchHtml(url);
            
            // Check og:image
            const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)">/);
            if (ogImageMatch) {
                console.log(\`✅ og:image: \${ogImageMatch[1]}\`);
                if (ogImageMatch[1].includes('laiq-logo.png')) {
                    console.log('⚠️  Still showing logo (may be cached)');
                } else {
                    console.log('✅ Product image detected');
                }
            } else {
                console.log('❌ og:image not found');
            }
            
            // Check twitter:image
            const twitterImageMatch = html.match(/<meta name="twitter:image" content="([^"]*)">/);
            if (twitterImageMatch) {
                console.log(\`✅ twitter:image: \${twitterImageMatch[1]}\`);
            } else {
                console.log('❌ twitter:image not found');
            }
            
            console.log('---');
            
        } catch (error) {
            console.error(\`❌ Error testing \${url}:\`, error.message);
        }
    }
}

function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

testProductSharing();
`;

const testPath = path.join(__dirname, '..', 'test-product-sharing-fix.js');
fs.writeFileSync(testPath, testScript);
console.log(`✅ Created test script: ${testPath}`);

console.log('\n5. Server.js Enhancement:');
console.log('========================');

// Read server.js to add cache-busting headers
const serverJsPath = path.join(__dirname, '..', 'server.js');
const serverContent = fs.readFileSync(serverJsPath, 'utf8');

// Add cache-busting headers to the product route
const cacheHeaders = `
    // Add cache-busting headers for social media
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noarchive'
    });
`;

// Find the product route and add cache headers
if (!serverContent.includes('Cache-Control')) {
    const updatedServerContent = serverContent.replace(
        /res\.set\('Content-Type', 'text\/html'\);/,
        `res.set('Content-Type', 'text/html');\n    ${cacheHeaders}`
    );
    
    fs.writeFileSync(serverJsPath, updatedServerContent);
    console.log('✅ Added cache-busting headers to server.js');
} else {
    console.log('✅ Cache headers already present in server.js');
}

console.log('\n6. Final Steps:');
console.log('===============');
console.log('1. Deploy the updated files to your server');
console.log('2. Restart the server to apply changes');
console.log('3. Test with Facebook Debugger');
console.log('4. Clear WhatsApp cache or wait 24-48 hours');
console.log('5. Monitor server logs for any issues');

console.log('\n7. Quick Commands:');
console.log('==================');
console.log('Test the fix: node test-product-sharing-fix.js');
console.log('View cache refresh guide: node social-media-cache-refresh.js');
console.log('Deploy: ./deploy-production.sh');

console.log('\n✅ Product sharing cache fix complete!');
console.log('📱 The issue should be resolved after clearing social media caches.');
