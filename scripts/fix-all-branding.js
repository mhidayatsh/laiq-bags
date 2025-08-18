#!/usr/bin/env node

/**
 * LAIQ Bags Complete Branding Fix Script
 * This script fixes ALL remaining branding issues across all pages
 */

const fs = require('fs');
const path = require('path');

// All HTML files to check
const filesToCheck = [
  'index.html',
  'about.html',
  'shop.html',
  'contact.html',
  'product.html',
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
  'admin-reset-password.html',
  'payment-success.html',
  'payment-callback.html',
  'payment-cancelled.html'
];

function fixAllBranding(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Comprehensive patterns to fix
    const brandingPatterns = [
      // Header logo patterns
      {
        search: /<h1 class="text-3xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h1>/g,
        replace: '<h1 class="text-3xl font-bold laiq-logo text-charcoal">\n          <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>\n        </h1>'
      },
      {
        search: /<h1 class="text-2xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h1>/g,
        replace: '<h1 class="text-2xl font-bold laiq-logo text-charcoal">\n            <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>\n          </h1>'
      },
      {
        search: /<h1 class="text-3xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> Bags\s*<\/h1>/g,
        replace: '<h1 class="text-3xl font-bold laiq-logo text-charcoal">\n          <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>\n        </h1>'
      },
      {
        search: /<h1 class="text-2xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> Bags\s*<\/h1>/g,
        replace: '<h1 class="text-2xl font-bold laiq-logo text-charcoal">\n            <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>\n          </h1>'
      },
      
      // Footer logo patterns
      {
        search: /<h3 class="text-xl font-bold mb-4">\s*<span class="text-gold">Laiq<\/span> Bags\s*<\/h3>/g,
        replace: '<h3 class="text-xl font-bold laiq-logo mb-4">\n                        <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>\n                    </h3>'
      },
      {
        search: /<h3 class="text-2xl font-bold mb-4">\s*<span class="text-gold">Laiq<\/span> Bags\s*<\/h3>/g,
        replace: '<h3 class="text-2xl font-bold laiq-logo mb-4">\n                        <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>\n                    </h3>'
      },
      {
        search: /<h3 class="text-xl font-bold font-montserrat mb-4">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h3>/g,
        replace: '<h3 class="text-xl font-bold laiq-logo mb-4">\n                        <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>\n                    </h3>'
      },
      {
        search: /<h3 class="text-2xl font-bold font-montserrat mb-4">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h3>/g,
        replace: '<h3 class="text-2xl font-bold laiq-logo mb-4">\n                        <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>\n                    </h3>'
      },
      
      // Copyright patterns
      {
        search: /&copy; 2024 <span class="text-gold">Laiq<\/span> Bags/g,
        replace: '&copy; 2024 <span class="text-gold laiq-logo">LAIQ</span> Bags'
      },
      {
        search: /© 2024 <span class="text-gold">Laiq<\/span> Bags/g,
        replace: '© 2024 <span class="text-gold laiq-logo">LAIQ</span> Bags'
      },
      {
        search: /&copy; 2024 <span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>/g,
        replace: '&copy; 2024 <span class="text-gold laiq-logo">LAIQ</span> <span class="website-name">Bags</span>'
      },
      {
        search: /© 2024 <span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>/g,
        replace: '© 2024 <span class="text-gold laiq-logo">LAIQ</span> <span class="website-name">Bags</span>'
      },
      
      // Simple text patterns
      {
        search: /<span class="text-gold">Laiq<\/span> Bags/g,
        replace: '<span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>'
      },
      {
        search: /<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>/g,
        replace: '<span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>'
      }
    ];

    brandingPatterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        updated = true;
        console.log(`✅ Fixed branding pattern in ${filePath}`);
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
  console.log('🎨 LAIQ Bags Complete Branding Fix Script');
  console.log('==========================================\n');

  let updatedCount = 0;
  let totalFiles = filesToCheck.length;

  filesToCheck.forEach(file => {
    if (fixAllBranding(file)) {
      updatedCount++;
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`ℹ️  Skipped: ${totalFiles - updatedCount} files`);
  console.log(`📁 Total: ${totalFiles} files processed`);

  if (updatedCount > 0) {
    console.log('\n🎉 Complete branding fix finished successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review all updated files');
    console.log('2. Test the website to ensure consistent branding');
    console.log('3. Verify "LAIQ" text displays with Orbitron font and gold gradient');
    console.log('4. Check that no CSP violations occur');
  } else {
    console.log('\nℹ️  All files are already up to date with proper branding!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixAllBranding };
