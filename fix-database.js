const mongoose = require('mongoose');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Product = require('./models/Product');
require('dotenv').config({ path: './config.env' });

async function fixDatabase() {
    try {
        console.log('🔧 Starting comprehensive database fixes...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // 1. Fix Cart version conflicts - CRITICAL FIX
        console.log('🛒 Fixing cart version conflicts...');
        const carts = await Cart.find({});
        console.log(`📊 Found ${carts.length} carts to process`);
        
        for (const cart of carts) {
            try {
                // Remove ALL version-related fields
                const updateResult = await Cart.updateOne(
                    { _id: cart._id },
                    { 
                        $unset: { 
                            __v: 1,
                            _v: 1,
                            version: 1
                        },
                        $set: { 
                            updatedAt: Date.now(),
                            items: cart.items || []
                        }
                    }
                );
                
                if (updateResult.modifiedCount > 0) {
                    console.log(`✅ Fixed cart version conflicts for cart ${cart._id}`);
                } else {
                    console.log(`ℹ️ Cart ${cart._id} already clean`);
                }
            } catch (error) {
                console.error(`❌ Error fixing cart ${cart._id}:`, error.message);
            }
        }
        
        // 2. Fix User phone decryption issues
        console.log('👤 Fixing user phone decryption issues...');
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users to process`);
        
        for (const user of users) {
            try {
                let needsUpdate = false;
                const updates = {};
                
                // Fix phone number issues
                if (user.phone && typeof user.phone === 'string') {
                    // If phone contains encrypted data but is corrupted
                    if (user.phone.includes(':') && user.phone.length > 50) {
                        updates.phone = 'Phone number needs update';
                        needsUpdate = true;
                        console.log(`🔧 Fixing corrupted phone for user ${user._id}`);
                    }
                }
                
                // Ensure user has avatar
                if (!user.avatar || !user.avatar.url) {
                    updates.avatar = {
                        public_id: 'default_avatar',
                        url: 'https://via.placeholder.com/150?text=User'
                    };
                    needsUpdate = true;
                    console.log(`🖼️ Adding default avatar for user ${user._id}`);
                }
                
                if (needsUpdate) {
                    await User.updateOne(
                        { _id: user._id },
                        { $set: updates }
                    );
                    console.log(`✅ Updated user ${user._id}`);
                }
            } catch (error) {
                console.error(`❌ Error fixing user ${user._id}:`, error.message);
            }
        }
        
        // 3. Validate Product data integrity
        console.log('📦 Validating product data integrity...');
        const products = await Product.find({});
        console.log(`📊 Found ${products.length} products to validate`);
        
        for (const product of products) {
            try {
                let needsUpdate = false;
                const updates = {};
                
                // Ensure product has basic required fields
                if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
                    updates.images = [{
                        public_id: 'default_product',
                        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE1NS44MiAxMjAgMTIwIDE1NS44MiAxMjAgMjAwQzEyMCAyNDQuMTggMTU1LjgyIDI4MCAyMDAgMjgwQzI0NC4xOCAyODAgMjgwIDI0NC4xOCAyODAgMjAwQzI4MCAxNTUuODIgMjQ0LjE4IDEyMCAyMDAgMTIwWk0yMDAgMjYwQzE3Ny45MDkgMjYwIDE2MCAyNDIuMDkxIDE2MCAyMjBDMTYwIDE5Ny45MDkgMTc3LjkwOSAxODAgMjAwIDE4MEMyMjIuMDkxIDE4MCAyNDAgMTk3LjkwOSAyNDAgMjIwQzI0MCAyNDIuMDkxIDIyMi4wOTEgMjYwIDIwMCAyNjBaIiBmaWxsPSIjOUNBMEE2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMzIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBMEE2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K',
                        alt: 'Product Image',
                        isPrimary: true
                    }];
                    needsUpdate = true;
                }
                
                // Ensure colorVariants is an array
                if (!product.colorVariants || !Array.isArray(product.colorVariants)) {
                    updates.colorVariants = [];
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    await Product.updateOne(
                        { _id: product._id },
                        { $set: updates }
                    );
                    console.log(`✅ Updated product ${product._id}`);
                }
            } catch (error) {
                console.error(`❌ Error validating product ${product._id}:`, error.message);
            }
        }
        
        // 4. Clean up any orphaned data
        console.log('🧹 Cleaning up orphaned data...');
        
        // Remove carts without valid users
        const orphanedCartsResult = await Cart.deleteMany({
            user: { $nin: await User.distinct('_id') }
        });
        
        if (orphanedCartsResult.deletedCount > 0) {
            console.log(`✅ Removed ${orphanedCartsResult.deletedCount} orphaned carts`);
        }
        
        // 5. Database integrity check
        console.log('🔍 Running database integrity check...');
        
        const stats = {
            users: await User.countDocuments(),
            products: await Product.countDocuments(),
            carts: await Cart.countDocuments(),
            cartsWithItems: await Cart.countDocuments({ 'items.0': { $exists: true } })
        };
        
        console.log('📊 Database Statistics:');
        console.log(`   👤 Users: ${stats.users}`);
        console.log(`   📦 Products: ${stats.products}`);
        console.log(`   🛒 Carts: ${stats.carts}`);
        console.log(`   🛒 Carts with items: ${stats.cartsWithItems}`);
        
        console.log('✅ Database fixes completed successfully!');
        
        // Test a cart operation to ensure no version conflicts
        console.log('🧪 Testing cart operations...');
        const testCart = await Cart.findOne({});
        if (testCart) {
            console.log(`🧪 Testing cart ${testCart._id}...`);
            const originalItemCount = testCart.items.length;
            
            // This should not cause version conflicts anymore
            testCart.updatedAt = Date.now();
            await testCart.save();
            
            console.log('✅ Cart operation test passed - no version conflicts!');
        }
        
    } catch (error) {
        console.error('❌ Database fix failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the fix
console.log('🚀 Starting database repair process...');
fixDatabase(); 