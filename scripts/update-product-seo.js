const mongoose = require('mongoose');
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

// SEO keywords for different categories
const categoryKeywords = {
    'backpack': ['backpack', 'school bag', 'college bag', 'travel backpack', 'rucksack'],
    'sling': ['sling bag', 'crossbody bag', 'shoulder bag', 'messenger bag'],
    'handbag': ['handbag', 'purse', 'ladies bag', 'fashion bag', 'designer bag'],
    'tote': ['tote bag', 'shopping bag', 'beach bag', 'canvas bag'],
    'laptop-bag': ['laptop bag', 'computer bag', 'office bag', 'business bag'],
    'travel-bag': ['travel bag', 'duffel bag', 'weekend bag', 'luggage']
};

// Generate SEO keywords for a product
function generateSEOKeywords(product) {
    const keywords = [];
    
    // Add category keywords
    if (product.category && categoryKeywords[product.category]) {
        keywords.push(...categoryKeywords[product.category]);
    }
    
    // Add brand keywords
    keywords.push('laiq bags', 'laiq', 'premium bags');
    
    // Add material keywords
    if (product.material) {
        keywords.push(product.material.toLowerCase());
    }
    
    // Add type keywords
    if (product.type) {
        keywords.push(product.type.toLowerCase());
    }
    
    // Add size keywords
    if (product.size) {
        keywords.push(product.size.toLowerCase());
    }
    
    // Add color keywords
    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
            keywords.push(color.toLowerCase());
        });
    }
    
    // Add general bag keywords
    keywords.push('bags', 'accessories', 'fashion', 'style');
    
    // Remove duplicates and limit to 15 keywords
    return [...new Set(keywords)].slice(0, 15);
}

// Generate meta description
function generateMetaDescription(product) {
    let description = product.description || '';
    
    // Remove HTML tags
    description = description.replace(/<[^>]*>/g, '');
    
    // Add product details
    const details = [];
    if (product.material) details.push(product.material);
    if (product.size) details.push(product.size);
    if (product.category) details.push(product.category);
    
    if (details.length > 0) {
        description += ` Made from ${details.join(', ')}.`;
    }
    
    // Add brand mention
    description += ' Buy from Laiq Bags - Carry Style with Confidence.';
    
    // Limit to 160 characters
    if (description.length > 160) {
        description = description.substring(0, 157) + '...';
    }
    
    return description;
}

// Update products with SEO fields
async function updateProductsSEO() {
    try {
        console.log('🔄 Starting SEO update for all products...');
        
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products to update`);
        
        let updatedCount = 0;
        let errorCount = 0;
        
        for (const product of products) {
            try {
                const updates = {};
                
                // Generate slug if not exists
                if (!product.slug) {
                    const slug = product.name
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .trim('-');
                    updates.slug = slug;
                }
                
                // Generate meta description if not exists
                if (!product.metaDescription) {
                    updates.metaDescription = generateMetaDescription(product);
                }
                
                // Generate SEO keywords if not exists
                if (!product.seoKeywords || product.seoKeywords.length === 0) {
                    updates.seoKeywords = generateSEOKeywords(product);
                }
                
                // Generate SEO title if not exists
                if (!product.seoTitle) {
                    updates.seoTitle = product.name.length > 60 
                        ? product.name.substring(0, 57) + '...' 
                        : product.name;
                }
                
                // Update product if there are changes
                if (Object.keys(updates).length > 0) {
                    await Product.findByIdAndUpdate(product._id, updates);
                    updatedCount++;
                    console.log(`✅ Updated product: ${product.name}`);
                } else {
                    console.log(`ℹ️ No updates needed for: ${product.name}`);
                }
                
            } catch (error) {
                console.error(`❌ Error updating product ${product.name}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 SEO Update Summary:');
        console.log(`✅ Successfully updated: ${updatedCount} products`);
        console.log(`❌ Errors: ${errorCount} products`);
        console.log(`📦 Total products processed: ${products.length}`);
        
    } catch (error) {
        console.error('❌ Error in SEO update process:', error);
    }
}

// Run the update
updateProductsSEO()
    .then(() => {
        console.log('✅ SEO update completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ SEO update failed:', error);
        process.exit(1);
    });
