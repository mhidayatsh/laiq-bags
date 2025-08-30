
const https = require('https');
const http = require('http');

async function testProductSharing() {
    const testUrls = [
        'https://www.laiq.shop/product.html?id=68adb49d5cca9f2025159f2f',
        'https://www.laiq.shop/product.html?id=68a7183c82057e0e0da0cf94'
    ];
    
    console.log('🧪 Testing Product Sharing Fix...\n');
    
    for (const url of testUrls) {
        console.log(`Testing: ${url}`);
        
        try {
            const html = await fetchHtml(url);
            
            // Check og:image
            const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)">/);
            if (ogImageMatch) {
                console.log(`✅ og:image: ${ogImageMatch[1]}`);
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
                console.log(`✅ twitter:image: ${twitterImageMatch[1]}`);
            } else {
                console.log('❌ twitter:image not found');
            }
            
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Error testing ${url}:`, error.message);
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
