#!/usr/bin/env node

/**
 * LAIQ Bags Logo Consistency Verifier
 * This script verifies that all pages have consistent logo implementation
 */

const fs = require('fs');
const path = require('path');

// Files to check
const filesToCheck = [
  'index.html',
  'about.html',
  'shop.html',
  'contact.html',
  'product.html',
  'checkout.html',
  'forgot-password.html',
  'customer-login.html',
  'customer-register.html'
];

function verifyLogoConsistency(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return { status: 'missing', issues: ['File not found'] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for proper logo structure
    const expectedLogoPattern = /<h1[^>]*class="[^"]*laiq-logo[^"]*"[^>]*>\s*<span[^>]*class="[^"]*laiq-logo-text[^"]*"[^>]*aria-label="LAIQ"[^>]*>LAIQ<\/span>\s*<span[^>]*aria-label="Bags"[^>]*>Bags<\/span>\s*<\/h1>/;
    
    if (!expectedLogoPattern.test(content)) {
      issues.push('Logo structure does not match home page format');
    }

    // Check for Orbitron font import
    if (!content.includes('Orbitron')) {
      issues.push('Missing Orbitron font import');
    }

    // Check for proper CSS classes
    if (!content.includes('.laiq-logo-text')) {
      issues.push('Missing laiq-logo-text CSS class');
    }

    // Check for ARIA labels
    if (!content.includes('aria-label="LAIQ"') || !content.includes('aria-label="Bags"')) {
      issues.push('Missing ARIA labels for accessibility');
    }

    // Check for proper link structure
    if (!content.includes('aria-label="Laiq Bags - Home"')) {
      issues.push('Missing home link ARIA label');
    }

    if (issues.length === 0) {
      console.log(`✅ ${filePath} - Logo implementation is consistent`);
      return { status: 'consistent', issues: [] };
    } else {
      console.log(`❌ ${filePath} - Issues found:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      return { status: 'inconsistent', issues };
    }

  } catch (error) {
    console.error(`❌ Error checking ${filePath}:`, error.message);
    return { status: 'error', issues: [error.message] };
  }
}

function main() {
  console.log('🔍 LAIQ Bags Logo Consistency Verifier');
  console.log('=======================================\n');

  let consistentCount = 0;
  let inconsistentCount = 0;
  let errorCount = 0;
  let totalFiles = filesToCheck.length;

  filesToCheck.forEach(file => {
    const result = verifyLogoConsistency(file);
    
    switch (result.status) {
      case 'consistent':
        consistentCount++;
        break;
      case 'inconsistent':
        inconsistentCount++;
        break;
      case 'error':
        errorCount++;
        break;
    }
  });

  console.log('\n📊 Consistency Summary:');
  console.log(`✅ Consistent: ${consistentCount} files`);
  console.log(`❌ Inconsistent: ${inconsistentCount} files`);
  console.log(`⚠️  Errors: ${errorCount} files`);
  console.log(`📁 Total: ${totalFiles} files checked`);

  if (inconsistentCount === 0 && errorCount === 0) {
    console.log('\n🎉 All logo implementations are consistent!');
    console.log('\n📋 Consistency Features Verified:');
    console.log('1. ✅ Same HTML structure as home page');
    console.log('2. ✅ Orbitron font properly imported');
    console.log('3. ✅ CSS classes correctly applied');
    console.log('4. ✅ ARIA labels for accessibility');
    console.log('5. ✅ Proper semantic HTML structure');
  } else {
    console.log('\n⚠️  Some files need logo consistency fixes');
    console.log('\n📋 Recommended Actions:');
    console.log('1. Run the branding update scripts');
    console.log('2. Check individual files for issues');
    console.log('3. Ensure Orbitron font is imported');
    console.log('4. Verify ARIA labels are present');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { verifyLogoConsistency };
