#!/usr/bin/env node

/**
 * Cart Performance Monitor
 * Monitors cart loading and add-to-cart performance
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Performance metrics
let metrics = {
    cartLoads: 0,
    cartLoadTime: 0,
    addToCartOps: 0,
    addToCartTime: 0,
    errors: 0,
    slowQueries: 0
};

// Thresholds
const SLOW_QUERY_THRESHOLD = 2000; // 2 seconds
const VERY_SLOW_QUERY_THRESHOLD = 5000; // 5 seconds

async function monitorCartPerformance() {
    try {
        console.log('🔍 Connecting to MongoDB for performance monitoring...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Monitor cart operations
        const Cart = require('../models/Cart');
        const Product = require('../models/Product');
        
        // Test cart loading performance
        console.log('\n📊 Testing cart loading performance...');
        await testCartLoading(Cart);
        
        // Test add to cart performance
        console.log('\n📊 Testing add to cart performance...');
        await testAddToCart(Cart, Product);
        
        // Test database indexes
        console.log('\n📊 Testing database indexes...');
        await testDatabaseIndexes(Cart);
        
        // Generate performance report
        generatePerformanceReport();
        
    } catch (error) {
        console.error('❌ Performance monitoring failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

async function testCartLoading(Cart) {
    try {
        // Find a user with cart items
        const cartWithItems = await Cart.findOne({ 'items.0': { $exists: true } });
        
        if (!cartWithItems) {
            console.log('⚠️ No carts with items found for testing');
            return;
        }
        
        const userId = cartWithItems.user;
        console.log(`👤 Testing cart loading for user: ${userId}`);
        
        // Test multiple cart loads
        for (let i = 0; i < 5; i++) {
            const startTime = Date.now();
            
            try {
                const cart = await Cart.findOne({ user: userId })
                    .select('items updatedAt')
                    .lean()
                    .maxTimeMS(8000);
                
                const duration = Date.now() - startTime;
                metrics.cartLoads++;
                metrics.cartLoadTime += duration;
                
                if (duration > SLOW_QUERY_THRESHOLD) {
                    metrics.slowQueries++;
                    console.log(`🐌 Slow cart load: ${duration}ms`);
                }
                
                console.log(`📦 Cart load ${i + 1}: ${duration}ms (${cart?.items?.length || 0} items)`);
                
            } catch (error) {
                metrics.errors++;
                console.error(`❌ Cart load ${i + 1} failed:`, error.message);
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
    } catch (error) {
        console.error('❌ Cart loading test failed:', error);
    }
}

async function testAddToCart(Cart, Product) {
    try {
        // Find a test product
        const product = await Product.findOne();
        
        if (!product) {
            console.log('⚠️ No products found for testing');
            return;
        }
        
        console.log(`📦 Testing add to cart with product: ${product.name}`);
        
        // Test multiple add to cart operations
        for (let i = 0; i < 3; i++) {
            const startTime = Date.now();
            
            try {
                // Simulate add to cart operation
                const cartItem = {
                    product: product._id,
                    quantity: 1,
                    price: product.price,
                    name: product.name,
                    image: product.images?.[0]?.url || product.image,
                    color: { name: 'Test', code: '#000000' }
                };
                
                // Use atomic operation
                const result = await Cart.findOneAndUpdate(
                    { user: product._id }, // Use product ID as user for testing
                    { 
                        $push: { items: cartItem },
                        $set: { updatedAt: Date.now() }
                    },
                    { new: true, upsert: true }
                );
                
                const duration = Date.now() - startTime;
                metrics.addToCartOps++;
                metrics.addToCartTime += duration;
                
                if (duration > SLOW_QUERY_THRESHOLD) {
                    metrics.slowQueries++;
                    console.log(`🐌 Slow add to cart: ${duration}ms`);
                }
                
                console.log(`➕ Add to cart ${i + 1}: ${duration}ms`);
                
            } catch (error) {
                metrics.errors++;
                console.error(`❌ Add to cart ${i + 1} failed:`, error.message);
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
    } catch (error) {
        console.error('❌ Add to cart test failed:', error);
    }
}

async function testDatabaseIndexes(Cart) {
    try {
        console.log('🔍 Checking database indexes...');
        
        // Get collection stats
        const collection = Cart.collection;
        const stats = await collection.stats();
        
        console.log('📊 Collection stats:');
        console.log(`   - Documents: ${stats.count}`);
        console.log(`   - Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   - Indexes: ${stats.nindexes}`);
        
        // Get index information
        const indexes = await collection.indexes();
        console.log('\n🔍 Indexes:');
        indexes.forEach((index, i) => {
            console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // Check if performance indexes exist
        const hasUserIndex = indexes.some(idx => idx.key.user === 1);
        const hasProductIndex = indexes.some(idx => idx.key['items.product'] === 1);
        const hasUpdatedAtIndex = indexes.some(idx => idx.key.updatedAt === -1);
        
        console.log('\n✅ Performance index status:');
        console.log(`   - User index: ${hasUserIndex ? '✅' : '❌'}`);
        console.log(`   - Product index: ${hasProductIndex ? '✅' : '❌'}`);
        console.log(`   - UpdatedAt index: ${hasUpdatedAtIndex ? '✅' : '❌'}`);
        
        if (!hasUserIndex || !hasProductIndex || !hasUpdatedAtIndex) {
            console.log('\n⚠️ Missing performance indexes detected!');
            console.log('   Run the database optimization script to create them.');
        }
        
    } catch (error) {
        console.error('❌ Database index test failed:', error);
    }
}

function generatePerformanceReport() {
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));
    
    if (metrics.cartLoads > 0) {
        const avgCartLoadTime = (metrics.cartLoadTime / metrics.cartLoads).toFixed(2);
        console.log(`📦 Cart Loading:`);
        console.log(`   - Total operations: ${metrics.cartLoads}`);
        console.log(`   - Average time: ${avgCartLoadTime}ms`);
        console.log(`   - Slow queries: ${metrics.slowQueries}`);
    }
    
    if (metrics.addToCartOps > 0) {
        const avgAddToCartTime = (metrics.addToCartTime / metrics.addToCartOps).toFixed(2);
        console.log(`➕ Add to Cart:`);
        console.log(`   - Total operations: ${metrics.addToCartOps}`);
        console.log(`   - Average time: ${avgAddToCartTime}ms`);
    }
    
    console.log(`❌ Errors: ${metrics.errors}`);
    
    // Performance recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    if (metrics.slowQueries > 0) {
        console.log('   - Consider adding database indexes');
        console.log('   - Review query patterns');
        console.log('   - Check database connection pool');
    }
    
    if (metrics.errors > 0) {
        console.log('   - Review error handling');
        console.log('   - Check database connectivity');
    }
    
    if (metrics.cartLoadTime / metrics.cartLoads > 1000) {
        console.log('   - Cart loading is slow, consider caching');
        console.log('   - Review cart data structure');
    }
    
    if (metrics.addToCartTime / metrics.addToCartOps > 500) {
        console.log('   - Add to cart is slow, optimize database operations');
        console.log('   - Consider batch operations');
    }
}

// Run the monitor
if (require.main === module) {
    monitorCartPerformance().catch(console.error);
}

module.exports = { monitorCartPerformance };
