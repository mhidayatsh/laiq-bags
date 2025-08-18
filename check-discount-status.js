const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

async function checkDiscountStatus() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all products
        const products = await Product.find({});
        console.log(`📊 Found ${products.length} products`);

        // Check products with discounts
        const productsWithDiscount = products.filter(p => p.discount > 0);
        console.log(`🏷️ Products with discount value > 0: ${productsWithDiscount.length}`);

        // Check products with active discounts
        const productsWithActiveDiscount = products.filter(p => p.isDiscountActive);
        console.log(`✅ Products with isDiscountActive = true: ${productsWithActiveDiscount.length}`);

        // Check for mismatch between discount value and active status
        const mismatchedProducts = products.filter(p => 
            (p.discount > 0 && !p.isDiscountActive) || 
            (p.discount <= 0 && p.isDiscountActive)
        );
        
        if (mismatchedProducts.length > 0) {
            console.log(`⚠️ Found ${mismatchedProducts.length} products with mismatched discount status:`);
            mismatchedProducts.forEach(p => {
                console.log(`   - ${p.name}: discount=${p.discount}, isDiscountActive=${p.isDiscountActive}`);
            });
        } else {
            console.log('✅ No products with mismatched discount status');
        }

        // Check discount info method
        console.log('\n📝 Testing getDiscountInfo method on products with discounts:');
        for (const product of productsWithDiscount.slice(0, 3)) { // Check first 3 products
            console.log(`\n🔍 Product: ${product.name}`);
            console.log(`   Discount: ${product.discount}%`);
            console.log(`   isDiscountActive: ${product.isDiscountActive}`);
            console.log(`   discountStartDate: ${product.discountStartDate || 'Not set'}`);
            console.log(`   discountEndDate: ${product.discountEndDate || 'Not set'}`);
            console.log(`   discountStatus: ${product.discountStatus}`);
            
            const discountInfo = product.getDiscountInfo();
            console.log(`   getDiscountInfo() result: ${discountInfo ? JSON.stringify(discountInfo, null, 2) : 'null'}`);
        }

    } catch (error) {
        console.error('❌ Error checking discount status:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkDiscountStatus().catch(console.error);