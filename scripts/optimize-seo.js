const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
    path: process.env.NODE_ENV === 'production' ? './config.env.production' : './config.env' 
});

// Import Product model
const Product = require('../models/Product');

async function optimizeSEO() {
    try {
        console.log('🚀 Starting comprehensive SEO optimization...');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Get all products
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products to optimize`);
        
        let updatedCount = 0;
        
        for (const product of products) {
            let needsUpdate = false;
            
            // 1. Generate SEO-friendly slug if missing
            if (!product.slug) {
                product.slug = generateSlug(product.name);
                needsUpdate = true;
                console.log(`🔗 Generated slug for "${product.name}": ${product.slug}`);
            }
            
            // 2. Generate meta description if missing
            if (!product.metaDescription) {
                product.metaDescription = generateMetaDescription(product);
                needsUpdate = true;
                console.log(`📝 Generated meta description for "${product.name}"`);
            }
            
            // 3. Generate SEO title if missing
            if (!product.seoTitle) {
                product.seoTitle = generateSEOTitle(product);
                needsUpdate = true;
                console.log(`🏷️ Generated SEO title for "${product.name}"`);
            }
            
            // 4. Generate SEO keywords if missing
            if (!product.seoKeywords || product.seoKeywords.length === 0) {
                product.seoKeywords = generateSEOKeywords(product);
                needsUpdate = true;
                console.log(`🔑 Generated SEO keywords for "${product.name}"`);
            }
            
            // Save if any updates were made
            if (needsUpdate) {
                await product.save();
                updatedCount++;
                console.log(`✅ Updated SEO for: ${product.name}`);
            }
        }
        
        console.log(`\n🎯 SEO Optimization Complete!`);
        console.log(`📊 Products updated: ${updatedCount}/${products.length}`);
        
        // Generate optimized sitemap
        console.log('\n🔗 Generating optimized sitemap...');
        await generateOptimizedSitemap(products);
        
        // Generate robots.txt
        console.log('\n🤖 Generating robots.txt...');
        generateRobotsTxt();
        
        // Generate structured data
        console.log('\n📊 Generating structured data...');
        generateStructuredData(products);
        
        console.log('\n✅ All SEO optimizations completed successfully!');
        
    } catch (error) {
        console.error('❌ SEO optimization error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
}

function generateMetaDescription(product) {
    const baseDesc = `${product.name} - Premium ${product.category} from Laiq Bags. `;
    const priceInfo = `Available at ₹${product.price}`;
    const features = product.specifications?.features?.slice(0, 2).join(', ') || '';
    const featureText = features ? ` Features: ${features}.` : '';
    
    let description = baseDesc + priceInfo + featureText;
    
    // Add category-specific keywords
    const categoryKeywords = {
        'backpack': 'Perfect for school, college, and travel.',
        'sling': 'Stylish crossbody bag for everyday use.',
        'handbag': 'Elegant handbag for professional and casual occasions.',
        'tote': 'Spacious tote bag for shopping and daily essentials.',
        'laptop-bag': 'Secure laptop compartment with padded protection.',
        'travel-bag': 'Durable travel bag for your adventures.'
    };
    
    if (categoryKeywords[product.category]) {
        description += ' ' + categoryKeywords[product.category];
    }
    
    // Ensure it doesn't exceed 160 characters
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }
    
    return description;
}

function generateSEOTitle(product) {
    const baseTitle = `${product.name} - ₹${product.price}`;
    const categoryText = `${product.category.charAt(0).toUpperCase() + product.category.slice(1)} - Laiq Bags`;
    
    let title = `${baseTitle} | ${categoryText}`;
    
    // Ensure it doesn't exceed 60 characters
    if (title.length > 60) {
        title = title.substring(0, 57) + '...';
    }
    
    return title;
}

function generateSEOKeywords(product) {
    const baseKeywords = [
        'laiq bags',
        product.name.toLowerCase(),
        product.category,
        product.type,
        'premium bags',
        'stylish bags'
    ];
    
    // Add material keywords
    if (product.material) {
        baseKeywords.push(product.material.toLowerCase());
    }
    
    // Add size keywords
    if (product.size) {
        baseKeywords.push(product.size.toLowerCase());
    }
    
    // Add category-specific keywords
    const categoryKeywords = {
        'backpack': ['school bag', 'college bag', 'travel backpack', 'rucksack'],
        'sling': ['crossbody bag', 'shoulder bag', 'messenger bag'],
        'handbag': ['purse', 'ladies bag', 'fashion bag', 'clutch'],
        'tote': ['shopping bag', 'beach bag', 'canvas bag'],
        'laptop-bag': ['computer bag', 'office bag', 'business bag'],
        'travel-bag': ['duffel bag', 'weekend bag', 'luggage']
    };
    
    if (categoryKeywords[product.category]) {
        baseKeywords.push(...categoryKeywords[product.category]);
    }
    
    // Remove duplicates and limit to 10 keywords
    return [...new Set(baseKeywords)].slice(0, 10);
}

async function generateOptimizedSitemap(products) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages with optimized priorities
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/shop.html', priority: '0.9', changefreq: 'daily' },
        { url: '/about.html', priority: '0.7', changefreq: 'monthly' },
        { url: '/contact.html', priority: '0.7', changefreq: 'monthly' },
        { url: '/size-guide.html', priority: '0.6', changefreq: 'monthly' },
        { url: '/customer-login.html', priority: '0.5', changefreq: 'monthly' },
        { url: '/customer-register.html', priority: '0.5', changefreq: 'monthly' }
    ];

    staticPages.forEach(page => {
        sitemap += `
  <url>
    <loc>https://www.laiq.shop${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add product pages with optimized priorities
    products.forEach(product => {
        const lastmod = product.updatedAt ? 
            new Date(product.updatedAt).toISOString().split('T')[0] : 
            currentDate;
        
        // Higher priority for featured/bestseller products
        let priority = '0.8';
        if (product.featured) priority = '0.9';
        if (product.bestSeller) priority = '0.9';
        
        sitemap += `
  <url>
    <loc>https://www.laiq.shop/product.html?slug=${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    
    console.log(`✅ Optimized sitemap generated with ${staticPages.length + products.length} URLs`);
}

function generateRobotsTxt() {
    const robotsContent = `# CRITICAL UPDATE - Force Google to re-crawl this file
# Last updated: 2025-08-24 23:45:00 UTC
# This file explicitly allows ALL crawling

User-agent: *
Allow: /

# Explicitly allow all important pages
Allow: /index.html
Allow: /shop.html
Allow: /about.html
Allow: /contact.html
Allow: /product.html
Allow: /customer-login.html
Allow: /customer-register.html
Allow: /size-guide.html

# Sitemap location
Sitemap: https://www.laiq.shop/sitemap.xml

# Force cache refresh - DO NOT CACHE THIS FILE
# Google must re-crawl this file immediately`;

    const robotsPath = path.join(__dirname, '..', 'robots.txt');
    fs.writeFileSync(robotsPath, robotsContent);
    
    console.log('✅ Optimized robots.txt generated');
}

function generateStructuredData(products) {
    // Generate product catalog structured data
    const productCatalog = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Laiq Bags Product Catalog",
        "description": "Premium bags and accessories collection",
        "url": "https://www.laiq.shop/shop.html",
        "numberOfItems": products.length,
        "itemListElement": products.map((product, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Product",
                "name": product.name,
                "description": product.metaDescription || product.description,
                "url": `https://www.laiq.shop/product.html?slug=${product.slug}`,
                "image": product.images?.[0]?.url || "https://www.laiq.shop/assets/placeholder-bag-1.jpg",
                "brand": {
                    "@type": "Brand",
                    "name": "Laiq Bags"
                },
                "category": product.category,
                "offers": {
                    "@type": "Offer",
                    "price": product.price,
                    "priceCurrency": "INR",
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "seller": {
                        "@type": "Organization",
                        "name": "Laiq Bags"
                    }
                }
            }
        }))
    };

    const structuredDataPath = path.join(__dirname, '..', 'structured-data.json');
    fs.writeFileSync(structuredDataPath, JSON.stringify(productCatalog, null, 2));
    
    console.log('✅ Structured data generated for product catalog');
}

// Run if called directly
if (require.main === module) {
    optimizeSEO();
}

module.exports = optimizeSEO;
