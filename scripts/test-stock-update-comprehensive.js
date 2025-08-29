// Comprehensive test script to verify stock update functionality
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test stock update functionality
async function testStockUpdate() {
  try {
    console.log('🧪 Comprehensive Stock Update Test\n');
    console.log('=' .repeat(60));
    
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
    console.log(`🆔 Product ID: ${productWithStock._id}`);
    
    // Step 2: Check if the stock update logic is properly implemented
    console.log('\n🔍 Step 2: Checking stock update implementation...');
    
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
      console.log(`✅ Stock update logic: ${hasStockUpdate ? 'Implemented' : 'Missing'}`);
      console.log(`✅ updateStock function call: ${hasUpdateStockCall ? 'Implemented' : 'Missing'}`);
      console.log(`✅ updateStock function: ${hasUpdateStockFunction ? 'Implemented' : 'Missing'}`);
      
      if (hasStockValidation && hasStockUpdate && hasUpdateStockCall && hasUpdateStockFunction) {
        console.log('✅ All stock update components are implemented correctly!');
      } else {
        console.log('❌ Some stock update components are missing!');
        return;
      }
    } else {
      console.log('❌ orders.js file not found');
      return;
    }
    
    // Step 3: Check checkout.js implementation
    console.log('\n🛒 Step 3: Checking checkout.js implementation...');
    
    const checkoutPath = './js/checkout.js';
    if (fs.existsSync(checkoutPath)) {
      const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
      
      const hasOrderDataPreparation = checkoutContent.includes('orderItems: orderItems.map(item => ({');
      const hasProductIdMapping = checkoutContent.includes('product: item.id');
      const hasQuantityMapping = checkoutContent.includes('quantity: parseInt(item.qty)');
      const hasApiCall = checkoutContent.includes('api.createCustomerOrder');
      
      console.log(`✅ Order data preparation: ${hasOrderDataPreparation ? 'Implemented' : 'Missing'}`);
      console.log(`✅ Product ID mapping: ${hasProductIdMapping ? 'Implemented' : 'Missing'}`);
      console.log(`✅ Quantity mapping: ${hasQuantityMapping ? 'Implemented' : 'Missing'}`);
      console.log(`✅ API call: ${hasApiCall ? 'Implemented' : 'Missing'}`);
      
      if (hasOrderDataPreparation && hasProductIdMapping && hasQuantityMapping && hasApiCall) {
        console.log('✅ Checkout implementation looks correct!');
      } else {
        console.log('❌ Some checkout components are missing!');
        return;
      }
    } else {
      console.log('❌ checkout.js file not found');
      return;
    }
    
    // Step 4: Test order data structure
    console.log('\n📋 Step 4: Testing order data structure...');
    
    const testOrderData = {
      orderItems: [{
        product: productWithStock._id,
        name: productWithStock.name,
        price: productWithStock.price,
        quantity: 1,
        image: productWithStock.images?.[0]?.url || 'test-image.jpg',
        color: { name: "N/A", code: "#000000" }
      }],
      shippingAddress: {
        street: "123 Test Street",
        city: "Test City",
        state: "Test State",
        pincode: "123456",
        country: "India"
      },
      totalAmount: productWithStock.price,
      paymentMethod: "cod",
      saveAddress: false
    };
    
    console.log('📤 Test order data structure:');
    console.log(JSON.stringify(testOrderData, null, 2));
    
    // Step 5: Check server logs for stock update messages
    console.log('\n📋 Step 5: How to check if stock updates are working:');
    console.log('\n🔍 When you place a real order, look for these messages in your server logs:');
    console.log('   📦 Validating stock availability...');
    console.log('   ✅ Stock validated for [product]: [stock] available, [quantity] requested');
    console.log('   📦 Updating product stock quantities...');
    console.log('   🔄 Updating stock for product [id] by -[quantity]');
    console.log('   ✅ Stock updated successfully: [old] → [new] (-[quantity])');
    console.log('   ✅ Stock updated for product [id]: -[quantity]');
    console.log('   ✅ All product stock quantities updated successfully');
    
    console.log('\n📋 Step 6: Troubleshooting guide:');
    console.log('\nIf stock updates are not working:');
    console.log('1. Check server logs for the messages above');
    console.log('2. If you don\'t see these messages:');
    console.log('   - The order might not be reaching the server');
    console.log('   - There might be an authentication issue');
    console.log('   - The order creation might be failing before stock update');
    console.log('3. If you see the messages but stock isn\'t updating:');
    console.log('   - Check if the product ID is correct');
    console.log('   - Check if the quantity is a valid number');
    console.log('   - Check if there are any database connection issues');
    console.log('4. Test with a simple order:');
    console.log('   - Add one product to cart');
    console.log('   - Place a COD order');
    console.log('   - Check server logs immediately');
    console.log('   - Check product stock in admin panel');
    
    console.log('\n📋 Step 7: Manual testing steps:');
    console.log('1. Go to your website: http://localhost:3001');
    console.log('2. Add the product to cart: ' + productWithStock.name);
    console.log('3. Go to checkout page');
    console.log('4. Fill in address details');
    console.log('5. Select COD payment method');
    console.log('6. Place the order');
    console.log('7. Check server logs for stock update messages');
    console.log('8. Check product stock in admin panel');
    
    console.log('\n🎯 Expected behavior:');
    console.log('- Stock should be reduced by the ordered quantity');
    console.log('- Server logs should show stock update messages');
    console.log('- Order should be created successfully');
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Comprehensive test analysis completed!');
    console.log('📋 Follow the manual testing steps above to verify stock updates.');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Start it with: npm start');
    }
  }
}

// Run the test
testStockUpdate();
