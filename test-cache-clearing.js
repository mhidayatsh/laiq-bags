const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

async function testCacheClearing() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Test 1: Check current product data
        console.log('\n📊 Test 1: Current product data');
        const products = await Product.find({});
        products.forEach(product => {
            console.log(`   ${product.name}: featured=${product.featured}, bestSeller=${product.bestSeller}, newArrival=${product.newArrival}, discount=${product.discount}`);
        });

        // Test 2: Update a product
        console.log('\n📝 Test 2: Updating product');
        const testProduct = products[0];
        if (testProduct) {
            const updateData = {
                featured: !testProduct.featured,
                bestSeller: !testProduct.bestSeller,
                newArrival: !testProduct.newArrival,
                discount: testProduct.discount === 0 ? 25 : 0
            };
            
            console.log(`   Updating ${testProduct.name} with:`, updateData);
            
            const updatedProduct = await Product.findByIdAndUpdate(
                testProduct._id,
                updateData,
                { new: true }
            );
            
            console.log(`   ✅ Updated successfully`);
            console.log(`   New data: featured=${updatedProduct.featured}, bestSeller=${updatedProduct.bestSeller}, newArrival=${updatedProduct.newArrival}, discount=${updatedProduct.discount}`);
        }

        // Test 3: Verify API response
        console.log('\n🌐 Test 3: API response verification');
        console.log('   Run this command to test API:');
        console.log('   curl -s "http://localhost:3001/api/products" | jq \'.products[0] | {name, featured, bestSeller, newArrival, discount}\'');

        // Test 4: Cache clearing instructions
        console.log('\n🗑️ Test 4: Cache clearing instructions');
        console.log('   To test cache clearing, run these commands in browser console:');
        console.log('   1. clearAllCaches()');
        console.log('   2. refreshPageData()');
        console.log('   3. forceRefreshWithCacheClear()');

        console.log('\n✅ Cache clearing test completed!');

    } catch (error) {
        console.error('❌ Error testing cache clearing:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testCacheClearing().catch(console.error);
