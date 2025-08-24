const fs = require('fs');
const path = require('path');

function createFallbackSitemap() {
    try {
        console.log('🔗 Creating fallback sitemap...');
        
        // Get current date
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Start XML sitemap
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        const staticPages = [
            { url: '/', priority: '1.0', changefreq: 'daily' },
            { url: '/shop.html', priority: '0.9', changefreq: 'daily' },
            { url: '/about.html', priority: '0.7', changefreq: 'monthly' },
            { url: '/contact.html', priority: '0.7', changefreq: 'monthly' },
            { url: '/size-guide.html', priority: '0.6', changefreq: 'monthly' },
            { url: '/customer-login.html', priority: '0.5', changefreq: 'monthly' },
            { url: '/customer-register.html', priority: '0.5', changefreq: 'monthly' }
        ];

        // Add static pages to sitemap
        staticPages.forEach(page => {
            sitemap += `
  <url>
    <loc>https://www.laiq.shop${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Close XML
        sitemap += `
</urlset>`;

        // Write to file
        const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemap);
        
        console.log(`✅ Fallback sitemap generated successfully!`);
        console.log(`📁 Location: ${sitemapPath}`);
        console.log(`📊 Total URLs: ${staticPages.length}`);
        
    } catch (error) {
        console.error('❌ Error generating fallback sitemap:', error);
    }
}

// Run if called directly
if (require.main === module) {
    createFallbackSitemap();
}

module.exports = createFallbackSitemap;
