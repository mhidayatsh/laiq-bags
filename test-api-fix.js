const axios = require('axios');

async function testApiFix() {
  console.log('🧪 Testing API Slug Fix\n');
  
  const baseUrl = 'https://www.laiq.shop';
  
  // Test products with their slugs
  const testProducts = [
    { slug: 'classic-backpack', expectedName: 'Classic Backpack' },
    { slug: 'elegant-sling', expectedName: 'Elegant Sling' },
    { slug: 'urban-tote', expectedName: 'Urban Tote' }
  ];
  
  for (const product of testProducts) {
    console.log(`🔍 Testing: ${product.expectedName}`);
    console.log(`   Slug: ${product.slug}`);
    
    try {
      const response = await axios.get(`${baseUrl}/api/products?slug=${product.slug}`);
      
      if (response.data.success && response.data.product) {
        const productData = response.data.product;
        console.log(`   ✅ API Response: ${productData.name}`);
        console.log(`   ✅ Price: ₹${productData.price}`);
        console.log(`   ✅ Status: SUCCESS\n`);
      } else {
        console.log(`   ❌ API Response: No product found\n`);
      }
    } catch (error) {
      console.log(`   ❌ API Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 API Slug Fix Test Complete!');
}

testApiFix().catch(console.error);
