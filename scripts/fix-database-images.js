// Fix database images - Replace Unsplash URLs with local placeholders
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Load environment variables
require('dotenv').config();

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laiq_bags');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

// Function to replace Unsplash URLs with local placeholders
function replaceUnsplashUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    if (url.includes('images.unsplash.com')) {
        if (url.includes('photo-1517841905240-472988babdf9')) {
            return '/assets/placeholder-bag-1.jpg';
        } else if (url.includes('photo-1526178613658-3f1622045557')) {
            return '/assets/placeholder-bag-2.jpg';
        } else if (url.includes('photo-1465101046530-73398c7f28ca')) {
            return '/assets/placeholder-bag-3.jpg';
        } else if (url.includes('photo-1506744038136-46273834b3fb')) {
            return '/assets/placeholder-bag-4.jpg';
        } else if (url.includes('photo-1553062407-98eeb64c6a62')) {
            return '/assets/placeholder-bag-5.jpg';
        } else if (url.includes('photo-1548036328-c9fa89d128fa')) {
            return '/assets/placeholder-bag-6.jpg';
        } else {
            return '/assets/placeholder-bag-1.jpg';
        }
    }
    
    return url;
}

// Function to process product images
function processProductImages(product) {
    let updated = false;
    
    // Handle main image
    if (product.image && product.image.includes('images.unsplash.com')) {
        const oldImage = product.image;
        product.image = replaceUnsplashUrl(product.image);
        if (product.image !== oldImage) {
            console.log(`🔄 Product ${product.name}: ${oldImage} -> ${product.image}`);
            updated = true;
        }
    }
    
    // Handle images array
    if (product.images && Array.isArray(product.images)) {
        product.images = product.images.map(img => {
            if (typeof img === 'string') {
                const oldImg = img;
                const newImg = replaceUnsplashUrl(img);
                if (newImg !== oldImg) {
                    console.log(`🔄 Product ${product.name} image: ${oldImg} -> ${newImg}`);
                    updated = true;
                }
                return newImg;
            } else if (img && typeof img === 'object' && img.url) {
                const oldUrl = img.url;
                img.url = replaceUnsplashUrl(img.url);
                if (img.url !== oldUrl) {
                    console.log(`🔄 Product ${product.name} image URL: ${oldUrl} -> ${img.url}`);
                    updated = true;
                }
                return img;
            }
            return img;
        });
    }
    
    // Handle color variants
    if (product.colors && Array.isArray(product.colors)) {
        product.colors = product.colors.map(color => {
            if (color && typeof color === 'object') {
                if (color.image && color.image.includes('images.unsplash.com')) {
                    const oldColorImg = color.image;
                    color.image = replaceUnsplashUrl(color.image);
                    if (color.image !== oldColorImg) {
                        console.log(`🔄 Product ${product.name} color image: ${oldColorImg} -> ${color.image}`);
                        updated = true;
                    }
                }
                
                if (color.images && Array.isArray(color.images)) {
                    color.images = color.images.map(img => {
                        const oldImg = img;
                        const newImg = replaceUnsplashUrl(img);
                        if (newImg !== oldImg) {
                            console.log(`🔄 Product ${product.name} color images: ${oldImg} -> ${newImg}`);
                            updated = true;
                        }
                        return newImg;
                    });
                }
            }
            return color;
        });
    }
    
    return { product, updated };
}

// Main function to fix all products
async function fixDatabaseImages() {
    try {
        console.log('🖼️ Starting database image URL fix...');
        
        // Connect to database
        await connectDB();
        
        // Get all products
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products to process`);
        
        let totalUpdated = 0;
        
        // Process each product
        for (const product of products) {
            const { product: updatedProduct, updated } = processProductImages(product);
            
            if (updated) {
                // Save the updated product
                await Product.findByIdAndUpdate(product._id, updatedProduct, { new: true });
                totalUpdated++;
                console.log(`✅ Updated product: ${product.name}`);
            }
        }
        
        console.log(`🎉 Database image fix completed!`);
        console.log(`📊 Total products processed: ${products.length}`);
        console.log(`✅ Total products updated: ${totalUpdated}`);
        
        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        
    } catch (error) {
        console.error('❌ Error fixing database images:', error);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    fixDatabaseImages();
}

module.exports = { fixDatabaseImages, replaceUnsplashUrl };
