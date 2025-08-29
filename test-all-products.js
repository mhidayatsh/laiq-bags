const axios = require('axios');

async function testAllProducts() {
  console.log('🧪 Testing All Products - Searchability and Direct Access\n');
  
  const baseUrl = 'https://www.laiq.shop';
  
  // All products from your sitemap
  const products = [
    { slug: 'classic-backpack', name: 'Classic Backpack', expectedPrice: '₹2499' },
    { slug: 'elegant-sling', name: 'Elegant Sling', expectedPrice: '₹1799' },
    { slug: 'urban-tote', name: 'Urban Tote', expectedPrice: '₹2199' },
    { slug: 'travel-duffel-bag', name: 'Travel Duffel Bag', expectedPrice: '₹1599' },
    { slug: 'professional-tote-bag', name: 'Professional Tote Bag', expectedPrice: '₹2799' },
    { slug: 'executive-briefcase', name: 'Executive Briefcase', expectedPrice: '₹3999' },
    { slug: 'laptop-messenger-bag', name: 'Laptop Messenger Bag', expectedPrice: '₹2299' },
    { slug: 'premium-leather-backpack', name: 'Premium Leather Backpack', expectedPrice: '₹3499' },
    { slug: 'compact-waist-bag', name: 'Compact Waist Bag', expectedPrice: '₹899' },
    { slug: 'weekend-travel-bag', name: 'Weekend Travel Bag', expectedPrice: '₹1899' }
  ];

  let allTestsPassed = true;
  let successfulProducts = 0;

  console.log(`📦 Testing ${products.length} products...\n`);

  for (const product of products) {
    try {
      console.log(`🔍 Testing: ${product.name}`);
      console.log(`   URL: ${baseUrl}/product.html?slug=${product.slug}`);
      
      const response = await axios.get(`${baseUrl}/product.html?slug=${product.slug}`, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      const status = response.status;
      const hasCorrectTitle = response.data.includes(product.name);
      const hasCorrectPrice = response.data.includes(product.expectedPrice);
      const hasCanonical = response.data.includes(`canonical" href="${baseUrl}/product.html?slug=${product.slug}"`);
      const hasStructuredData = response.data.includes('"@type":"Product"');
      
      const isSuccess = status === 200 && hasCorrectTitle && hasCorrectPrice && hasCanonical && hasStructuredData;
      
      console.log(`   Status: ${status} ${status === 200 ? '✅' : '❌'}`);
      console.log(`   Title: ${hasCorrectTitle ? '✅' : '❌'} (${product.name})`);
      console.log(`   Price: ${hasCorrectPrice ? '✅' : '❌'} (${product.expectedPrice})`);
      console.log(`   Canonical: ${hasCanonical ? '✅' : '❌'}`);
      console.log(`   Structured Data: ${hasStructuredData ? '✅' : '❌'}`);
      
      if (isSuccess) {
        console.log(`   Overall: ✅ PASSED`);
        successfulProducts++;
      } else {
        console.log(`   Overall: ❌ FAILED`);
        allTestsPassed = false;
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   Error: ${error.message} ❌\n`);
      allTestsPassed = false;
    }
  }
  
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Successful Products: ${successfulProducts}/${products.length}`);
  console.log(`📈 Success Rate: ${Math.round((successfulProducts/products.length) * 100)}%`);
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL PRODUCTS ARE WORKING PERFECTLY!');
    console.log('\n✅ SEO Benefits:');
    console.log('- All products are searchable and indexable');
    console.log('- Direct links work correctly');
    console.log('- Proper canonical URLs for each product');
    console.log('- Rich structured data for search results');
    console.log('- Google can properly index all products');
    
    console.log('\n✅ User Experience Benefits:');
    console.log('- Users can click and reach correct product pages');
    console.log('- Product details load properly');
    console.log('- Professional product pages');
    console.log('- Better conversion potential');
    
    console.log('\n🚀 Expected Results:');
    console.log('- Products will appear in Google search results');
    console.log('- Direct links will work from search results');
    console.log('- Rich snippets with prices and product info');
    console.log('- Increased organic traffic to product pages');
    
  } else {
    console.log('\n⚠️ Some products have issues that need attention.');
    console.log('\n🔧 Next Steps:');
    console.log('- Check the failed products above');
    console.log('- Verify product data in database');
    console.log('- Test individual product URLs');
  }
  
  console.log('\n🔗 Search Console Actions:');
  console.log('1. Go to Google Search Console');
  console.log('2. Use "URL Inspection" tool');
  console.log('3. Test each product URL');
  console.log('4. Request indexing for all products');
  console.log('5. Monitor "Coverage" report for improvements');
}

// Run the test
testAllProducts().catch(console.error);
