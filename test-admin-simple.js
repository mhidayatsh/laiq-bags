const http = require('http');

async function testAdminAPI() {
    console.log('🧪 Testing admin API endpoints...');
    
    const baseUrl = 'http://localhost:3001/api';
    
    // Test admin products endpoint
    try {
        console.log('📦 Testing admin products endpoint...');
        const productsResponse = await makeRequest(`${baseUrl}/admin/products?page=1&limit=5`);
        
        if (productsResponse.success) {
            console.log('✅ Admin products endpoint working');
            console.log(`📊 Found ${productsResponse.count} products`);
            console.log(`📊 Total products: ${productsResponse.totalProducts}`);
            
            // Check if products have discount fields
            if (productsResponse.products && productsResponse.products.length > 0) {
                const firstProduct = productsResponse.products[0];
                console.log('🔍 First product discount fields:');
                console.log('  - discount:', firstProduct.discount);
                console.log('  - discountType:', firstProduct.discountType);
                console.log('  - discountAmount:', firstProduct.discountAmount);
                console.log('  - isDiscountActive:', firstProduct.isDiscountActive);
                console.log('  - discountEndDate:', firstProduct.discountEndDate);
                
                // Check for products with discounts
                const productsWithDiscounts = productsResponse.products.filter(p => 
                    p.discount && p.discount > 0
                );
                console.log(`🎯 Products with discounts: ${productsWithDiscounts.length}`);
                
                if (productsWithDiscounts.length > 0) {
                    console.log('✅ Discount system is working');
                } else {
                    console.log('⚠️ No products with discounts found');
                }
            }
        } else {
            console.log('❌ Admin products endpoint failed:', productsResponse.message);
        }
    } catch (error) {
        console.error('❌ Error testing admin products:', error.message);
    }
    
    // Test admin dashboard endpoint
    try {
        console.log('\n📊 Testing admin dashboard endpoint...');
        const dashboardResponse = await makeRequest(`${baseUrl}/admin/dashboard`);
        
        if (dashboardResponse.success) {
            console.log('✅ Admin dashboard endpoint working');
            console.log('📊 Dashboard stats:', {
                totalProducts: dashboardResponse.totalProducts,
                totalOrders: dashboardResponse.totalOrders,
                totalCustomers: dashboardResponse.totalCustomers
            });
        } else {
            console.log('❌ Admin dashboard endpoint failed:', dashboardResponse.message);
        }
    } catch (error) {
        console.error('❌ Error testing admin dashboard:', error.message);
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
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
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
testAdminAPI().catch(console.error);
