const mongoose = require('mongoose');
// Use local database connection
const MONGODB_URI = 'mongodb://localhost:27017/laiq_bags';

async function checkDatabaseDiscounts() {
    try {
        console.log('🔍 Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Get Product model
        const Product = require('./models/Product');
        
        console.log('\n📦 Checking all products for discount data...');
        
        // Get all products with discount fields
        const products = await Product.find({}, {
            name: 1,
            price: 1,
            discount: 1,
            discountType: 1,
            discountAmount: 1,
            discountStartDate: 1,
            discountEndDate: 1,
            isDiscountActive: 1,
            originalPrice: 1
        }).lean();
        
        console.log(`📊 Found ${products.length} products`);
        
        // Analyze each product
        products.forEach((product, index) => {
            console.log(`\n🔍 Product ${index + 1}: ${product.name}`);
            console.log(`   Price: ₹${product.price}`);
            console.log(`   Discount: ${product.discount}%`);
            console.log(`   Discount Type: ${product.discountType || 'Not set'}`);
            console.log(`   Discount Amount: ₹${product.discountAmount || 'Not set'}`);
            console.log(`   Discount Start: ${product.discountStartDate || 'Not set'}`);
            console.log(`   Discount End: ${product.discountEndDate || 'Not set'}`);
            console.log(`   Is Active: ${product.isDiscountActive}`);
            console.log(`   Original Price: ₹${product.originalPrice || 'Not set'}`);
            
            // Check if discount should be active
            if (product.discount && product.discount > 0) {
                const now = new Date();
                let shouldBeActive = true;
                
                if (product.discountStartDate && now < new Date(product.discountStartDate)) {
                    shouldBeActive = false;
                    console.log(`   ⚠️  Discount not started yet`);
                }
                
                if (product.discountEndDate && now > new Date(product.discountEndDate)) {
                    shouldBeActive = false;
                    console.log(`   ⚠️  Discount expired`);
                }
                
                console.log(`   🎯 Should be active: ${shouldBeActive}`);
                
                if (shouldBeActive !== product.isDiscountActive) {
                    console.log(`   ❌ Discount status mismatch!`);
                }
            } else {
                console.log(`   ℹ️  No discount configured`);
            }
        });
        
        // Check for products that should have discounts but don't
        const productsWithDiscounts = products.filter(p => p.discount && p.discount > 0);
        console.log(`\n🎯 Products with discounts: ${productsWithDiscounts.length}`);
        
        if (productsWithDiscounts.length === 0) {
            console.log('❌ No products have discounts configured!');
            console.log('💡 You need to add discounts to products first.');
        }
        
        // Check for products with discount but inactive status
        const productsWithInactiveDiscounts = products.filter(p => 
            p.discount && p.discount > 0 && !p.isDiscountActive
        );
        
        if (productsWithInactiveDiscounts.length > 0) {
            console.log(`\n⚠️  Products with inactive discounts: ${productsWithInactiveDiscounts.length}`);
            productsWithInactiveDiscounts.forEach(p => {
                console.log(`   - ${p.name}: ${p.discount}% discount but inactive`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkDatabaseDiscounts().catch(console.error);
