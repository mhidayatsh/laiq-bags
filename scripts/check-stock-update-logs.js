// Script to check if stock update messages are appearing in server logs
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for stock update implementation and potential issues...\n');

// Check orders.js implementation
function checkOrdersImplementation() {
  try {
    console.log('📋 Step 1: Checking orders.js implementation...');
    
    const ordersPath = path.join(__dirname, '../routes/orders.js');
    if (!fs.existsSync(ordersPath)) {
      console.log('❌ orders.js file not found');
      return false;
    }
    
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
      return true;
    } else {
      console.log('❌ Some stock update components are missing!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking orders.js:', error);
    return false;
  }
}

// Check for potential issues in the implementation
function checkForIssues() {
  try {
    console.log('\n🔍 Step 2: Checking for potential issues...');
    
    const ordersPath = path.join(__dirname, '../routes/orders.js');
    const ordersContent = fs.readFileSync(ordersPath, 'utf8');
    
    const issues = [];
    
    // Check if stock update is properly placed after order creation
    const orderCreationIndex = ordersContent.indexOf('Order.create(');
    const stockUpdateIndex = ordersContent.indexOf('Update product stock quantities');
    
    if (orderCreationIndex !== -1 && stockUpdateIndex !== -1) {
      if (stockUpdateIndex > orderCreationIndex) {
        console.log('✅ Stock update is placed after order creation');
      } else {
        issues.push('Stock update might be called before order creation');
      }
    }
    
    // Check if stock update is in a try-catch that might swallow errors
    const stockUpdateInTryCatch = ordersContent.includes('try {') && 
                                 ordersContent.includes('Update product stock quantities') &&
                                 ordersContent.includes('} catch (stockError)');
    
    if (stockUpdateInTryCatch) {
      console.log('⚠️ Stock update is in try-catch block - errors might be swallowed');
      console.log('   Check server logs for any stock update errors');
    }
    
    // Check for any syntax errors around the stock update section
    const stockUpdateSection = ordersContent.substring(
      Math.max(0, stockUpdateIndex - 500),
      Math.min(ordersContent.length, stockUpdateIndex + 500)
    );
    
    // Check for missing semicolons or brackets
    const lines = stockUpdateSection.split('\n');
    let braceCount = 0;
    let parenCount = 0;
    
    for (const line of lines) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      parenCount += (line.match(/\(/g) || []).length;
      parenCount -= (line.match(/\)/g) || []).length;
    }
    
    if (braceCount !== 0) {
      issues.push(`Unmatched braces in stock update section: ${braceCount}`);
    }
    if (parenCount !== 0) {
      issues.push(`Unmatched parentheses in stock update section: ${parenCount}`);
    }
    
    if (issues.length > 0) {
      console.log('❌ Issues found:', issues);
    } else {
      console.log('✅ No obvious issues found in implementation');
    }
    
    return issues.length === 0;
    
  } catch (error) {
    console.error('❌ Error checking for issues:', error);
    return false;
  }
}

// Check checkout.js implementation
function checkCheckoutImplementation() {
  try {
    console.log('\n🛒 Step 3: Checking checkout.js implementation...');
    
    const checkoutPath = path.join(__dirname, '../js/checkout.js');
    if (!fs.existsSync(checkoutPath)) {
      console.log('❌ checkout.js file not found');
      return false;
    }
    
    const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
    
    // Check for order data preparation
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
      return true;
    } else {
      console.log('❌ Some checkout components are missing!');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking checkout.js:', error);
    return false;
  }
}

// Provide troubleshooting steps
function provideTroubleshootingSteps() {
  console.log('\n📋 Step 4: Troubleshooting Steps...');
  console.log('\n🔍 To debug the stock update issue:');
  console.log('\n1. Check Server Logs:');
  console.log('   - Look for these messages when placing an order:');
  console.log('     📦 Validating stock availability...');
  console.log('     ✅ Stock validated for [product]: [stock] available, [quantity] requested');
  console.log('     📦 Updating product stock quantities...');
  console.log('     ✅ Stock updated for product [id]: -[quantity]');
  console.log('     ✅ All product stock quantities updated successfully');
  
  console.log('\n2. If you don\'t see these messages:');
  console.log('   - The order might not be reaching the server');
  console.log('   - There might be an authentication issue');
  console.log('   - The order creation might be failing before stock update');
  
  console.log('\n3. If you see the messages but stock isn\'t updating:');
  console.log('   - Check if the product ID is correct');
  console.log('   - Check if the quantity is a valid number');
  console.log('   - Check if there are any database connection issues');
  
  console.log('\n4. Test with a simple order:');
  console.log('   - Add one product to cart');
  console.log('   - Place a COD order');
  console.log('   - Check server logs immediately');
  console.log('   - Check product stock in admin panel');
  
  console.log('\n5. Check for errors in server logs:');
  console.log('   - Look for any error messages around order creation');
  console.log('   - Check for database connection errors');
  console.log('   - Check for authentication errors');
}

// Main function
function main() {
  console.log('🔍 Stock Update Debug Analysis\n');
  console.log('=' .repeat(50));
  
  const ordersOk = checkOrdersImplementation();
  const issuesOk = checkForIssues();
  const checkoutOk = checkCheckoutImplementation();
  
  console.log('\n📊 Summary:');
  console.log(`✅ Orders.js implementation: ${ordersOk ? 'OK' : 'Issues'}`);
  console.log(`✅ No obvious issues: ${issuesOk ? 'OK' : 'Issues'}`);
  console.log(`✅ Checkout.js implementation: ${checkoutOk ? 'OK' : 'Issues'}`);
  
  if (ordersOk && issuesOk && checkoutOk) {
    console.log('\n🎉 All implementations look correct!');
    console.log('The issue might be in the order creation process or server logs.');
    console.log('Follow the troubleshooting steps below to debug further.');
  } else {
    console.log('\n❌ Some issues found in the implementation.');
    console.log('Fix the issues above before testing stock updates.');
  }
  
  provideTroubleshootingSteps();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🔍 Debug analysis completed!');
}

main();
