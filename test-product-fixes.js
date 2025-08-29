const axios = require('axios');

async function testProductPages() {
  console.log('🧪 Testing Product Page Fixes...\n');
  
  const baseUrl = 'https://www.laiq.shop';
  const testCases = [
    {
      name: 'Product with slug',
      url: `${baseUrl}/product.html?slug=laiq-crest-explorer-backpack`,
      expectedStatus: 200
    },
    {
      name: 'Product without parameters',
      url: `${baseUrl}/product.html`,
      expectedStatus: 200
    },
    {
      name: 'Non-existent product',
      url: `${baseUrl}/product.html?slug=non-existent-product`,
      expectedStatus: 404
    },
    {
      name: 'Invalid product ID',
      url: `${baseUrl}/product.html?id=invalid-id`,
      expectedStatus: 404
    },
    {
      name: '404 page',
      url: `${baseUrl}/404.html`,
      expectedStatus: 200
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`   URL: ${testCase.url}`);
      
      const response = await axios.get(testCase.url, {
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status code
      });
      
      const status = response.status;
      const isSuccess = status === testCase.expectedStatus;
      
      console.log(`   Status: ${status} ${isSuccess ? '✅' : '❌'}`);
      
      if (status === 200) {
        const contentType = response.headers['content-type'];
        const hasHtml = contentType && contentType.includes('text/html');
        console.log(`   Content-Type: ${contentType} ${hasHtml ? '✅' : '❌'}`);
        
        if (hasHtml) {
          const hasTitle = response.data.includes('<title>');
          const hasCanonical = response.data.includes('rel="canonical"');
          console.log(`   Has Title: ${hasTitle ? '✅' : '❌'}`);
          console.log(`   Has Canonical: ${hasCanonical ? '✅' : '❌'}`);
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   Error: ${error.message} ❌\n`);
    }
  }
  
  console.log('✅ Product page testing completed!');
}

// Run the test
testProductPages().catch(console.error);
