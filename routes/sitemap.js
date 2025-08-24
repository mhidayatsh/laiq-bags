const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Dynamic sitemap generation
router.get('/sitemap.xml', async (req, res) => {
    try {
        // Set XML content type
        res.set('Content-Type', 'text/xml');
        
        // Get all products from database
        const products = await Product.find({ isActive: true }).select('slug updatedAt');
        
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

        // Add product pages dynamically
        products.forEach(product => {
            const lastmod = product.updatedAt ? 
                new Date(product.updatedAt).toISOString().split('T')[0] : 
                currentDate;
            
            sitemap += `
  <url>
    <loc>https://www.laiq.shop/product.html?slug=${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        // Close XML
        sitemap += `
</urlset>`;

        res.send(sitemap);

    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

// Sitemap index for large sites (if needed in future)
router.get('/sitemap-index.xml', async (req, res) => {
    try {
        res.set('Content-Type', 'text/xml');
        
        const currentDate = new Date().toISOString().split('T')[0];
        
        const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.laiq.shop/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>
</sitemapindex>`;

        res.send(sitemapIndex);

    } catch (error) {
        console.error('Error generating sitemap index:', error);
        res.status(500).send('Error generating sitemap index');
    }
});

module.exports = router;
