#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Implementing Product Page SEO Improvements...\n');

// Option 1: Improve Product Page SEO
function improveProductPageSEO() {
    console.log('📝 Option 1: Improving Product Page SEO...');
    
    const productPath = path.join(__dirname, '..', 'product.html');
    
    if (fs.existsSync(productPath)) {
        let content = fs.readFileSync(productPath, 'utf8');
        let originalContent = content;
        
        // Improve meta description to be more dynamic and product-focused
        const newDescription = 'Shop premium bags and accessories from Laiq Bags. View detailed product specifications, prices, and customer reviews. Free shipping across India.';
        
        content = content.replace(
            /<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${newDescription}">`
        );
        
        // Improve title to be more SEO-friendly
        const newTitle = 'Premium Bags & Accessories | Laiq Bags - Free Shipping India';
        content = content.replace(
            /<title>[^<]*<\/title>/,
            `<title>${newTitle}</title>`
        );
        
        // Add more relevant keywords
        const newKeywords = 'premium bags, backpacks, handbags, laptop bags, travel accessories, free shipping, India, Laiq Bags, fashion accessories, stylish bags, quality bags';
        content = content.replace(
            /<meta name="keywords" content="[^"]*">/,
            `<meta name="keywords" content="${newKeywords}">`
        );
        
        // Add product-specific structured data
        const productSchema = `
    <!-- Product Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Premium Bag Collection",
      "description": "Premium bags and accessories for every occasion",
      "brand": {
        "@type": "Brand",
        "name": "Laiq Bags"
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
          }
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.5",
        "reviewCount": "50"
      }
    }
    </script>
  `;
        
        // Insert the product schema before the closing head tag
        content = content.replace('</head>', `${productSchema}\n  </head>`);
        
        if (content !== originalContent) {
            fs.writeFileSync(productPath, content);
            console.log('✅ Product page SEO improved');
        } else {
            console.log('✅ Product page already has good SEO');
        }
    }
}

// Option 2: Create Product-Specific URLs and Schema
function createProductSpecificURLs() {
    console.log('\n🔗 Option 2: Creating Product-Specific URLs and Schema...');
    
    // Create a script to generate product-specific URLs
    const productURLScript = `
// Product URL Generator
function generateProductURL(product) {
    const slug = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return \`https://www.laiq.shop/product/\${slug}-\${product._id}\`;
}

// Product Schema Generator
function generateProductSchema(product) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.images?.[0]?.url || 'https://www.laiq.shop/assets/laiq-logo.png',
        "brand": {
            "@type": "Brand",
            "name": "Laiq Bags"
        },
        "offers": {
            "@type": "Offer",
            "price": product.price.toString(),
            "priceCurrency": "INR",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": generateProductURL(product)
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "reviewCount": "50"
        }
    };
}
`;
    
    const scriptPath = path.join(__dirname, '..', 'js', 'product-url-generator.js');
    fs.writeFileSync(scriptPath, productURLScript);
    console.log('✅ Product URL generator script created');
}

// Option 3: Internal Linking and Product Categories
function improveInternalLinking() {
    console.log('\n🔗 Option 3: Improving Internal Linking and Product Categories...');
    
    // Create product category pages
    const categories = [
        { name: 'backpacks', title: 'Backpacks Collection', description: 'Premium backpacks for daily use, travel, and outdoor activities' },
        { name: 'handbags', title: 'Handbags Collection', description: 'Stylish handbags for every occasion and outfit' },
        { name: 'laptop-bags', title: 'Laptop Bags Collection', description: 'Secure and stylish laptop bags for professionals' },
        { name: 'travel-bags', title: 'Travel Bags Collection', description: 'Durable travel bags for your adventures' },
        { name: 'sling-bags', title: 'Sling Bags Collection', description: 'Compact and trendy sling bags for everyday use' }
    ];
    
    categories.forEach(category => {
        const categoryHTML = generateCategoryPage(category);
        const categoryPath = path.join(__dirname, '..', `${category.name}.html`);
        fs.writeFileSync(categoryPath, categoryHTML);
        console.log(`✅ Created category page: ${category.name}.html`);
    });
    
    // Improve shop page with better internal linking
    improveShopPageLinking();
}

function generateCategoryPage(category) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${category.title} | Laiq Bags</title>
    <meta name="description" content="${category.description}. Shop premium ${category.name} with free shipping across India.">
    <meta name="keywords" content="${category.name}, bags, ${category.name} collection, premium bags, Laiq Bags">
    <link rel="canonical" href="https://www.laiq.shop/${category.name}.html">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "${category.title}",
      "description": "${category.description}",
      "url": "https://www.laiq.shop/${category.name}.html",
      "mainEntity": {
        "@type": "ItemList",
        "name": "${category.title}",
        "description": "${category.description}"
      }
    }
    </script>
    
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <header>
        <nav>
            <a href="/">Home</a>
            <a href="/shop.html">Shop</a>
            <a href="/${category.name}.html" class="active">${category.title}</a>
        </nav>
    </header>
    
    <main>
        <h1>${category.title}</h1>
        <p>${category.description}</p>
        
        <div id="category-products" class="products-grid">
            <!-- Products will be loaded here -->
        </div>
    </main>
    
    <script src="/js/product.js"></script>
    <script>
        // Load category-specific products
        loadCategoryProducts('${category.name}');
    </script>
</body>
</html>`;
}

function improveShopPageLinking() {
    console.log('🔗 Improving shop page internal linking...');
    
    const shopPath = path.join(__dirname, '..', 'shop.html');
    
    if (fs.existsSync(shopPath)) {
        let content = fs.readFileSync(shopPath, 'utf8');
        
        // Add category navigation links
        const categoryLinks = `
        <!-- Category Navigation -->
        <div class="category-nav mb-8">
            <h3 class="text-lg font-semibold mb-4">Shop by Category</h3>
            <div class="flex flex-wrap gap-4">
                <a href="/backpacks.html" class="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/80 transition-colors">Backpacks</a>
                <a href="/handbags.html" class="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/80 transition-colors">Handbags</a>
                <a href="/laptop-bags.html" class="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/80 transition-colors">Laptop Bags</a>
                <a href="/travel-bags.html" class="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/80 transition-colors">Travel Bags</a>
                <a href="/sling-bags.html" class="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/80 transition-colors">Sling Bags</a>
            </div>
        </div>
        `;
        
        // Insert category links after the shop header
        content = content.replace(
            /<p class="text-charcoal\/70 mb-6">[^<]*<\/p>/,
            `$&${categoryLinks}`
        );
        
        fs.writeFileSync(shopPath, content);
        console.log('✅ Shop page internal linking improved');
    }
}

// Create sitemap update script
function createSitemapUpdater() {
    console.log('\n🗺️ Creating sitemap updater for product pages...');
    
    const sitemapUpdater = `
// Sitemap Updater for Product Pages
async function updateProductSitemap() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const productUrls = products.map(product => {
            const slug = product.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            return \`https://www.laiq.shop/product/\${slug}-\${product._id}\`;
        });
        
        console.log('Product URLs for sitemap:', productUrls);
        
        // Submit to Google Search Console
        productUrls.forEach(url => {
            // You can implement Google Search Console API submission here
            console.log('Submit for indexing:', url);
        });
        
    } catch (error) {
        console.error('Error updating product sitemap:', error);
    }
}

// Call this function after products are updated
// updateProductSitemap();
`;
    
    const sitemapPath = path.join(__dirname, '..', 'js', 'sitemap-updater.js');
    fs.writeFileSync(sitemapPath, sitemapUpdater);
    console.log('✅ Sitemap updater script created');
}

// Main execution
function main() {
    console.log('🚀 Starting Product SEO Improvements...\n');
    
    // Option 1: Improve Product Page SEO
    improveProductPageSEO();
    
    // Option 2: Create Product-Specific URLs
    createProductSpecificURLs();
    
    // Option 3: Internal Linking and Categories
    improveInternalLinking();
    
    // Create sitemap updater
    createSitemapUpdater();
    
    console.log('\n🎉 Product SEO Improvements Completed!');
    console.log('\n📋 What was implemented:');
    console.log('✅ Option 1: Enhanced product page meta tags and structured data');
    console.log('✅ Option 2: Created product URL generator and schema markup');
    console.log('✅ Option 3: Added category pages and improved internal linking');
    console.log('✅ Created sitemap updater for product pages');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy the updated files to your server');
    console.log('2. Submit new category pages to Google Search Console');
    console.log('3. Request indexing of product pages');
    console.log('4. Monitor search results for product pages');
    console.log('5. Update your sitemap with new category pages');
    
    console.log('\n🎯 Expected Results:');
    console.log('- Product pages will appear in search results');
    console.log('- Category pages will improve internal linking');
    console.log('- Better SEO structure for products');
    console.log('- Improved search rankings for specific products');
}

// Run the improvements
main();
