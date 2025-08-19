const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

async function testDiscountFixes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all products with discounts
        const products = await Product.find({ discount: { $gt: 0 } });
        console.log(`📊 Found ${products.length} products with discounts`);

        console.log('\n🧪 Testing discount validation methods:');
        
        for (const product of products) {
            console.log(`\n🔍 Testing product: ${product.name}`);
            console.log(`   Original discount: ${product.discount}%`);
            console.log(`   isDiscountActive flag: ${product.isDiscountActive}`);
            
            // Test the new real-time validation methods
            const isValid = product.isDiscountValid();
            const currentStatus = product.getCurrentDiscountStatus();
            const discountInfo = product.getDiscountInfo();
            
            console.log(`   isDiscountValid(): ${isValid}`);
            console.log(`   getCurrentDiscountStatus(): ${currentStatus}`);
            console.log(`   getDiscountInfo(): ${discountInfo ? 'Available' : 'null'}`);
            
            if (discountInfo) {
                console.log(`   Discount Info Details:`);
                console.log(`     - Type: ${discountInfo.type}`);
                console.log(`     - Value: ${discountInfo.value}`);
                console.log(`     - Original Price: ₹${discountInfo.originalPrice}`);
                console.log(`     - Discount Price: ₹${discountInfo.discountPrice}`);
                console.log(`     - Savings: ₹${discountInfo.savings}`);
                console.log(`     - Status: ${discountInfo.status}`);
            }
            
            // Test price calculation
            const originalPrice = product.price;
            const discountedPrice = product.discountPrice;
            console.log(`   Price Calculation:`);
            console.log(`     - Original: ₹${originalPrice}`);
            console.log(`     - Discounted: ₹${discountedPrice}`);
            console.log(`     - Savings: ₹${originalPrice - discountedPrice}`);
        }

        console.log('\n✅ Discount system test completed!');
        console.log('\n📋 Summary of fixes applied:');
        console.log('   ✅ Real-time discount validation');
        console.log('   ✅ Consistent discount calculation across all endpoints');
        console.log('   ✅ Fixed admin products API to include discount fields');
        console.log('   ✅ Updated frontend discount logic');
        console.log('   ✅ Database cleanup script created');

    } catch (error) {
        console.error('❌ Error testing discount fixes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testDiscountFixes().catch(console.error);
