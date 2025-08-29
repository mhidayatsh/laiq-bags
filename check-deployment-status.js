const axios = require('axios');

async function checkDeploymentStatus() {
  console.log('🔍 Checking Deployment Status...\n');
  
  const baseUrl = 'https://www.laiq.shop';
  const testCases = [
    {
      name: '404 Page',
      url: `${baseUrl}/404.html`,
      expectedStatus: 200,
      description: 'New 404 error page'
    },
    {
      name: 'Product Page (Generic)',
      url: `${baseUrl}/product.html`,
      expectedStatus: 200,
      description: 'Product page without parameters'
    },
    {
      name: 'Product Page (With Slug)',
      url: `${baseUrl}/product.html?slug=laiq-crest-explorer-backpack`,
      expectedStatus: [200, 404],
      description: 'Product page with slug (should return 200 or 404, not 500)'
    },
    {
      name: 'Non-existent Product',
      url: `${baseUrl}/product.html?slug=non-existent-product`,
      expectedStatus: 404,
      description: 'Should return 404, not 500'
    },
    {
      name: 'Robots.txt',
      url: `${baseUrl}/robots.txt`,
      expectedStatus: 200,
      description: 'Robots.txt should be accessible'
    },
    {
      name: 'Sitemap',
      url: `${baseUrl}/sitemap.xml`,
      expectedStatus: 200,
      description: 'Sitemap should be accessible'
    }
  ];

  let allTestsPassed = true;
  let deploymentComplete = true;

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`   Description: ${testCase.description}`);
      console.log(`   URL: ${testCase.url}`);
      
      const response = await axios.get(testCase.url, {
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status code
      });
      
      const status = response.status;
      const expectedStatuses = Array.isArray(testCase.expectedStatus) 
        ? testCase.expectedStatus 
        : [testCase.expectedStatus];
      
      const isSuccess = expectedStatuses.includes(status);
      
      console.log(`   Status: ${status} ${isSuccess ? '✅' : '❌'}`);
      
      if (status === 200) {
        const contentType = response.headers['content-type'];
        console.log(`   Content-Type: ${contentType}`);
        
        if (testCase.name === '404 Page') {
          const has404Content = response.data.includes('404') || response.data.includes('Page Not Found');
          console.log(`   Has 404 Content: ${has404Content ? '✅' : '❌'}`);
        }
      }
      
      if (!isSuccess) {
        allTestsPassed = false;
        if (status === 500) {
          deploymentComplete = false;
        }
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   Error: ${error.message} ❌\n`);
      allTestsPassed = false;
      deploymentComplete = false;
    }
  }
  
  console.log('📊 Deployment Status Summary:');
  console.log('================================');
  
  if (deploymentComplete) {
    console.log('✅ Deployment appears to be complete!');
  } else {
    console.log('⏳ Deployment is still in progress...');
  }
  
  if (allTestsPassed) {
    console.log('🎉 All SEO fixes are working correctly!');
    console.log('');
    console.log('📈 Expected Google Search Console Improvements:');
    console.log('- ✅ Product pages will return proper 404 instead of 500 errors');
    console.log('- ✅ "Blocked by robots.txt" errors should decrease');
    console.log('- ✅ Product pages will become indexable');
    console.log('- ✅ Canonical URL conflicts resolved');
    console.log('');
    console.log('🔗 Next Steps:');
    console.log('1. Check Google Search Console in 24-48 hours');
    console.log('2. Request re-indexing of product pages');
    console.log('3. Monitor "Blocked by robots.txt" errors');
  } else {
    console.log('⚠️ Some issues detected. Deployment may still be in progress.');
    console.log('');
    console.log('🔄 Please wait a few minutes and run this check again.');
  }
}

// Run the check
checkDeploymentStatus().catch(console.error);
