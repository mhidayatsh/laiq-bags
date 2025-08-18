#!/usr/bin/env node

/**
 * LAIQ Bags Footer Branding Fix Script
 * This script specifically fixes footer branding issues across all pages
 */

const fs = require('fs');
const path = require('path');

// Files to check and fix
const filesToCheck = [
  'about.html',
  'customer-login.html',
  'customer-register.html',
  'customer-profile.html',
  'forgot-password.html',
  'reset-password.html',
  'checkout.html',
  'order-confirmation.html',
  'order-management.html',
  'size-guide.html',
  'admin-login.html',
  'admin.html',
  'admin-discounts.html',
  'admin-reset-password.html'
];

function fixFooterBranding(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Fix footer logo - different patterns
    const footerPatterns = [
      // Pattern 1: Simple footer with "Laiq" text
      {
        search: /<h3 class="text-xl font-bold mb-4">\s*<span class="text-gold">Laiq<\/span> Bags\s*<\/h3>/g,
        replace: '<h3 class="text-xl font-bold laiq-logo mb-4">\n                        <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>\n                    </h3>'
      },
      // Pattern 2: Footer with different structure
      {
        search: /<h3 class="text-2xl font-bold mb-4">\s*<span class="text-gold">Laiq<\/span> Bags\s*<\/h3>/g,
        replace: '<h3 class="text-2xl font-bold laiq-logo mb-4">\n                        <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>\n                    </h3>'
      },
      // Pattern 3: Copyright text
      {
        search: /&copy; 2024 <span class="text-gold">Laiq<\/span> Bags/g,
        replace: '&copy; 2024 <span class="text-gold laiq-logo">LAIQ</span> Bags'
      },
      // Pattern 4: Simple copyright
      {
        search: /&copy; 2024 Laiq Bags/g,
        replace: '&copy; 2024 <span class="text-gold laiq-logo">LAIQ</span> Bags'
      },
      // Pattern 5: Header logo patterns
      {
        search: /<h1 class="text-3xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h1>/g,
        replace: '<h1 class="text-3xl font-bold laiq-logo text-charcoal">\n          <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>\n        </h1>'
      },
      // Pattern 6: Another header pattern
      {
        search: /<h1 class="text-2xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h1>/g,
        replace: '<h1 class="text-2xl font-bold laiq-logo text-charcoal">\n            <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>\n          </h1>'
      }
    ];

    footerPatterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        updated = true;
        console.log(`✅ Fixed pattern in ${filePath}`);
      }
    });

    // Fix font imports if missing Orbitron
    if (content.includes('Lucidity Expand') && !content.includes('Orbitron')) {
      content = content.replace(
        /<!-- Google Fonts: Poppins & Montserrat -->\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Montserrat:wght@400;600;700&family=Poppins:wght@400;500;700&display=swap" rel="stylesheet">/g,
        `<!-- Google Fonts: Poppins & Montserrat -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Poppins:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Google Fonts: Orbitron (similar to Lucidity Expand) -->
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">`
      );
      
      content = content.replace(
        /font-family: 'Lucidity Expand', 'Montserrat', sans-serif;/g,
        "font-family: 'Orbitron', 'Montserrat', sans-serif;"
      );
      
      content = content.replace(
        /font-weight: 700;/g,
        "font-weight: 900;"
      );
      
      content = content.replace(
        /letter-spacing: -0\.02em;/g,
        "letter-spacing: 0.05em;"
      );
      
      updated = true;
      console.log(`✅ Fixed font imports in ${filePath}`);
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 LAIQ Bags Footer Branding Fix Script');
  console.log('========================================\n');

  let updatedCount = 0;
  let totalFiles = filesToCheck.length;

  filesToCheck.forEach(file => {
    if (fixFooterBranding(file)) {
      updatedCount++;
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`ℹ️  Skipped: ${totalFiles - updatedCount} files`);
  console.log(`📁 Total: ${totalFiles} files processed`);

  if (updatedCount > 0) {
    console.log('\n🎉 Footer branding fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the updated files');
    console.log('2. Test the website to ensure footer branding is correct');
    console.log('3. Check that Orbitron font is loading properly');
    console.log('4. Verify "LAIQ" text displays with gold gradient');
  } else {
    console.log('\nℹ️  All files are already up to date with proper footer branding!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixFooterBranding };
