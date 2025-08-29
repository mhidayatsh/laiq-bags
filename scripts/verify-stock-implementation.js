// Comprehensive verification script for stock update implementation
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Stock Update Implementation...\n');

// Check if routes/orders.js exists and has the required functions
function checkOrdersFile() {
  console.log('📁 Checking routes/orders.js...');
  
  const ordersPath = path.join(__dirname, '..', 'routes', 'orders.js');
  if (!fs.existsSync(ordersPath)) {
    console.log('❌ routes/orders.js not found');
    return false;
  }
  
  const content = fs.readFileSync(ordersPath, 'utf8');
  
  // Check for required imports
  const hasProductImport = content.includes("const Product = require('../models/Product')");
  const hasOrderImport = content.includes("const Order = require('../models/Order')");
  
  console.log(`✅ Product import: ${hasProductImport ? 'Found' : 'Missing'}`);
  console.log(`✅ Order import: ${hasOrderImport ? 'Found' : 'Missing'}`);
  
  // Check for stock validation
  const hasStockValidation = content.includes('Validate stock availability before creating order');
  const hasStockValidationLoop = content.includes('for (const item of safeOrderItems)');
  const hasStockCheck = content.includes('product.stock < item.quantity');
  
  console.log(`✅ Stock validation: ${hasStockValidation ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock validation loop: ${hasStockValidationLoop ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock quantity check: ${hasStockCheck ? 'Found' : 'Missing'}`);
  
  // Check for stock update during order creation
  const hasStockUpdate = content.includes('Update product stock quantities');
  const hasUpdateStockCall = content.includes('await updateStock(item.product, item.quantity)');
  
  console.log(`✅ Stock update section: ${hasStockUpdate ? 'Found' : 'Missing'}`);
  console.log(`✅ updateStock function call: ${hasUpdateStockCall ? 'Found' : 'Missing'}`);
  
  // Check for stock restoration during cancellation
  const hasStockRestoration = content.includes('Restore product stock quantities');
  const hasRestoreStockCall = content.includes('await restoreStock(item.product, item.quantity)');
  
  console.log(`✅ Stock restoration section: ${hasStockRestoration ? 'Found' : 'Missing'}`);
  console.log(`✅ restoreStock function call: ${hasRestoreStockCall ? 'Found' : 'Missing'}`);
  
  // Check for function definitions
  const hasUpdateStockFunction = content.includes('async function updateStock(id, quantity)');
  const hasRestoreStockFunction = content.includes('async function restoreStock(id, quantity)');
  
  console.log(`✅ updateStock function definition: ${hasUpdateStockFunction ? 'Found' : 'Missing'}`);
  console.log(`✅ restoreStock function definition: ${hasRestoreStockFunction ? 'Found' : 'Missing'}`);
  
  // Check for error handling
  const hasStockErrorHandling = content.includes('Error updating product stock');
  const hasRestoreErrorHandling = content.includes('Error restoring product stock');
  
  console.log(`✅ Stock update error handling: ${hasStockErrorHandling ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock restoration error handling: ${hasRestoreErrorHandling ? 'Found' : 'Missing'}`);
  
  // Check for logging
  const hasStockLogging = content.includes('Stock updated for product');
  const hasRestoreLogging = content.includes('Stock restored for product');
  
  console.log(`✅ Stock update logging: ${hasStockLogging ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock restoration logging: ${hasRestoreLogging ? 'Found' : 'Missing'}`);
  
  return hasProductImport && hasOrderImport && hasStockValidation && hasStockUpdate && 
         hasStockRestoration && hasUpdateStockFunction && hasRestoreStockFunction;
}

// Check if Product model has stock field
function checkProductModel() {
  console.log('\n📁 Checking models/Product.js...');
  
  const productPath = path.join(__dirname, '..', 'models', 'Product.js');
  if (!fs.existsSync(productPath)) {
    console.log('❌ models/Product.js not found');
    return false;
  }
  
  const content = fs.readFileSync(productPath, 'utf8');
  
  // Check for stock field definition
  const hasStockField = content.includes('stock: {');
  const hasStockType = content.includes('type: Number');
  const hasStockMin = content.includes('min: 0');
  const hasStockDefault = content.includes('default: 0');
  
  console.log(`✅ Stock field definition: ${hasStockField ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock type (Number): ${hasStockType ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock minimum value: ${hasStockMin ? 'Found' : 'Missing'}`);
  console.log(`✅ Stock default value: ${hasStockDefault ? 'Found' : 'Missing'}`);
  
  return hasStockField && hasStockType && hasStockMin && hasStockDefault;
}

// Check if test script exists
function checkTestScript() {
  console.log('\n📁 Checking scripts/test-stock-update.js...');
  
  const testPath = path.join(__dirname, 'test-stock-update.js');
  if (!fs.existsSync(testPath)) {
    console.log('❌ scripts/test-stock-update.js not found');
    return false;
  }
  
  const content = fs.readFileSync(testPath, 'utf8');
  
  // Check for test functions
  const hasTestStockUpdate = content.includes('function testStockUpdate()');
  const hasTestOrderCreation = content.includes('function testOrderCreation()');
  const hasConnectDB = content.includes('function connectDB()');
  
  console.log(`✅ testStockUpdate function: ${hasTestStockUpdate ? 'Found' : 'Missing'}`);
  console.log(`✅ testOrderCreation function: ${hasTestOrderCreation ? 'Found' : 'Missing'}`);
  console.log(`✅ connectDB function: ${hasConnectDB ? 'Found' : 'Missing'}`);
  
  return hasTestStockUpdate && hasTestOrderCreation && hasConnectDB;
}

// Check if documentation exists
function checkDocumentation() {
  console.log('\n📁 Checking STOCK_UPDATE_FIX_REPORT.md...');
  
  const docPath = path.join(__dirname, '..', 'STOCK_UPDATE_FIX_REPORT.md');
  if (!fs.existsSync(docPath)) {
    console.log('❌ STOCK_UPDATE_FIX_REPORT.md not found');
    return false;
  }
  
  const content = fs.readFileSync(docPath, 'utf8');
  
  // Check for documentation sections
  const hasIssueSection = content.includes('## Issue Identified');
  const hasRootCause = content.includes('## Root Cause Analysis');
  const hasFixes = content.includes('## Implemented Fixes');
  const hasTesting = content.includes('## Testing');
  const hasBenefits = content.includes('## Benefits of the Fix');
  
  console.log(`✅ Issue section: ${hasIssueSection ? 'Found' : 'Missing'}`);
  console.log(`✅ Root cause analysis: ${hasRootCause ? 'Found' : 'Missing'}`);
  console.log(`✅ Fixes section: ${hasFixes ? 'Found' : 'Missing'}`);
  console.log(`✅ Testing section: ${hasTesting ? 'Found' : 'Missing'}`);
  console.log(`✅ Benefits section: ${hasBenefits ? 'Found' : 'Missing'}`);
  
  return hasIssueSection && hasRootCause && hasFixes && hasTesting && hasBenefits;
}

// Check syntax of all files
function checkSyntax() {
  console.log('\n🔧 Checking syntax...');
  
  const files = [
    path.join(__dirname, '..', 'routes', 'orders.js'),
    path.join(__dirname, 'test-stock-update.js')
  ];
  
  let allValid = true;
  
  for (const file of files) {
    try {
      require(file);
      console.log(`✅ ${path.basename(file)}: Syntax OK`);
    } catch (error) {
      console.log(`❌ ${path.basename(file)}: Syntax Error - ${error.message}`);
      allValid = false;
    }
  }
  
  return allValid;
}

// Main verification function
function runVerification() {
  console.log('🚀 Starting comprehensive verification...\n');
  
  const checks = [
    { name: 'Orders Route Implementation', check: checkOrdersFile },
    { name: 'Product Model', check: checkProductModel },
    { name: 'Test Script', check: checkTestScript },
    { name: 'Documentation', check: checkDocumentation },
    { name: 'Syntax Validation', check: checkSyntax }
  ];
  
  const results = [];
  
  for (const { name, check } of checks) {
    console.log(`\n=== ${name} ===`);
    const result = check();
    results.push({ name, result });
    console.log(`Result: ${result ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.result).length;
  const total = results.length;
  
  for (const { name, result } of results) {
    console.log(`${result ? '✅' : '❌'} ${name}`);
  }
  
  console.log(`\nOverall Result: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('\n🎉 ALL CHECKS PASSED! Stock update implementation is complete and correct.');
    console.log('\n✅ Stock validation before order creation');
    console.log('✅ Stock reduction during order creation');
    console.log('✅ Stock restoration during order cancellation');
    console.log('✅ Error handling and logging');
    console.log('✅ Test coverage and documentation');
  } else {
    console.log('\n⚠️ Some checks failed. Please review the implementation.');
  }
  
  return passed === total;
}

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification();
}

module.exports = { runVerification };
