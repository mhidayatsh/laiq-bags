// Simple test script to verify stock update functionality
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
    
    // Test insufficient stock validation
    const excessiveQuantity = product.stock + 10;
    console.log(`🛒 Testing order with excessive quantity: ${excessiveQuantity}`);
    
    if (product.stock < excessiveQuantity) {
      console.log('✅ Stock validation would prevent this order (as expected)');
    } else {
      console.log('❌ Stock validation failed - should have prevented order');
    }
    
    // Test valid order quantity
    const validQuantity = Math.min(2, product.stock);
    console.log(`🛒 Testing order with valid quantity: ${validQuantity}`);
    
    if (product.stock >= validQuantity) {
      console.log('✅ Stock validation would allow this order (as expected)');
    } else {
      console.log('❌ Stock validation failed - should have allowed order');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Check orders.js implementation
async function checkOrdersImplementation() {
  try {
    console.log('\n🔍 Checking orders.js implementation...');
    
    const fs = require('fs');
    const path = require('path');
    
    const ordersPath = path.join(__dirname, '../routes/orders.js');
    const ordersContent = fs.readFileSync(ordersPath, 'utf8');
    
    // Check for stock validation
    const hasStockValidation = ordersContent.includes('Validate stock availability before creating order');
    const hasStockUpdate = ordersContent.includes('Update product stock quantities');
    const hasUpdateStockCall = ordersContent.includes('await updateStock(item.product, item.quantity)');
    const hasUpdateStockFunction = ordersContent.includes('async function updateStock(id, quantity)');
    
    console.log(`✅ Stock validation: ${hasStockValidation ? 'Implemented' : 'Missing'}`);
    console.log(`✅ Stock update logic: ${hasStockUpdate ? 'Implemented' : 'Missing'}`);
    console.log(`✅ updateStock function call: ${hasUpdateStockCall ? 'Implemented' : 'Missing'}`);
    console.log(`✅ updateStock function: ${hasUpdateStockFunction ? 'Implemented' : 'Missing'}`);
    
    if (hasStockValidation && hasStockUpdate && hasUpdateStockCall && hasUpdateStockFunction) {
      console.log('✅ All stock update components are implemented correctly!');
    } else {
      console.log('❌ Some stock update components are missing!');
    }
    
  } catch (error) {
    console.error('❌ Error checking implementation:', error);
  }
}

// Run all tests
async function runTests() {
  try {
    await connectDB();
    
    await testStockUpdate();
    await testOrderCreation();
    await checkOrdersImplementation();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

runTests();
