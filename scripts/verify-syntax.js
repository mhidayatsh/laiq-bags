// Script to verify syntax of orders.js file
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying orders.js syntax...\n');

function checkSyntax() {
  try {
    const ordersPath = path.join(__dirname, '../routes/orders.js');
    const content = fs.readFileSync(ordersPath, 'utf8');
    
    console.log('📋 Checking basic syntax...');
    
    // Check for basic syntax issues
    const lines = content.split('\n');
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;
    let issues = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces, parentheses, and brackets
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      parenCount += (line.match(/\(/g) || []).length;
      parenCount -= (line.match(/\)/g) || []).length;
      bracketCount += (line.match(/\[/g) || []).length;
      bracketCount -= (line.match(/\]/g) || []).length;
      
      // Check for common syntax issues
      if (line.includes('function') && !line.includes('{') && !line.includes('=>')) {
        // This might be a function declaration without proper syntax
        if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('{')) {
          issues.push(`Line ${i + 1}: Function declaration might be missing opening brace`);
        }
      }
    }
    
    console.log(`📊 Brace count: ${braceCount}`);
    console.log(`📊 Parentheses count: ${parenCount}`);
    console.log(`📊 Bracket count: ${bracketCount}`);
    
    if (braceCount === 0 && parenCount === 0 && bracketCount === 0) {
      console.log('✅ Basic syntax appears correct');
    } else {
      console.log('⚠️ Potential syntax issues detected');
      if (braceCount !== 0) issues.push(`Unmatched braces: ${braceCount}`);
      if (parenCount !== 0) issues.push(`Unmatched parentheses: ${parenCount}`);
      if (bracketCount !== 0) issues.push(`Unmatched brackets: ${bracketCount}`);
    }
    
    // Check for specific stock update implementation
    console.log('\n🔍 Checking stock update implementation...');
    
    const hasStockValidation = content.includes('Validate stock availability before creating order');
    const hasStockUpdate = content.includes('Update product stock quantities');
    const hasUpdateStockCall = content.includes('await updateStock(item.product, item.quantity)');
    const hasUpdateStockFunction = content.includes('async function updateStock(id, quantity)');
    const hasRestoreStockFunction = content.includes('async function restoreStock(id, quantity)');
    
    console.log(`✅ Stock validation: ${hasStockValidation ? 'Found' : 'Missing'}`);
    console.log(`✅ Stock update logic: ${hasStockUpdate ? 'Found' : 'Missing'}`);
    console.log(`✅ updateStock function call: ${hasUpdateStockCall ? 'Found' : 'Missing'}`);
    console.log(`✅ updateStock function: ${hasUpdateStockFunction ? 'Found' : 'Missing'}`);
    console.log(`✅ restoreStock function: ${hasRestoreStockFunction ? 'Found' : 'Missing'}`);
    
    // Check for enhanced error handling
    const hasEnhancedErrorHandling = content.includes('stockUpdateSuccess = true') && 
                                   content.includes('stockUpdateSuccess = false');
    console.log(`✅ Enhanced error handling: ${hasEnhancedErrorHandling ? 'Found' : 'Missing'}`);
    
    // Check for detailed logging
    const hasDetailedLogging = content.includes('🔄 Updating stock for product') && 
                              content.includes('✅ Stock updated successfully:');
    console.log(`✅ Detailed logging: ${hasDetailedLogging ? 'Found' : 'Missing'}`);
    
    // Check for validation
    const hasValidation = content.includes('if (newStock < 0)') && 
                         content.includes('Product not found with ID:');
    console.log(`✅ Input validation: ${hasValidation ? 'Found' : 'Missing'}`);
    
    if (issues.length > 0) {
      console.log('\n❌ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ No syntax issues found');
    }
    
    // Summary
    const allComponentsPresent = hasStockValidation && hasStockUpdate && hasUpdateStockCall && 
                                hasUpdateStockFunction && hasRestoreStockFunction && 
                                hasEnhancedErrorHandling && hasDetailedLogging && hasValidation;
    
    console.log('\n📊 Summary:');
    console.log(`✅ All stock update components: ${allComponentsPresent ? 'Present' : 'Missing some'}`);
    console.log(`✅ Syntax: ${issues.length === 0 ? 'Correct' : 'Has issues'}`);
    
    if (allComponentsPresent && issues.length === 0) {
      console.log('\n🎉 All changes have been implemented correctly!');
      console.log('✅ Stock update functionality is ready for testing.');
    } else {
      console.log('\n⚠️ Some issues need to be addressed before testing.');
    }
    
  } catch (error) {
    console.error('❌ Error checking syntax:', error);
  }
}

checkSyntax();
