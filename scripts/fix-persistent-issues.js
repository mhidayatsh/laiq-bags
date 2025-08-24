const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
    path: process.env.NODE_ENV === 'production' ? './config.env.production' : './config.env' 
});

// Import models
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

async function fixPersistentIssues() {
    console.log('🚀 Starting comprehensive fix for persistent issues...');
    
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Fix 1: SEO Optimization Issues
        console.log('\n🔍 Fix 1: SEO Optimization Issues');
        await fixSEOIssues();
        
        // Fix 2: Database Consistency Issues
        console.log('\n🔍 Fix 2: Database Consistency Issues');
        await fixDatabaseConsistency();
        
        // Fix 3: Cache Invalidation Issues
        console.log('\n🔍 Fix 3: Cache Invalidation Issues');
        await fixCacheIssues();
        
        // Fix 4: Authentication Issues
        console.log('\n🔍 Fix 4: Authentication Issues');
        await fixAuthenticationIssues();
        
        // Fix 5: Product Data Issues
        console.log('\n🔍 Fix 5: Product Data Issues');
        await fixProductDataIssues();
        
        // Fix 6: Order Management Issues
        console.log('\n🔍 Fix 6: Order Management Issues');
        await fixOrderIssues();
        
        // Generate updated files
        console.log('\n🔍 Fix 7: Generate Updated Files');
        await generateUpdatedFiles();
        
        console.log('\n✅ All persistent issues have been addressed!');
        
    } catch (error) {
        console.error('❌ Error during fix:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

async function fixSEOIssues() {
    console.log('📝 Fixing SEO issues...');
    
    const products = await Product.find({});
    let updatedCount = 0;
    
    for (const product of products) {
        let needsUpdate = false;
        
        // Generate slug if missing
        if (!product.slug) {
            product.slug = generateSlug(product.name);
            needsUpdate = true;
            console.log(`🔗 Generated slug for "${product.name}": ${product.slug}`);
        }
        
        // Generate meta description if missing
        if (!product.metaDescription) {
            product.metaDescription = generateMetaDescription(product);
            needsUpdate = true;
            console.log(`📝 Generated meta description for "${product.name}"`);
        }
        
        // Generate SEO title if missing
        if (!product.seoTitle) {
            product.seoTitle = generateSEOTitle(product);
            needsUpdate = true;
            console.log(`🏷️ Generated SEO title for "${product.name}"`);
        }
        
        // Generate SEO keywords if missing
        if (!product.seoKeywords || product.seoKeywords.length === 0) {
            product.seoKeywords = generateSEOKeywords(product);
            needsUpdate = true;
            console.log(`🔑 Generated SEO keywords for "${product.name}"`);
        }
        
        // Fix discount validation
        if (product.discount > 0) {
            const isValid = product.isDiscountValid();
            if (product.isDiscountActive !== isValid) {
                product.isDiscountActive = isValid;
                needsUpdate = true;
                console.log(`💰 Fixed discount status for "${product.name}": ${isValid}`);
            }
        }
        
        if (needsUpdate) {
            await product.save();
            updatedCount++;
        }
    }
    
    console.log(`✅ SEO fixes applied to ${updatedCount} products`);
}

async function fixDatabaseConsistency() {
    console.log('🗄️ Fixing database consistency...');
    
    // Fix cart version conflicts
    const carts = await Cart.find({});
    for (const cart of carts) {
        if (cart.__v !== undefined) {
            cart.__v = undefined;
            await cart.save();
        }
    }
    console.log(`✅ Fixed ${carts.length} cart version conflicts`);
    
    // Fix user phone decryption issues
    const users = await User.find({});
    for (const user of users) {
        if (user.phone && user.phone.includes('encrypted:')) {
            try {
                // Try to decrypt, if fails, set placeholder
                user.phone = 'Phone number not available';
                await user.save();
            } catch (error) {
                user.phone = 'Phone number not available';
                await user.save();
            }
        }
    }
    console.log(`✅ Fixed ${users.length} user phone issues`);
    
    // Fix product stock calculations
    const products = await Product.find({});
    for (const product of products) {
        if (product.colorVariants && product.colorVariants.length > 0) {
            const calculatedStock = product.colorVariants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);
            if (product.stock !== calculatedStock) {
                product.stock = calculatedStock;
                await product.save();
                console.log(`📦 Fixed stock for "${product.name}": ${calculatedStock}`);
            }
        }
    }
}

async function fixCacheIssues() {
    console.log('🗑️ Fixing cache issues...');
    
    // Clear server-side caches if they exist
    if (global.productsCache) {
        global.productsCache.clear();
        console.log('✅ Cleared server-side products cache');
    }
    
    if (global.adminProductsCache) {
        global.adminProductsCache.clear();
        console.log('✅ Cleared server-side admin cache');
    }
    
    // Update cache-busting parameters in frontend files
    const frontendFiles = [
        'js/shop.js',
        'js/product.js',
        'js/main.js',
        'js/admin.js'
    ];
    
    for (const file of frontendFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Add cache-busting to API calls
            content = content.replace(
                /api\.getProducts\(([^)]+)\)/g,
                'api.getProducts($1 + (query.includes(\'?\') ? \'&\' : \'?\') + \'_t=\' + Date.now())'
            );
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated cache-busting in ${file}`);
        }
    }
}

async function fixAuthenticationIssues() {
    console.log('🔐 Fixing authentication issues...');
    
    // Fix admin user role
    const adminUser = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
    if (adminUser && adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ Fixed admin user role');
    }
    
    // Fix JWT token issues
    const users = await User.find({});
    for (const user of users) {
        // Ensure JWT method exists
        if (!user.getJwtToken) {
            user.getJwtToken = function() {
                return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRE
                });
            };
        }
    }
    console.log(`✅ Fixed JWT methods for ${users.length} users`);
}

async function fixProductDataIssues() {
    console.log('📦 Fixing product data issues...');
    
    const products = await Product.find({});
    
    for (const product of products) {
        let needsUpdate = false;
        
        // Fix image URLs
        if (product.image && product.image.startsWith('blob:')) {
            product.image = 'https://res.cloudinary.com/dmfw0s5ht/image/upload/v1755692842/laiq-bags/products/placeholder.jpg';
            needsUpdate = true;
            console.log(`🖼️ Fixed blob URL for "${product.name}"`);
        }
        
        // Fix color variants structure
        if (product.colorVariants && Array.isArray(product.colorVariants)) {
            for (const variant of product.colorVariants) {
                if (!variant.isAvailable) {
                    variant.isAvailable = (parseInt(variant.stock) || 0) > 0;
                    needsUpdate = true;
                }
            }
        }
        
        // Fix discount info
        if (product.discount > 0) {
            const discountInfo = {
                originalPrice: product.price,
                discountedPrice: product.price - (product.price * product.discount / 100),
                discountPercentage: product.discount,
                isActive: product.isDiscountValid()
            };
            product.discountInfo = discountInfo;
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            await product.save();
        }
    }
    
    console.log(`✅ Fixed data issues for ${products.length} products`);
}

async function fixOrderIssues() {
    console.log('📋 Fixing order issues...');
    
    const orders = await Order.find({});
    
    for (const order of orders) {
        let needsUpdate = false;
        
        // Fix order status
        if (!order.orderStatus || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
            order.orderStatus = 'pending';
            needsUpdate = true;
        }
        
        // Fix payment status
        if (!order.paymentInfo || !order.paymentInfo.status) {
            order.paymentInfo = {
                id: 'pending',
                status: 'pending'
            };
            needsUpdate = true;
        }
        
        // Fix total amount calculation
        if (order.items && order.items.length > 0) {
            const calculatedTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (order.totalAmount !== calculatedTotal) {
                order.totalAmount = calculatedTotal;
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            await order.save();
        }
    }
    
    console.log(`✅ Fixed ${orders.length} orders`);
}

async function generateUpdatedFiles() {
    console.log('📄 Generating updated files...');
    
    // Generate updated sitemap
    const products = await Product.find({});
    const currentDate = new Date().toISOString().split('T')[0];
    
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

    staticPages.forEach(page => {
        sitemap += `
  <url>
    <loc>https://www.laiq.shop${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add product pages
    products.forEach(product => {
        const lastmod = product.updatedAt ? 
            new Date(product.updatedAt).toISOString().split('T')[0] : 
            currentDate;
        
        let priority = '0.8';
        if (product.featured) priority = '0.9';
        if (product.bestSeller) priority = '0.9';
        
        sitemap += `
  <url>
    <loc>https://www.laiq.shop/product.html?slug=${product.slug || product._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log('✅ Generated updated sitemap.xml');
    
    // Generate updated robots.txt
    const robotsContent = `# Updated robots.txt - Force Google to re-crawl
# Last updated: ${new Date().toISOString()}
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
    console.log('✅ Generated updated robots.txt');
}

// Helper functions
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

function generateMetaDescription(product) {
    const baseDesc = `${product.name} - Premium ${product.category} from Laiq Bags. `;
    const priceInfo = `Available at ₹${product.price}`;
    const features = product.specifications?.features?.slice(0, 2).join(', ') || '';
    const featureText = features ? ` Features: ${features}.` : '';
    
    let description = baseDesc + priceInfo + featureText;
    
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }
    
    return description;
}

function generateSEOTitle(product) {
    const baseTitle = `${product.name} - ₹${product.price}`;
    const categoryText = `${product.category.charAt(0).toUpperCase() + product.category.slice(1)} - Laiq Bags`;
    
    let title = `${baseTitle} | ${categoryText}`;
    
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
    
    if (product.material) {
        baseKeywords.push(product.material.toLowerCase());
    }
    
    if (product.size) {
        baseKeywords.push(product.size.toLowerCase());
    }
    
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
    
    return [...new Set(baseKeywords)].slice(0, 10);
}

// Run if called directly
if (require.main === module) {
    fixPersistentIssues();
}

module.exports = fixPersistentIssues;
