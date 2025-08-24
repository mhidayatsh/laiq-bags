const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
try {
    require('dotenv').config({ 
        path: process.env.NODE_ENV === 'production' ? './config.env.production' : './config.env' 
    });
} catch (error) {
    console.log('⚠️ Could not load .env file, using environment variables');
}

// Import Product model
const Product = require('../models/Product');

async function generateSitemap() {
    try {
        console.log('🔗 Generating dynamic sitemap...');
        
        // Connect to database
        let products = [];
        if (!process.env.MONGODB_URI) {
            console.log('⚠️ MONGODB_URI not found, generating sitemap with static pages only');
        } else {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to database');
            
            // Get all products (no isActive field in schema)
            products = await Product.find({}).select('slug updatedAt name');
            console.log(`✅ Found ${products.length} products`);
        }
        
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

        // Write to file
        const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemap);
        
        console.log(`✅ Sitemap generated successfully!`);
        console.log(`📁 Location: ${sitemapPath}`);
        console.log(`📊 Total URLs: ${staticPages.length + products.length}`);
        console.log(`🛍️ Product URLs: ${products.length}`);
        
        // Show product slugs
        if (products.length > 0) {
            console.log('\n📦 Products included:');
            products.forEach(product => {
                console.log(`   - ${product.slug}`);
            });
        }
        
        console.log('\n🎯 Next steps:');
        console.log('1. Upload the new sitemap.xml to your server');
        console.log('2. Test the dynamic sitemap at: https://www.laiq.shop/sitemap.xml');
        console.log('3. Submit to Google Search Console');
        
    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
    } finally {
        if (process.env.MONGODB_URI) {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from database');
        }
    }
}

// Run if called directly
if (require.main === module) {
    generateSitemap();
}

module.exports = generateSitemap;
