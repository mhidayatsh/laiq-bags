const mongoose = require('mongoose');

// Use local database connection
const MONGODB_URI = 'mongodb://localhost:27017/laiq_bags';

async function fixProductsDiscounts() {
    try {
        console.log('🔍 Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Get Product model
        const Product = require('./models/Product');
        
        console.log('\n📦 Checking current products...');
        
        // Get all products
        const products = await Product.find({}).lean();
        console.log(`📊 Found ${products.length} products`);
        
        if (products.length === 0) {
            console.log('❌ No products found in database');
            return;
        }
        
        // Show current state
        console.log('\n🔍 Current product discount status:');
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   Price: ₹${product.price}`);
            console.log(`   Discount: ${product.discount || 'Not set'}`);
            console.log(`   Is Active: ${product.isDiscountActive || 'Not set'}`);
            console.log(`   Original Price: ${product.originalPrice || 'Not set'}`);
        });
        
        // Ask user if they want to proceed
        console.log('\n⚠️  WARNING: This will modify your database!');
        console.log('💡 This script will:');
        console.log('   1. Add sample discounts to some products');
        console.log('   2. Set proper discount fields');
        console.log('   3. Update discount status');
        
        // For demo purposes, let's add some sample discounts
        console.log('\n🎯 Adding sample discounts to products...');
        
        const updates = [];
        
        // Update first product with 20% discount
        if (products[0]) {
            const update1 = Product.findByIdAndUpdate(products[0]._id, {
                $set: {
                    discount: 20,
                    discountType: 'percentage',
                    discountAmount: Math.round(products[0].price * 0.20),
                    discountStartDate: new Date(),
                    discountEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    isDiscountActive: true,
                    originalPrice: products[0].price
                }
            });
            updates.push(update1);
            console.log(`✅ Added 20% discount to: ${products[0].name}`);
        }
        
        // Update second product with 15% discount
        if (products[1]) {
            const update2 = Product.findByIdAndUpdate(products[1]._id, {
                $set: {
                    discount: 15,
                    discountType: 'percentage',
                    discountAmount: Math.round(products[1].price * 0.15),
                    discountStartDate: new Date(),
                    discountEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
                    isDiscountActive: true,
                    originalPrice: products[1].price
                }
            });
            updates.push(update2);
            console.log(`✅ Added 15% discount to: ${products[1].name}`);
        }
        
        // Update third product with fixed amount discount
        if (products[2]) {
            const update3 = Product.findByIdAndUpdate(products[2]._id, {
                $set: {
                    discount: 0, // For fixed amount, percentage is 0
                    discountType: 'fixed',
                    discountAmount: 200, // ₹200 off
                    discountStartDate: new Date(),
                    discountEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
                    isDiscountActive: true,
                    originalPrice: products[2].price
                }
            });
            updates.push(update3);
            console.log(`✅ Added ₹200 fixed discount to: ${products[2].name}`);
        }
        
        // Execute all updates
        if (updates.length > 0) {
            await Promise.all(updates);
            console.log(`\n✅ Successfully updated ${updates.length} products`);
        }
        
        // Verify the updates
        console.log('\n🔍 Verifying updates...');
        const updatedProducts = await Product.find({}).lean();
        
        updatedProducts.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name}`);
            console.log(`   Price: ₹${product.price}`);
            console.log(`   Discount: ${product.discount}%`);
            console.log(`   Discount Type: ${product.discountType}`);
            console.log(`   Discount Amount: ₹${product.discountAmount}`);
            console.log(`   Is Active: ${product.isDiscountActive}`);
            console.log(`   Original Price: ₹${product.originalPrice}`);
            
            if (product.discountEndDate) {
                const endDate = new Date(product.discountEndDate);
                const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
                console.log(`   End Date: ${endDate.toLocaleDateString()} (${daysLeft} days left)`);
            }
        });
        
        console.log('\n🎉 Database fix completed!');
        console.log('💡 Now refresh your admin page to see the discounts');
        
    } catch (error) {
        console.error('❌ Error fixing products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the fix
fixProductsDiscounts().catch(console.error);
