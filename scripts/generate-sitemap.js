const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import Product model
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Website base URL
const BASE_URL = process.env.FRONTEND_URL || 'https://laiq.shop';

// Static pages
const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/shop.html', priority: '0.9', changefreq: 'daily' },
    { url: '/about.html', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact.html', priority: '0.7', changefreq: 'monthly' },
    { url: '/size-guide.html', priority: '0.6', changefreq: 'monthly' },
    { url: '/customer-login.html', priority: '0.5', changefreq: 'monthly' },
    { url: '/customer-register.html', priority: '0.5', changefreq: 'monthly' }
];

// Generate sitemap XML
function generateSitemapXML(urls) {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const urlsetClose = '</urlset>';
    
    let xml = xmlHeader + urlsetOpen;
    
    urls.forEach(page => {
        const lastmod = page.lastmod || new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
    });
    
    xml += urlsetClose;
    return xml;
}

// Generate sitemap
async function generateSitemap() {
    try {
        console.log('🔄 Generating sitemap...');
        
        // Get all products
        const products = await Product.find({}, 'slug updatedAt');
        console.log(`📦 Found ${products.length} products`);
        
        // Create URLs array starting with static pages
        const urls = [...staticPages];
        
        // Add product pages
        products.forEach(product => {
            const productUrl = product.slug 
                ? `/product.html?slug=${product.slug}` 
                : `/product.html?id=${product._id}`;
            
            urls.push({
                url: productUrl,
                lastmod: product.updatedAt ? product.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                priority: '0.8',
                changefreq: 'weekly'
            });
        });
        
        // Generate XML
        const sitemapXML = generateSitemapXML(urls);
        
        // Write to file
        const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemapXML, 'utf8');
        
        console.log(`✅ Sitemap generated successfully!`);
        console.log(`📄 File saved to: ${sitemapPath}`);
        console.log(`🔗 Total URLs: ${urls.length}`);
        console.log(`📦 Product URLs: ${products.length}`);
        console.log(`🏠 Static URLs: ${staticPages.length}`);
        
        // Also create robots.txt if it doesn't exist
        const robotsPath = path.join(__dirname, '..', 'robots.txt');
        if (!fs.existsSync(robotsPath)) {
            const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml

# Disallow admin pages
Disallow: /admin*
Disallow: /admin-*
Disallow: /test-*

# Allow important pages
Allow: /shop.html
Allow: /product.html
Allow: /about.html
Allow: /contact.html`;
            
            fs.writeFileSync(robotsPath, robotsContent, 'utf8');
            console.log(`🤖 robots.txt created: ${robotsPath}`);
        }
        
    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
    }
}

// Run the sitemap generation
generateSitemap()
    .then(() => {
        console.log('✅ Sitemap generation completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Sitemap generation failed:', error);
        process.exit(1);
    });
