const http = require('http');

async function testAdminDirect() {
    console.log('🧪 Testing admin API directly through server...');
    
    const baseUrl = 'http://localhost:3001/api';
    
    // Test 1: Check if server is running
    try {
        console.log('\n🔍 Test 1: Checking server status...');
        const healthResponse = await makeRequest(`${baseUrl}/health`);
        if (healthResponse.success) {
            console.log('✅ Server is running and healthy');
        } else {
            console.log('⚠️ Server health check failed:', healthResponse.message);
        }
    } catch (error) {
        console.log('❌ Server health check error:', error.message);
    }
    
    // Test 2: Check admin products endpoint (will fail without auth, but that's expected)
    try {
        console.log('\n🔍 Test 2: Checking admin products endpoint...');
        const productsResponse = await makeRequest(`${baseUrl}/admin/products?page=1&limit=5`);
        
        if (productsResponse.success) {
            console.log('✅ Admin products endpoint working');
            console.log(`📊 Found ${productsResponse.count} products`);
            
            // Analyze first product
            if (productsResponse.products && productsResponse.products.length > 0) {
                const firstProduct = productsResponse.products[0];
                console.log('\n🔍 First product analysis:');
                console.log('  Name:', firstProduct.name);
                console.log('  Price:', firstProduct.price);
                console.log('  Discount:', firstProduct.discount);
                console.log('  Discount Type:', firstProduct.discountType);
                console.log('  Discount Amount:', firstProduct.discountAmount);
                console.log('  Is Discount Active:', firstProduct.isDiscountActive);
                console.log('  Discount End Date:', firstProduct.discountEndDate);
                console.log('  Original Price:', firstProduct.originalPrice);
                
                // Check for discount issues
                if (firstProduct.discount === 0 || firstProduct.discount === undefined) {
                    console.log('\n❌ DISCOUNT ISSUE FOUND:');
                    console.log('   - Product has no discount configured');
                    console.log('   - This explains why "No discount" shows in admin panel');
                }
                
                if (firstProduct.isDiscountActive === undefined) {
                    console.log('\n❌ DISCOUNT STATUS ISSUE:');
                    console.log('   - isDiscountActive field is undefined');
                    console.log('   - This field should be true/false');
                }
                
                if (!firstProduct.originalPrice || firstProduct.originalPrice === 0) {
                    console.log('\n❌ ORIGINAL PRICE ISSUE:');
                    console.log('   - originalPrice field is missing or 0');
                    console.log('   - This should store the price before discount');
                }
            }
        } else {
            console.log('❌ Admin products endpoint failed:', productsResponse.message);
        }
    } catch (error) {
        if (error.message.includes('401')) {
            console.log('✅ Admin products endpoint requires authentication (expected)');
            console.log('💡 This means the endpoint is working but needs admin login');
        } else {
            console.log('❌ Admin products endpoint error:', error.message);
        }
    }
    
    // Test 3: Check if we can access admin page HTML
    try {
        console.log('\n🔍 Test 3: Checking admin page accessibility...');
        const adminPageResponse = await makeRequest('http://localhost:3001/admin.html');
        
        if (adminPageResponse) {
            console.log('✅ Admin page HTML is accessible');
            
            // Check if it contains expected elements
            const htmlContent = adminPageResponse.toString();
            if (htmlContent.includes('products-table-body')) {
                console.log('✅ Products table element found in HTML');
            } else {
                console.log('❌ Products table element missing from HTML');
            }
            
            if (htmlContent.includes('discounts-table-body')) {
                console.log('✅ Discounts table element found in HTML');
            } else {
                console.log('❌ Discounts table element missing from HTML');
            }
        } else {
            console.log('❌ Admin page HTML not accessible');
        }
    } catch (error) {
        console.log('❌ Admin page check error:', error.message);
    }
    
    console.log('\n🎯 Testing complete!');
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    // Try to parse as JSON first
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    // If not JSON, return as string
                    resolve(data);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Run test
testAdminDirect().catch(console.error);
