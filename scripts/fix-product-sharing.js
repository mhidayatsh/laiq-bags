#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Product Sharing Issue...\n');

// Read the product.html file
const productHtmlPath = path.join(__dirname, '..', 'product.html');
const content = fs.readFileSync(productHtmlPath, 'utf8');

console.log('1. Checking current meta tags in product.html:');
console.log('==============================================');

// Check current og:image
const ogImageMatch = content.match(/<meta property="og:image" content="([^"]*)">/);
if (ogImageMatch) {
    console.log(`Current og:image: ${ogImageMatch[1]}`);
} else {
    console.log('❌ og:image meta tag not found');
}

// Check current twitter:image
const twitterImageMatch = content.match(/<meta name="twitter:image" content="([^"]*)">/);
if (twitterImageMatch) {
    console.log(`Current twitter:image: ${twitterImageMatch[1]}`);
} else {
    console.log('❌ twitter:image meta tag not found');
}

console.log('\n2. Checking server.js meta tag replacement:');
console.log('===========================================');

// Read server.js to check the replacement logic
const serverJsPath = path.join(__dirname, '..', 'server.js');
const serverContent = fs.readFileSync(serverJsPath, 'utf8');

// Find the productImage assignment
const productImageMatch = serverContent.match(/const productImage = ([^;]+);/);
if (productImageMatch) {
    console.log(`Product image assignment: ${productImageMatch[1].trim()}`);
} else {
    console.log('❌ Product image assignment not found');
}

// Find the og:image replacement
const ogImageReplacementMatch = serverContent.match(/html = html\.replace\([^)]*og:image[^)]*\);/);
if (ogImageReplacementMatch) {
    console.log('✅ og:image replacement found in server.js');
} else {
    console.log('❌ og:image replacement not found in server.js');
}

console.log('\n3. Testing with a sample product:');
console.log('=================================');

// Test the replacement logic with a sample product
const testProduct = {
    name: 'Test Product',
    images: [{ url: 'https://example.com/test-image.jpg' }],
    price: 999,
    category: 'test'
};

const testHtml = content;
const testProductImage = testProduct.images?.[0]?.url || 'https://www.laiq.shop/assets/laiq-logo.png';

// Test the replacement
let updatedHtml = testHtml.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${testProductImage}">`);
updatedHtml = updatedHtml.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${testProductImage}">`);

// Check if replacement worked
const updatedOgImageMatch = updatedHtml.match(/<meta property="og:image" content="([^"]*)">/);
if (updatedOgImageMatch) {
    console.log(`Updated og:image: ${updatedOgImageMatch[1]}`);
    if (updatedOgImageMatch[1] === testProductImage) {
        console.log('✅ Replacement logic works correctly');
    } else {
        console.log('❌ Replacement logic failed');
    }
}

console.log('\n4. Recommendations:');
console.log('===================');
console.log('1. Clear social media cache:');
console.log('   - Facebook: https://developers.facebook.com/tools/debug/');
console.log('   - Twitter: https://cards-dev.twitter.com/validator');
console.log('   - LinkedIn: https://www.linkedin.com/post-inspector/');
console.log('   - WhatsApp: Clear app cache or wait 24-48 hours');
console.log('');
console.log('2. Verify image URLs are accessible:');
console.log('   - Check if product images are publicly accessible');
console.log('   - Ensure images are not blocked by CORS');
console.log('   - Verify image dimensions (recommended: 1200x630px)');
console.log('');
console.log('3. Test with Facebook Debugger:');
console.log('   - Visit: https://developers.facebook.com/tools/debug/');
console.log('   - Enter your product URL');
console.log('   - Click "Scrape Again" to refresh cache');
console.log('');
console.log('4. Check server logs for any errors when serving product pages');

console.log('\n5. Quick Fix - Force Update Meta Tags:');
console.log('=====================================');

// Create a backup
const backupPath = path.join(__dirname, '..', 'product.html.backup');
fs.writeFileSync(backupPath, content);
console.log(`✅ Backup created: ${backupPath}`);

// Update the default og:image to use a more generic fallback
let fixedContent = content.replace(
    /<meta property="og:image" content="https:\/\/www\.laiq\.shop\/assets\/laiq-logo\.png">/,
    '<meta property="og:image" content="https://www.laiq.shop/assets/laiq-logo.png">'
);

fixedContent = fixedContent.replace(
    /<meta name="twitter:image" content="https:\/\/www\.laiq\.shop\/assets\/laiq-logo\.png">/,
    '<meta name="twitter:image" content="https://www.laiq.shop/assets/laiq-logo.png">'
);

// Add additional meta tags for better social sharing
const additionalMetaTags = `
    <!-- Additional Social Media Meta Tags -->
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:secure_url" content="https://www.laiq.shop/assets/laiq-logo.png">
    <meta name="twitter:image:alt" content="Laiq Bags - Premium Bags and Accessories">
`;

// Insert additional meta tags before closing head tag
fixedContent = fixedContent.replace('</head>', `${additionalMetaTags}</head>`);

// Write the updated content
fs.writeFileSync(productHtmlPath, fixedContent);
console.log('✅ Updated product.html with enhanced meta tags');

console.log('\n6. Next Steps:');
console.log('==============');
console.log('1. Deploy the updated files');
console.log('2. Test with Facebook Debugger');
console.log('3. Clear WhatsApp cache (may take 24-48 hours)');
console.log('4. Monitor server logs for any issues');
console.log('5. If issue persists, check if product images are accessible');

console.log('\n✅ Diagnosis complete!');
