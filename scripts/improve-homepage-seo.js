#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Improving Homepage SEO to compete with Shop page...\n');

const homepagePath = path.join(__dirname, '..', 'index.html');

if (fs.existsSync(homepagePath)) {
  let content = fs.readFileSync(homepagePath, 'utf8');
  let originalContent = content;
  
  // Improve meta description to be more competitive
  const newDescription = 'Laiq Bags - Premium bags and accessories for every occasion. Shop stylish backpacks, handbags, laptop bags, and travel accessories. Free shipping across India. Discover our collection today!';
  
  content = content.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${newDescription}">`
  );
  
  // Improve title to be more competitive
  const newTitle = 'Laiq Bags - Shop Premium Bags & Accessories | Free Shipping India';
  content = content.replace(
    /<title>[^<]*<\/title>/,
    `<title>${newTitle}</title>`
  );
  
  // Add more relevant keywords
  const newKeywords = 'laiq bags, shop bags, premium bags, backpacks, handbags, laptop bags, travel accessories, free shipping, India bags, stylish bags, fashion accessories';
  content = content.replace(
    /<meta name="keywords" content="[^"]*">/,
    `<meta name="keywords" content="${newKeywords}">`
  );
  
  // Add more structured data for better SEO
  const additionalStructuredData = `
    <!-- Product Collection Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Laiq Bags - Premium Collection",
      "description": "Premium bags and accessories for every occasion",
      "url": "https://www.laiq.shop/",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Premium Bags Collection",
        "description": "Stylish backpacks, handbags, laptop bags, and travel accessories"
      },
      "offers": {
        "@type": "Offer",
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
        }
      }
    }
    </script>
  `;
  
  // Insert the additional structured data before the closing head tag
  content = content.replace('</head>', `${additionalStructuredData}\n  </head>`);
  
  if (content !== originalContent) {
    fs.writeFileSync(homepagePath, content);
    console.log('✅ Homepage SEO improved:');
    console.log('   - Enhanced meta description');
    console.log('   - Improved title tag');
    console.log('   - Added more relevant keywords');
    console.log('   - Added Product Collection schema');
    console.log('   - Added shipping and availability info');
  } else {
    console.log('✅ Homepage already has good SEO');
  }
} else {
  console.log('❌ Homepage not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Deploy the updated homepage');
console.log('2. Submit sitemap to Google Search Console');
console.log('3. Request indexing of homepage');
console.log('4. Monitor search results over 1-2 weeks');

console.log('\n🎯 Expected Results:');
console.log('- Homepage will compete better with Shop page');
console.log('- More relevant search results');
console.log('- Better click-through rates');
console.log('- Improved overall SEO performance');
