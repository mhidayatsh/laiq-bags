const http = require('http');

async function fixProductsViaServer() {
    console.log('🔧 Fixing products via running server...');
    
    try {
        // First, let's check if server is running
        console.log('🔍 Checking server status...');
        const healthResponse = await makeRequest('http://localhost:3001/api/health');
        if (healthResponse.success) {
            console.log('✅ Server is running');
        } else {
            console.log('⚠️ Server health check failed');
        }
        
        // Since we can't directly access the database through the server,
        // let's create a simple fix script that can be run manually
        
        console.log('\n📋 MANUAL FIX REQUIRED:');
        console.log('Since the server is running and we can\'t directly access the database,');
        console.log('you need to manually update the products in your database.');
        
        console.log('\n🔧 Here\'s what you need to do:');
        console.log('1. Open your MongoDB database (MongoDB Compass, Atlas, or command line)');
        console.log('2. Find the "products" collection');
        console.log('3. Update the following fields for products that should have discounts:');
        
        console.log('\n📝 REQUIRED FIELDS TO UPDATE:');
        console.log('   discount: 20 (or whatever percentage you want)');
        console.log('   discountType: "percentage" or "fixed"');
        console.log('   discountAmount: calculated amount');
        console.log('   discountStartDate: new Date()');
        console.log('   discountEndDate: future date');
        console.log('   isDiscountActive: true');
        console.log('   originalPrice: current price');
        
        console.log('\n💡 ALTERNATIVE SOLUTION:');
        console.log('You can also use the admin panel to add discounts:');
        console.log('1. Go to admin-discounts.html');
        console.log('2. Click "+ Add Discount"');
        console.log('3. Select a product and set discount details');
        
        console.log('\n🎯 QUICK FIX SCRIPT:');
        console.log('If you have MongoDB access, run this in MongoDB shell:');
        
        const quickFixScript = `
// MongoDB Quick Fix Script
db.products.updateMany(
  { discount: { $exists: false } },
  { 
    $set: { 
      discount: 0,
      discountType: "percentage",
      discountAmount: 0,
      isDiscountActive: false,
      originalPrice: "$price"
    }
  }
);

// Add sample discount to first product
db.products.updateOne(
  {},
  { 
    $set: { 
      discount: 20,
      discountType: "percentage",
      discountAmount: Math.round(db.products.findOne().price * 0.20),
      discountStartDate: new Date(),
      discountEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isDiscountActive: true,
      originalPrice: db.products.findOne().price
    }
  }
);
        `;
        
        console.log(quickFixScript);
        
        console.log('\n🚀 After fixing the database:');
        console.log('1. Refresh your admin page');
        console.log('2. Go to Products section');
        console.log('3. Go to Discounts section');
        console.log('4. You should now see active discounts!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
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

// Run the fix guide
fixProductsViaServer().catch(console.error);
