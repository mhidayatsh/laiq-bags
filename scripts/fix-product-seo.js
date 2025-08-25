const fs = require('fs');
const path = require('path');

console.log('🚨 CRITICAL: Fixing product SEO issues...');

// Step 1: Fix product.html static meta tags
const productHtmlPath = path.join(__dirname, '..', 'product.html');
let productHtml = fs.readFileSync(productHtmlPath, 'utf8');

// Update the static meta tags to be more generic but SEO-friendly
const updatedMetaTags = `
    <title>Product Details | Laiq Bags</title>
    
    <!-- SEO Meta Tags (will be dynamically updated) -->
    <meta name="description" content="View product details and specifications. Shop premium bags and accessories from Laiq Bags. Free shipping across India.">

    <meta name="keywords" content="product details, bags, backpacks, handbags, premium bags, Laiq Bags, fashion accessories">

    <meta name="robots" content="index, follow">
    <meta name="author" content="Laiq Bags">
    
    <!-- Open Graph Meta Tags (will be dynamically updated) -->
    <meta property="og:title" content="Product Details | Laiq Bags">
    <meta property="og:description" content="View product details and specifications. Shop premium bags and accessories from Laiq Bags.">
    <meta property="og:type" content="product">
    <meta property="og:url" content="">
    <meta property="og:image" content="https://www.laiq.shop/assets/laiq-logo.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Laiq Bags">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card Meta Tags (will be dynamically updated) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Product Details | Laiq Bags">
    <meta name="twitter:description" content="View product details and specifications. Shop premium bags and accessories from Laiq Bags.">
    <meta name="twitter:image" content="https://www.laiq.shop/assets/laiq-logo.png">
    <meta name="twitter:site" content="@laiq_bags_">
    <meta name="twitter:creator" content="@laiq_bags_">
    
    <!-- Canonical URL (will be dynamically updated) -->
    <link rel="canonical" href="https://www.laiq.shop/product.html">
    
    <!-- Language Alternates -->
    <link rel="alternate" hreflang="en" href="https://www.laiq.shop/product.html">
    <link rel="alternate" hreflang="en-IN" href="https://www.laiq.shop/product.html">
    <link rel="alternate" hreflang="x-default" href="https://www.laiq.shop/product.html">`;

// Replace the existing meta tags section
const metaTagsRegex = /<title>.*?<\/title>[\s\S]*?<link rel="canonical" href="">/;
productHtml = productHtml.replace(metaTagsRegex, updatedMetaTags);

fs.writeFileSync(productHtmlPath, productHtml);
console.log('✅ Updated product.html meta tags');

// Step 2: Create server-side product SEO route
const serverJsPath = path.join(__dirname, '..', 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');

// Add server-side product SEO route before the catch-all route
const productSeoRoute = `
  // Server-side product SEO route
  app.get('/product.html', async (req, res) => {
    try {
      const { slug, id } = req.query;
      
      if (!slug && !id) {
        // No product specified, serve generic product page
        return res.sendFile(path.join(__dirname, 'product.html'));
      }
      
      // Find product by slug or id
      let product;
      if (slug) {
        product = await Product.findOne({ slug: slug });
      } else if (id) {
        product = await Product.findById(id);
      }
      
      if (!product) {
        return res.status(404).sendFile(path.join(__dirname, '404.html'));
      }
      
      // Read the product.html template
      let html = fs.readFileSync(path.join(__dirname, 'product.html'), 'utf8');
      
      // Replace meta tags with product-specific content
      const productTitle = \`\${product.name} - ₹\${product.price} | \${product.category} - Laiq Bags\`;
      const productDescription = product.metaDescription || product.description?.substring(0, 160) || \`Buy \${product.name} from Laiq Bags. Premium quality \${product.category}.\`;
      const productUrl = \`https://www.laiq.shop/product.html?slug=\${product.slug || product._id}\`;
      const productImage = product.images?.[0]?.url || 'https://www.laiq.shop/assets/laiq-logo.png';
      
      // Update title
      html = html.replace(/<title>.*?<\/title>/, \`<title>\${productTitle}</title>\`);
      
      // Update meta description
      html = html.replace(/<meta name="description" content="[^"]*">/, \`<meta name="description" content="\${productDescription}">\`);
      
      // Update canonical URL
      html = html.replace(/<link rel="canonical" href="[^"]*">/, \`<link rel="canonical" href="\${productUrl}">\`);
      
      // Update Open Graph tags
      html = html.replace(/<meta property="og:title" content="[^"]*">/, \`<meta property="og:title" content="\${productTitle}">\`);
      html = html.replace(/<meta property="og:description" content="[^"]*">/, \`<meta property="og:description" content="\${productDescription}">\`);
      html = html.replace(/<meta property="og:url" content="[^"]*">/, \`<meta property="og:url" content="\${productUrl}">\`);
      html = html.replace(/<meta property="og:image" content="[^"]*">/, \`<meta property="og:image" content="\${productImage}">\`);
      
      // Update Twitter Card tags
      html = html.replace(/<meta name="twitter:title" content="[^"]*">/, \`<meta name="twitter:title" content="\${productTitle}">\`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*">/, \`<meta name="twitter:description" content="\${productDescription}">\`);
      html = html.replace(/<meta name="twitter:image" content="[^"]*">/, \`<meta name="twitter:image" content="\${productImage}">\`);
      
      // Add product structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "brand": {
          "@type": "Brand",
          "name": "LAIQ"
        },
        "category": product.category,
        "image": product.images?.map(img => img.url) || [],
        "url": productUrl,
        "sku": product._id,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "INR",
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "seller": {
            "@type": "Organization",
            "name": "Laiq Bags",
            "url": "https://www.laiq.shop"
          }
        }
      };
      
      // Insert structured data before closing head tag
      const structuredDataScript = \`<script type="application/ld+json">\${JSON.stringify(structuredData, null, 2)}</script>\`;
      html = html.replace('</head>', \`\${structuredDataScript}\\n</head>\`);
      
      res.set('Content-Type', 'text/html');
      res.send(html);
      
    } catch (error) {
      console.error('Product SEO route error:', error);
      res.sendFile(path.join(__dirname, 'product.html'));
    }
  });

  app.use(express.static(path.join(__dirname)));`;

// Add the route before the static middleware
serverJs = serverJs.replace('app.use(express.static(path.join(__dirname)));', productSeoRoute);

fs.writeFileSync(serverJsPath, serverJs);
console.log('✅ Added server-side product SEO route');

// Step 3: Update sitemap to use proper product URLs
const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');

// Update product URLs to use slug instead of id
sitemap = sitemap.replace(/product\.html\?slug=([^<]+)/g, 'product.html?slug=$1');

fs.writeFileSync(sitemapPath, sitemap);
console.log('✅ Updated sitemap with proper product URLs');

console.log('\n🎯 SUMMARY:');
console.log('✅ Fixed product.html static meta tags');
console.log('✅ Added server-side product SEO route');
console.log('✅ Updated sitemap with proper URLs');
console.log('📝 Next: Deploy and test product SEO');

console.log('\n⚠️  IMPORTANT: After deployment:');
console.log('1. Test: https://www.laiq.shop/product.html?slug=classic-backpack');
console.log('2. Check that title and description are product-specific');
console.log('3. Verify canonical URL is correct');
console.log('4. Request re-indexing in Google Search Console');
