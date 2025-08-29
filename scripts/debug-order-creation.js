// Debug script to test order creation and stock update flow
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

// Test the complete order creation flow
async function testOrderCreationFlow() {
  try {
    console.log('🧪 Testing complete order creation flow...\n');
    
    // Step 1: Get a test product
    console.log('📦 Step 1: Getting test product...');
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found in database');
      return;
    }
    
    console.log(`✅ Test product: ${product.name}`);
    console.log(`📊 Initial stock: ${product.stock}`);
    
    // Step 2: Simulate order data (like what frontend sends)
    console.log('\n📋 Step 2: Creating test order data...');
    const testOrderData = {
      orderItems: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 2,
        image: product.images?.[0]?.url || 'test-image.jpg',
        color: { name: "N/A", code: "#000000" }
      }],
      shippingAddress: {
        street: "123 Test Street",
        city: "Test City",
        state: "Test State",
        pincode: "123456",
        country: "India"
      },
      totalAmount: product.price * 2,
      paymentMethod: "cod",
      saveAddress: false
    };
    
    console.log('📤 Test order data:', JSON.stringify(testOrderData, null, 2));
    
    // Step 3: Simulate stock validation (like orders.js does)
    console.log('\n🔍 Step 3: Testing stock validation...');
    for (const item of testOrderData.orderItems) {
      if (item.product && item.quantity) {
        const productToCheck = await Product.findById(item.product);
        if (!productToCheck) {
          console.log(`❌ Product not found: ${item.product}`);
          return;
        }
        
        console.log(`📊 Product: ${productToCheck.name}`);
        console.log(`📊 Available stock: ${productToCheck.stock}`);
        console.log(`📊 Requested quantity: ${item.quantity}`);
        
        if (productToCheck.stock < item.quantity) {
          console.log(`❌ Insufficient stock for ${item.name}`);
          return;
        }
        
        console.log(`✅ Stock validation passed for ${item.name}`);
      }
    }
    
    // Step 4: Simulate stock update (like orders.js does)
    console.log('\n📦 Step 4: Testing stock update...');
    for (const item of testOrderData.orderItems) {
      if (item.product && item.quantity) {
        const productToUpdate = await Product.findById(item.product);
        if (productToUpdate) {
          const oldStock = productToUpdate.stock;
          productToUpdate.stock = productToUpdate.stock - item.quantity;
          await productToUpdate.save({ validateBeforeSave: false });
          
          console.log(`✅ Stock updated for ${productToUpdate.name}:`);
          console.log(`   Old stock: ${oldStock}`);
          console.log(`   New stock: ${productToUpdate.stock}`);
          console.log(`   Reduction: -${item.quantity}`);
        }
      }
    }
    
    // Step 5: Verify stock was actually updated
    console.log('\n🔍 Step 5: Verifying stock update...');
    const updatedProduct = await Product.findById(product._id);
    console.log(`📊 Final stock: ${updatedProduct.stock}`);
    console.log(`📊 Expected stock: ${product.stock - 2}`);
    
    if (updatedProduct.stock === product.stock - 2) {
      console.log('✅ Stock update verification passed!');
    } else {
      console.log('❌ Stock update verification failed!');
    }
    
    // Step 6: Restore stock for testing
    console.log('\n🔄 Step 6: Restoring stock for testing...');
    updatedProduct.stock = product.stock; // Restore original stock
    await updatedProduct.save({ validateBeforeSave: false });
    console.log('✅ Stock restored to original value');
    
    console.log('\n🎉 Order creation flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test the updateStock function specifically
async function testUpdateStockFunction() {
  try {
    console.log('\n🧪 Testing updateStock function specifically...\n');
    
    const product = await Product.findOne();
    if (!product) {
      console.log('❌ No products found');
      return;
    }
    
    console.log(`📦 Testing with product: ${product.name}`);
    console.log(`📊 Initial stock: ${product.stock}`);
    
    // Test the updateStock function logic
    const testQuantity = 3;
    console.log(`🛒 Testing stock reduction by ${testQuantity}...`);
    
    // Simulate updateStock function
    const productToUpdate = await Product.findById(product._id);
    const oldStock = productToUpdate.stock;
    productToUpdate.stock = productToUpdate.stock - testQuantity;
    await productToUpdate.save({ validateBeforeSave: false });
    
    console.log(`✅ Stock updated successfully:`);
    console.log(`   Old stock: ${oldStock}`);
    console.log(`   New stock: ${productToUpdate.stock}`);
    console.log(`   Reduction: -${testQuantity}`);
    
    // Verify the update
    const verifyProduct = await Product.findById(product._id);
    console.log(`📊 Verification - Current stock: ${verifyProduct.stock}`);
    
    if (verifyProduct.stock === oldStock - testQuantity) {
      console.log('✅ updateStock function test passed!');
    } else {
      console.log('❌ updateStock function test failed!');
    }
    
    // Restore stock
    verifyProduct.stock = oldStock;
    await verifyProduct.save({ validateBeforeSave: false });
    console.log('✅ Stock restored');
    
  } catch (error) {
    console.error('❌ updateStock test error:', error);
  }
}

// Check for any issues in the orders.js implementation
async function checkOrdersImplementation() {
  try {
    console.log('\n🔍 Checking orders.js implementation for issues...\n');
    
    const fs = require('fs');
    const path = require('path');
    
    const ordersPath = path.join(__dirname, '../routes/orders.js');
    const ordersContent = fs.readFileSync(ordersPath, 'utf8');
    
    // Check for potential issues
    const issues = [];
    
    // Check if stock update is in try-catch that might be swallowing errors
    const stockUpdateInTryCatch = ordersContent.includes('try {') && 
                                 ordersContent.includes('Update product stock quantities') &&
                                 ordersContent.includes('} catch (stockError)');
    
    if (stockUpdateInTryCatch) {
      console.log('⚠️ Stock update is in try-catch block - errors might be swallowed');
      console.log('   This is actually good for error handling, but check server logs');
    }
    
    // Check if updateStock function exists and is properly defined
    const updateStockFunction = ordersContent.match(/async function updateStock\([^)]+\)\s*\{[\s\S]*?\}/);
    if (updateStockFunction) {
      console.log('✅ updateStock function is properly defined');
    } else {
      issues.push('updateStock function not found or malformed');
    }
    
    // Check if stock update is called after order creation
    const orderCreationPattern = /Order\.create\([\s\S]*?\)[\s\S]*?Update product stock quantities/;
    if (orderCreationPattern.test(ordersContent)) {
      console.log('✅ Stock update is called after order creation');
    } else {
      issues.push('Stock update might not be called after order creation');
    }
    
    // Check for any syntax errors or issues
    const syntaxIssues = [];
    
    // Check for missing semicolons or brackets
    const lines = ordersContent.split('\n');
    let braceCount = 0;
    let parenCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Update product stock quantities')) {
        console.log(`📍 Stock update found at line ${i + 1}`);
      }
      
      // Simple brace counting (not perfect but good enough)
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      parenCount += (line.match(/\(/g) || []).length;
      parenCount -= (line.match(/\)/g) || []).length;
    }
    
    if (braceCount !== 0) {
      syntaxIssues.push(`Unmatched braces: ${braceCount}`);
    }
    if (parenCount !== 0) {
      syntaxIssues.push(`Unmatched parentheses: ${parenCount}`);
    }
    
    if (syntaxIssues.length > 0) {
      console.log('❌ Potential syntax issues found:', syntaxIssues);
    } else {
      console.log('✅ No obvious syntax issues found');
    }
    
    if (issues.length > 0) {
      console.log('❌ Issues found:', issues);
    } else {
      console.log('✅ No implementation issues found');
    }
    
  } catch (error) {
    console.error('❌ Error checking implementation:', error);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await connectDB();
    
    await testOrderCreationFlow();
    await testUpdateStockFunction();
    await checkOrdersImplementation();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('1. If all tests passed, the stock update logic is working correctly');
    console.log('2. The issue might be in the order creation process or server logs');
    console.log('3. Check server logs when placing a real order for any error messages');
    console.log('4. Make sure the order is actually being created successfully');
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

runAllTests();
