const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

async function fixDiscountSystem() {
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

        let updatedCount = 0;
        let issuesFound = 0;

        for (const product of products) {
            console.log(`\n🔍 Checking product: ${product.name}`);
            console.log(`   Current discount: ${product.discount}%`);
            console.log(`   Current isDiscountActive: ${product.isDiscountActive}`);
            console.log(`   Start date: ${product.discountStartDate || 'Not set'}`);
            console.log(`   End date: ${product.discountEndDate || 'Not set'}`);

            // Check real-time status
            const now = new Date();
            let shouldBeActive = true;
            let reason = '';

            // Check start date
            if (product.discountStartDate && now < new Date(product.discountStartDate)) {
                shouldBeActive = false;
                reason = 'Discount not started yet';
            }
            // Check end date
            else if (product.discountEndDate && now > new Date(product.discountEndDate)) {
                shouldBeActive = false;
                reason = 'Discount expired';
            }

            console.log(`   Should be active: ${shouldBeActive}${reason ? ` (${reason})` : ''}`);

            // Check if there's a mismatch
            if (product.isDiscountActive !== shouldBeActive) {
                issuesFound++;
                console.log(`   ⚠️ MISMATCH FOUND! Updating isDiscountActive from ${product.isDiscountActive} to ${shouldBeActive}`);
                
                // Update the product
                product.isDiscountActive = shouldBeActive;
                await product.save();
                updatedCount++;
                
                console.log(`   ✅ Updated successfully`);
            } else {
                console.log(`   ✅ Status is correct`);
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total products with discounts: ${products.length}`);
        console.log(`   Issues found: ${issuesFound}`);
        console.log(`   Products updated: ${updatedCount}`);

        if (updatedCount > 0) {
            console.log(`\n🎉 Discount system has been fixed!`);
        } else {
            console.log(`\n✅ No issues found - discount system is working correctly!`);
        }

    } catch (error) {
        console.error('❌ Error fixing discount system:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the fix
fixDiscountSystem().catch(console.error);
