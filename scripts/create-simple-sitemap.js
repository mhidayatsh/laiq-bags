const fs = require('fs');
const path = require('path');

function createSimpleSitemap() {
    try {
        console.log('🔗 Creating simple sitemap...');
        
        // Get current date
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Create very simple sitemap
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.laiq.shop/</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>https://www.laiq.shop/shop.html</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>https://www.laiq.shop/about.html</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>https://www.laiq.shop/contact.html</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>https://www.laiq.shop/size-guide.html</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>https://www.laiq.shop/customer-login.html</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
  <url>
    <loc>https://www.laiq.shop/customer-register.html</loc>
    <lastmod>${currentDate}</lastmod>
  </url>
</urlset>`;

        // Write to file
        const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemap);
        
        console.log(`✅ Simple sitemap generated successfully!`);
        console.log(`📁 Location: ${sitemapPath}`);
        console.log(`📊 Total URLs: 7`);
        
    } catch (error) {
        console.error('❌ Error generating simple sitemap:', error);
    }
}

// Run if called directly
if (require.main === module) {
    createSimpleSitemap();
}

module.exports = createSimpleSitemap;
