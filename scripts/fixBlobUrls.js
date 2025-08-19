const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import models
const Product = require('../models/Product');
const Order = require('../models/Order');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  fixBlobUrls();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function fixBlobUrls() {
  try {
    console.log('🔧 Starting blob URL fix...');
    
    // Get all products and check for blob URLs
    const products = await Product.find({});
    console.log(`📦 Checking ${products.length} products for blob URLs`);
    
    let fixedProducts = 0;
    for (const product of products) {
      let needsUpdate = false;
      
      // Check main images
      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          if (product.images[i].url && product.images[i].url.startsWith('blob:')) {
            console.log(`  🔄 Found blob URL in product ${product.name}: ${product.images[i].url}`);
            product.images[i].url = '/assets/placeholder-bag-1.jpg';
            product.images[i].public_id = 'placeholder-image';
            needsUpdate = true;
          }
        }
      }
      
      // Check color variants
      if (product.colorVariants && product.colorVariants.length > 0) {
        for (const variant of product.colorVariants) {
          if (variant.images && variant.images.length > 0) {
            for (let i = 0; i < variant.images.length; i++) {
              if (variant.images[i] && variant.images[i].startsWith('blob:')) {
                console.log(`  🔄 Found blob URL in color variant of ${product.name}: ${variant.images[i]}`);
                variant.images[i] = '/assets/placeholder-bag-1.jpg';
                needsUpdate = true;
              }
            }
          }
        }
      }
      
      if (needsUpdate) {
        await product.save();
        fixedProducts++;
        console.log(`✅ Fixed product: ${product.name}`);
      }
    }
    
    // Get all orders and check for blob URLs
    const orders = await Order.find({});
    console.log(`📋 Checking ${orders.length} orders for blob URLs`);
    
    let fixedOrders = 0;
    for (const order of orders) {
      let needsUpdate = false;
      
      if (order.orderItems && order.orderItems.length > 0) {
        for (let i = 0; i < order.orderItems.length; i++) {
          if (order.orderItems[i].image && order.orderItems[i].image.startsWith('blob:')) {
            console.log(`  🔄 Found blob URL in order ${order._id}: ${order.orderItems[i].image}`);
            order.orderItems[i].image = '/assets/placeholder-bag-1.jpg';
            needsUpdate = true;
          }
        }
      }
      
      if (needsUpdate) {
        await order.save();
        fixedOrders++;
        console.log(`✅ Fixed order: ${order._id}`);
      }
    }
    
    console.log(`🎉 Blob URL fix completed!`);
    console.log(`📦 Fixed ${fixedProducts} products`);
    console.log(`📋 Fixed ${fixedOrders} orders`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing blob URLs:', error);
    process.exit(1);
  }
} 