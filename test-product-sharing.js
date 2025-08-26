
// Test Product Sharing Fix
async function testProductSharing() {
    const productId = '68a7183c82057e0e0da0cf94';
    const url = `https://www.laiq.shop/product.html?id=${productId}`;
    
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
