
const mongoose = require('mongoose');
require('dotenv').config();

async function testDynamicSitemap() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        const Product = require('./models/Product');
        const products = await Product.find({}).select('slug updatedAt');
        
        console.log('📦 Products found:', products.length);
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.slug}`);
        });
        
        console.log('\n🎯 Expected sitemap URLs:');
        console.log('- 7 static pages');
        console.log(`- ${products.length} product pages`);
        console.log(`- Total: ${7 + products.length} URLs`);
        
        await mongoose.disconnect();
        console.log('✅ Test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testDynamicSitemap();
