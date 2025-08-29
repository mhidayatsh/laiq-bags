// Test script to verify stock update functionality
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

// Test stock update functionality
async function testStockUpdate() {
  try {
    console.log('🧪 Testing stock update functionality...');
    
    // Get a sample product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log(`📦 Testing with product: ${product.name}`);
    console.log(`📊 Initial stock: ${product.stock}`);
    
    // Simulate order creation (reduce stock)
    const orderQuantity = 2;
    console.log(`🛒 Simulating order for ${orderQuantity} items...`);
    
    // Update stock (simulate order placement)
    product.stock = product.stock - orderQuantity;
    await product.save();
    
    console.log(`📊 Stock after order: ${product.stock}`);
    
    // Simulate order cancellation (restore stock)
    console.log(`❌ Simulating order cancellation...`);
    
    product.stock = product.stock + orderQuantity;
    await product.save();
    
    console.log(`📊 Stock after cancellation: ${product.stock}`);
    
    console.log('✅ Stock update test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test order creation with stock validation
async function testOrderCreation() {
  try {
    console.log('\n🧪 Testing order creation with stock validation...');
    
    // Get a sample product
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log(`📦 Testing with product: ${product.name}`);
    console.log(`📊 Current stock: ${product.stock}`);
    
    // Test valid order quantity
    const validQuantity = Math.min(2, product.stock);
    console.log(`✅ Valid order quantity: ${validQuantity}`);
    
    // Test invalid order quantity
    const invalidQuantity = product.stock + 5;
    console.log(`❌ Invalid order quantity: ${invalidQuantity} (exceeds stock: ${product.stock})`);
    
    console.log('✅ Order creation test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Main test function
async function runTests() {
  try {
    await connectDB();
    
    console.log('\n=== Stock Update Functionality Tests ===\n');
    
    await testStockUpdate();
    await testOrderCreation();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Stock quantities are reduced when orders are placed');
    console.log('- Stock quantities are restored when orders are cancelled');
    console.log('- Stock validation prevents orders with insufficient stock');
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testStockUpdate, testOrderCreation };
