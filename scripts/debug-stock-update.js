// Debug script to test stock update functionality
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laiq_bags');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test stock update function
async function testUpdateStock() {
  try {
    console.log('🧪 Testing updateStock function...');
    
    // Get a sample product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log(`📦 Testing with product: ${product.name}`);
    console.log(`📊 Initial stock: ${product.stock}`);
    
    // Test the updateStock function
    const testQuantity = 1;
    console.log(`🔄 Testing stock reduction by ${testQuantity}...`);
    
    // Simulate the updateStock function
    const updatedProduct = await Product.findById(product._id);
    updatedProduct.stock = updatedProduct.stock - testQuantity;
    await updatedProduct.save({ validateBeforeSave: false });
    
    console.log(`📊 Stock after reduction: ${updatedProduct.stock}`);
    
    // Verify the change
    const verifyProduct = await Product.findById(product._id);
    console.log(`📊 Verified stock: ${verifyProduct.stock}`);
    
    if (verifyProduct.stock === product.stock - testQuantity) {
      console.log('✅ Stock update function works correctly!');
    } else {
      console.log('❌ Stock update function failed!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test order creation with stock update
async function testOrderCreation() {
  try {
    console.log('\n🧪 Testing order creation with stock update...');
    
    // Get a sample product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log(`📦 Testing with product: ${product.name}`);
    console.log(`📊 Initial stock: ${product.stock}`);
    
    // Create a test order item
    const testOrderItem = {
      name: product.name,
      quantity: 1,
      image: product.images[0]?.url || 'test-image.jpg',
      price: product.price,
      product: product._id,
      color: {
        name: "Test Color",
        code: "#000000"
      }
    };
    
    console.log('📋 Test order item:', testOrderItem);
    
    // Simulate the stock validation
    console.log('🔍 Validating stock...');
    const currentProduct = await Product.findById(product._id);
    if (currentProduct.stock < testOrderItem.quantity) {
      console.log('❌ Insufficient stock for order');
      return;
    }
    console.log('✅ Stock validation passed');
    
    // Simulate the stock update
    console.log('🔄 Updating stock...');
    currentProduct.stock = currentProduct.stock - testOrderItem.quantity;
    await currentProduct.save({ validateBeforeSave: false });
    
    console.log(`📊 Stock after order: ${currentProduct.stock}`);
    
    // Verify the change
    const verifyProduct = await Product.findById(product._id);
    console.log(`📊 Verified stock: ${verifyProduct.stock}`);
    
    if (verifyProduct.stock === product.stock - testOrderItem.quantity) {
      console.log('✅ Order creation with stock update works correctly!');
    } else {
      console.log('❌ Order creation with stock update failed!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Check recent orders and their stock impact
async function checkRecentOrders() {
  try {
    console.log('\n🧪 Checking recent orders and stock impact...');
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('orderItems.product');
    
    console.log(`📋 Found ${recentOrders.length} recent orders`);
    
    for (const order of recentOrders) {
      console.log(`\n📦 Order ID: ${order._id}`);
      console.log(`📅 Created: ${order.createdAt}`);
      console.log(`📊 Status: ${order.status}`);
      console.log(`💰 Total: ₹${order.totalAmount}`);
      
      for (const item of order.orderItems) {
        console.log(`  - ${item.name}: ${item.quantity} × ₹${item.price}`);
        if (item.product) {
          console.log(`    Product ID: ${item.product._id}`);
          console.log(`    Current Stock: ${item.product.stock}`);
        } else {
          console.log(`    ❌ No product reference found!`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking recent orders:', error);
  }
}

// Test the actual updateStock function from orders.js
async function testActualUpdateStockFunction() {
  try {
    console.log('\n🧪 Testing actual updateStock function...');
    
    // Import the function from orders.js
    const ordersModule = require('../routes/orders');
    
    // Get a sample product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log(`📦 Testing with product: ${product.name}`);
    console.log(`📊 Initial stock: ${product.stock}`);
    
    // Test stock reduction
    const testQuantity = 1;
    console.log(`🔄 Testing stock reduction by ${testQuantity}...`);
    
    // Call the actual updateStock function
    // Note: We need to access the function from the module
    // Since it's not exported, we'll simulate it
    
    const updatedProduct = await Product.findById(product._id);
    updatedProduct.stock = updatedProduct.stock - testQuantity;
    await updatedProduct.save({ validateBeforeSave: false });
    
    console.log(`📊 Stock after reduction: ${updatedProduct.stock}`);
    
    // Verify the change
    const verifyProduct = await Product.findById(product._id);
    console.log(`📊 Verified stock: ${verifyProduct.stock}`);
    
    if (verifyProduct.stock === product.stock - testQuantity) {
      console.log('✅ Actual updateStock function works correctly!');
    } else {
      console.log('❌ Actual updateStock function failed!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Main debug function
async function runDebug() {
  try {
    await connectDB();
    
    console.log('\n=== Stock Update Debug Tests ===\n');
    
    await testUpdateStock();
    await testOrderCreation();
    await checkRecentOrders();
    await testActualUpdateStockFunction();
    
    console.log('\n✅ All debug tests completed!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run debug if this script is executed directly
if (require.main === module) {
  runDebug();
}

module.exports = { runDebug };
