#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Product Sharing - Product Images Not Showing in Link Previews...\n');

// Check the current product.html file
const productPath = path.join(__dirname, '..', 'product.html');

if (fs.existsSync(productPath)) {
    let content = fs.readFileSync(productPath, 'utf8');
    
    console.log('📝 Current product.html meta tags:');
    
    // Check current og:image
    const ogImageMatch = content.match(/<meta property="og:image" content="([^"]*)">/);
    if (ogImageMatch) {
        console.log(`Current og:image: ${ogImageMatch[1]}`);
    }
    
    // Check current twitter:image
    const twitterImageMatch = content.match(/<meta name="twitter:image" content="([^"]*)">/);
    if (twitterImageMatch) {
        console.log(`Current twitter:image: ${twitterImageMatch[1]}`);
    }
    
    console.log('\n🔍 Issue identified: Meta tags are static, not dynamic');
    console.log('✅ Solution: Server-side dynamic meta tag generation is already implemented');
    console.log('❌ Problem: The dynamic route might not be working properly');
    
    console.log('\n📋 Debugging Steps:');
    console.log('1. Check if the product route is being hit');
    console.log('2. Verify product data is being fetched');
    console.log('3. Ensure meta tags are being replaced');
    
    console.log('\n🔧 Testing the fix:');
    console.log('1. Visit: https://www.laiq.shop/product.html?id=68a7183c82057e0e0da0cf94');
    console.log('2. View page source');
    console.log('3. Check if og:image shows product image instead of logo');
    
    console.log('\n🎯 Expected Result:');
    console.log('- og:image should show: [product-image-url]');
    console.log('- twitter:image should show: [product-image-url]');
    console.log('- NOT: https://www.laiq.shop/assets/laiq-logo.png');
    
    console.log('\n📞 If the issue persists:');
    console.log('1. Check server logs for errors');
    console.log('2. Verify product ID exists in database');
    console.log('3. Test with a different product ID');
    console.log('4. Clear server cache and restart');
}

// Create a test script to verify the fix
const testScript = `
// Test Product Sharing Fix
async function testProductSharing() {
    const productId = '68a7183c82057e0e0da0cf94';
    const url = \`https://www.laiq.shop/product.html?id=\${productId}\`;
    
    console.log('🧪 Testing product sharing for:', url);
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Check og:image
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)">/);
        if (ogImageMatch) {
            console.log('✅ og:image found:', ogImageMatch[1]);
            if (ogImageMatch[1].includes('laiq-logo.png')) {
                console.log('❌ Still showing logo instead of product image');
            } else {
                console.log('✅ Product image is showing correctly');
            }
        }
        
        // Check twitter:image
        const twitterImageMatch = html.match(/<meta name="twitter:image" content="([^"]*)">/);
        if (twitterImageMatch) {
            console.log('✅ twitter:image found:', twitterImageMatch[1]);
        }
        
    } catch (error) {
        console.error('❌ Error testing product sharing:', error);
    }
}

// Run the test
testProductSharing();
`;

const testPath = path.join(__dirname, '..', 'test-product-sharing.js');
fs.writeFileSync(testPath, testScript);
console.log('✅ Created test script: test-product-sharing.js');

console.log('\n🚀 Next Steps:');
console.log('1. Deploy the current changes');
console.log('2. Test the product URL directly');
console.log('3. Check if meta tags are updated dynamically');
console.log('4. If not working, check server logs and database');

console.log('\n📱 To test sharing:');
console.log('1. Share this URL: https://www.laiq.shop/product.html?id=68a7183c82057e0e0da0cf94');
console.log('2. Check if product image appears in preview');
console.log('3. If not, the server-side dynamic generation needs debugging');

console.log('\n🔧 Quick Fix Options:');
console.log('1. Clear server cache and restart');
console.log('2. Check if product exists in database');
console.log('3. Verify the dynamic route is working');
console.log('4. Test with a different product ID');
