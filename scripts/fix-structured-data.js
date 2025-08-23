#!/usr/bin/env node

/**
 * Fix Structured Data Issues
 * 
 * This script fixes Google Search Console structured data validation errors:
 * - Adds missing 'image' fields for products
 * - Adds missing 'shippingDetails' fields (optional)
 * - Adds missing 'hasMerchantReturnPolicy' fields (optional)
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Structured Data Issues...\n');

// Product images mapping
const productImages = {
  'Backpacks': 'https://laiq.shop/assets/placeholder-bag-1.jpg',
  'Sling Bags': 'https://laiq.shop/assets/placeholder-bag-2.jpg',
  'Handbags': 'https://laiq.shop/assets/placeholder-bag-3.jpg',
  'Laptop Bags': 'https://laiq.shop/assets/placeholder-bag-4.jpg',
  'Tote Bags': 'https://laiq.shop/assets/placeholder-bag-5.jpg',
  'Travel Bags': 'https://laiq.shop/assets/placeholder-bag-6.jpg'
};

// Shipping and return policy template
const shippingAndReturnPolicy = {
  "shippingDetails": {
    "@type": "OfferShippingDetails",
    "shippingRate": {
      "@type": "MonetaryAmount",
      "value": "0",
      "currency": "INR"
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": {
        "@type": "QuantitativeValue",
        "minValue": 1,
        "maxValue": 2,
        "unitCode": "DAY"
      },
      "transitTime": {
        "@type": "QuantitativeValue",
        "minValue": 3,
        "maxValue": 7,
        "unitCode": "DAY"
      }
    }
  },
  "hasMerchantReturnPolicy": {
    "@type": "MerchantReturnPolicy",
    "applicableCountry": "IN",
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
    "merchantReturnDays": 30,
    "returnMethod": "https://schema.org/ReturnByMail",
    "returnFees": "https://schema.org/FreeReturn"
  }
};

function fixIndexHtml() {
  console.log('📄 Fixing index.html structured data...');
  
  const indexPath = path.join(__dirname, '..', 'index.html');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Find and fix each product in the OfferCatalog
  const productNames = Object.keys(productImages);
  
  productNames.forEach(productName => {
    const imageUrl = productImages[productName];
    
    // Pattern to match product offers without image field
    const productPattern = new RegExp(
      `("name": "${productName}",\\s*"description": "[^"]*")(\\s*,"offers":\\s*{)`,
      'g'
    );
    
    // Pattern to match offers without shipping/return policy
    const offerPattern = new RegExp(
      `("availability": "https://schema\\.org/InStock")(\\s*}\\s*}\\s*})`,
      'g'
    );
    
    // Add image field
    content = content.replace(productPattern, 
      `$1,\n                "image": "${imageUrl}"$2`
    );
    
    // Add shipping and return policy
    content = content.replace(offerPattern,
      `$1,\n                  ${JSON.stringify(shippingAndReturnPolicy.shippingDetails, null, 20).replace(/\n/g, '\n                  ')},\n                  ${JSON.stringify(shippingAndReturnPolicy.hasMerchantReturnPolicy, null, 20).replace(/\n/g, '\n                  ')}$2`
    );
  });
  
  fs.writeFileSync(indexPath, content);
  console.log('✅ Fixed index.html structured data');
}

function fixProductJs() {
  console.log('📄 Fixing product.js structured data...');
  
  const productJsPath = path.join(__dirname, '..', 'js', 'product.js');
  let content = fs.readFileSync(productJsPath, 'utf8');
  
  // Check if hasMerchantReturnPolicy is already added
  if (!content.includes('hasMerchantReturnPolicy')) {
    // Add hasMerchantReturnPolicy after shippingDetails
    const shippingPattern = /("transitTime":\s*{\s*"@type":\s*"QuantitativeValue",\s*"value":\s*"2",\s*"unitCode":\s*"DAY"\s*}\s*}\s*}\s*})/;
    
    const returnPolicy = `,
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "IN",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 30,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
            }`;
    
    content = content.replace(shippingPattern, `$1${returnPolicy}`);
    fs.writeFileSync(productJsPath, content);
    console.log('✅ Added hasMerchantReturnPolicy to product.js');
  } else {
    console.log('✅ product.js already has hasMerchantReturnPolicy');
  }
}

function createStructuredDataTest() {
  console.log('🧪 Creating structured data test...');
  
  const testData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Test Product",
    "description": "Test product description",
    "image": "https://laiq.shop/assets/placeholder-bag-1.jpg",
    "offers": {
      "@type": "Offer",
      "price": "1499",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 7,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    }
  };
  
  const testPath = path.join(__dirname, 'structured-data-test.json');
  fs.writeFileSync(testPath, JSON.stringify(testData, null, 2));
  console.log('✅ Created structured data test file');
}

function validateStructuredData() {
  console.log('🔍 Validating structured data...');
  
  const files = ['index.html', 'shop.html', 'product.html'];
  let issues = 0;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for missing image fields in product schemas
      const productMatches = content.match(/"@type":\s*"Product"[^}]*"name":\s*"([^"]*)"/g);
      if (productMatches) {
        productMatches.forEach(match => {
          const nameMatch = match.match(/"name":\s*"([^"]*)"/);
          if (nameMatch) {
            const productName = nameMatch[1];
            if (!content.includes(`"name": "${productName}"`) || !content.includes(`"image":`)) {
              console.log(`⚠️  Missing image field for product: ${productName}`);
              issues++;
            }
          }
        });
      }
      
      // Check for missing shipping details
      if (content.includes('"@type": "Offer"') && !content.includes('"shippingDetails"')) {
        console.log(`⚠️  Missing shippingDetails in ${file}`);
        issues++;
      }
      
      // Check for missing return policy
      if (content.includes('"@type": "Offer"') && !content.includes('"hasMerchantReturnPolicy"')) {
        console.log(`⚠️  Missing hasMerchantReturnPolicy in ${file}`);
        issues++;
      }
    }
  });
  
  if (issues === 0) {
    console.log('✅ All structured data validation passed!');
  } else {
    console.log(`⚠️  Found ${issues} structured data issues`);
  }
}

// Run the fixes
try {
  fixIndexHtml();
  fixProductJs();
  createStructuredDataTest();
  validateStructuredData();
  
  console.log('\n🎉 Structured data fixes completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the website with Google Search Console');
  console.log('2. Use Google Rich Results Test to validate structured data');
  console.log('3. Monitor for any remaining validation errors');
  console.log('4. Update product images with actual product photos');
  
} catch (error) {
  console.error('❌ Error fixing structured data:', error.message);
  process.exit(1);
}
