const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config({ path: './config.env' });

async function fixWishlistAfterRollback() {
    try {
        console.log('🔧 Starting wishlist cleanup after rollback...');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Get all existing product IDs from database
        const existingProducts = await Product.find({}, '_id');
        const existingProductIds = existingProducts.map(p => p._id.toString());
        console.log(`📦 Found ${existingProductIds.length} products in database`);
        
        // Get current wishlist from localStorage (this would be done on frontend)
        // For now, we'll create a script that can be run on the frontend
        
        const cleanupScript = `
// Wishlist cleanup script - run this in browser console
function cleanupWishlistAfterRollback() {
    console.log('🧹 Starting wishlist cleanup...');
    
    // Get current wishlist
    const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
    const userWishlist = JSON.parse(localStorage.getItem('userWishlist') || '[]');
    
    console.log('📋 Current wishlist items:', {
        guest: guestWishlist.length,
        user: userWishlist.length
    });
    
    // Function to check if product exists
    async function checkProductExists(productId) {
        try {
            const response = await fetch(\`/api/products/\${productId}\`);
            return response.ok;
        } catch (error) {
            console.log('❌ Error checking product:', productId, error.message);
            return false;
        }
    }
    
    // Clean up guest wishlist
    async function cleanupGuestWishlist() {
        const validItems = [];
        for (const item of guestWishlist) {
            const productId = typeof item === 'string' ? item : (item.id || item._id);
            if (productId) {
                const exists = await checkProductExists(productId);
                if (exists) {
                    validItems.push(item);
                } else {
                    console.log('🗑️ Removing invalid product from guest wishlist:', productId);
                }
            }
        }
        
        localStorage.setItem('guestWishlist', JSON.stringify(validItems));
        console.log('✅ Guest wishlist cleaned:', validItems.length, 'valid items remaining');
        return validItems;
    }
    
    // Clean up user wishlist
    async function cleanupUserWishlist() {
        const validItems = [];
        for (const item of userWishlist) {
            const productId = typeof item === 'string' ? item : (item.id || item._id);
            if (productId) {
                const exists = await checkProductExists(productId);
                if (exists) {
                    validItems.push(item);
                } else {
                    console.log('🗑️ Removing invalid product from user wishlist:', productId);
                }
            }
        }
        
        localStorage.setItem('userWishlist', JSON.stringify(validItems));
        console.log('✅ User wishlist cleaned:', validItems.length, 'valid items remaining');
        return validItems;
    }
    
    // Run cleanup
    Promise.all([cleanupGuestWishlist(), cleanupUserWishlist()]).then(() => {
        console.log('🎉 Wishlist cleanup completed!');
        console.log('🔄 Please refresh the page to see the updated wishlist.');
    });
}

// Run the cleanup
cleanupWishlistAfterRollback();
`;

        console.log('📝 Generated cleanup script for frontend');
        console.log('\n' + '='.repeat(60));
        console.log('INSTRUCTIONS:');
        console.log('1. Open your website in a browser');
        console.log('2. Open Developer Tools (F12)');
        console.log('3. Go to Console tab');
        console.log('4. Copy and paste the following script:');
        console.log('='.repeat(60));
        console.log(cleanupScript);
        console.log('='.repeat(60));
        
        // Also create a simple API endpoint to get all valid product IDs
        console.log('\n📊 Valid product IDs in database:');
        existingProductIds.forEach(id => console.log(id));
        
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error during wishlist cleanup:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

// Run the script
fixWishlistAfterRollback();
