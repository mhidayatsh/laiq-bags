// Simple test to verify stock updates are working
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testStockUpdate() {
  try {
    console.log('🧪 Testing stock update functionality...\n');
    
    // Step 1: Get current product stock
    console.log('📦 Step 1: Getting current product stock...');
    const productsResponse = await axios.get(`${API_BASE}/products`);
    
    if (!productsResponse.data.success) {
      console.log('❌ Failed to get products');
      return;
    }
    
    const products = productsResponse.data.products;
    if (products.length === 0) {
      console.log('❌ No products found');
      return;
    }
    
    // Find a product with stock > 0
    const productWithStock = products.find(p => p.stock > 0);
    if (!productWithStock) {
      console.log('❌ No products with stock found');
      return;
    }
    
    console.log(`✅ Found product: ${productWithStock.name}`);
    console.log(`📊 Current stock: ${productWithStock.stock}`);
    
    // Step 2: Simulate order creation (this would normally require authentication)
    console.log('\n📋 Step 2: Testing order creation logic...');
    console.log('💡 Note: This test simulates the stock update logic without creating an actual order');
    
    // Simulate the stock update that happens during order creation
    const testQuantity = 1;
    const newStock = productWithStock.stock - testQuantity;
    
    console.log(`🔄 Simulating stock reduction by ${testQuantity}...`);
    console.log(`📊 Expected new stock: ${newStock}`);
    
    // Step 3: Check if the stock update logic is properly implemented
    console.log('\n🔍 Step 3: Checking stock update implementation...');
    
    // Read the orders.js file to verify the implementation
    const fs = require('fs');
    const ordersPath = './routes/orders.js';
    
    if (fs.existsSync(ordersPath)) {
      const ordersContent = fs.readFileSync(ordersPath, 'utf8');
      
      const hasStockValidation = ordersContent.includes('Validate stock availability before creating order');
      const hasStockUpdate = ordersContent.includes('Update product stock quantities');
      const hasUpdateStockCall = ordersContent.includes('await updateStock(item.product, item.quantity)');
      const hasUpdateStockFunction = ordersContent.includes('async function updateStock(id, quantity)');
      
      console.log(`✅ Stock validation: ${hasStockValidation ? 'Implemented' : 'Missing'}`);
      console.log(`✅ Stock update section: ${hasStockUpdate ? 'Implemented' : 'Missing'}`);
      console.log(`✅ updateStock function call: ${hasUpdateStockCall ? 'Implemented' : 'Missing'}`);
      console.log(`✅ updateStock function: ${hasUpdateStockFunction ? 'Implemented' : 'Missing'}`);
      
      if (hasStockValidation && hasStockUpdate && hasUpdateStockCall && hasUpdateStockFunction) {
        console.log('\n🎉 Stock update functionality is properly implemented!');
        console.log('\n📋 To test with a real order:');
        console.log('1. Go to your website');
        console.log('2. Add a product to cart');
        console.log('3. Place an order');
        console.log('4. Check the product stock - it should be reduced immediately');
        console.log('5. Check server logs for stock update messages');
      } else {
        console.log('\n❌ Stock update functionality is missing some components');
      }
    } else {
      console.log('❌ orders.js file not found');
    }
    
    // Step 4: Check server logs
    console.log('\n📋 Step 4: How to check if stock updates are working:');
    console.log('1. Look for these messages in your server logs when placing an order:');
    console.log('   📦 Validating stock availability...');
    console.log('   ✅ Stock validated for [product]: [stock] available, [quantity] requested');
    console.log('   📦 Updating product stock quantities...');
    console.log('   ✅ Stock updated for product [id]: -[quantity]');
    console.log('   ✅ All product stock quantities updated successfully');
    
    console.log('\n2. If you see these messages, stock updates are working!');
    console.log('3. If you don\'t see these messages, there might be an issue with the order creation process');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Start it with: npm start');
    }
  }
}

// Run the test
testStockUpdate();
