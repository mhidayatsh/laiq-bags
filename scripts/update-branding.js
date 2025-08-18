#!/usr/bin/env node

/**
 * LAIQ Bags Branding Update Script
 * This script helps update remaining HTML pages with the new logo implementation
 */

const fs = require('fs');
const path = require('path');

// Files to update with logo implementation
const filesToUpdate = [
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

// Logo implementation template
const logoImplementation = {
  head: `
    <!-- Favicon and App Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/laiq-logo.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/assets/laiq-logo.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/laiq-logo.png">
    <link rel="manifest" href="/site.webmanifest">
    
    <!-- Google Fonts: Orbitron (similar to Lucidity Expand) -->
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
    
    <!-- Social Media Meta Tags -->
    <meta property="og:title" content="Laiq Bags - Carry Style with Confidence">
    <meta property="og:description" content="Discover premium bags and accessories. Carry style with confidence.">
    <meta property="og:image" content="/assets/laiq-logo.png">
    <meta property="og:url" content="https://laiqbags.com">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Laiq Bags - Carry Style with Confidence">
    <meta name="twitter:description" content="Discover premium bags and accessories. Carry style with confidence.">
    <meta name="twitter:image" content="/assets/laiq-logo.png">`,

  styles: `
      /* Custom LAIQ Logo Font - Orbitron (similar to Lucidity Expand) */
      .laiq-logo {
        font-family: 'Orbitron', 'Montserrat', sans-serif;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      
      .laiq-logo-text {
        background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-family: 'Orbitron', 'Montserrat', sans-serif;
        font-weight: 900;
        letter-spacing: 0.05em;
      }`,

  headerLogo: `
          <!-- Logo -->
          <div class="flex items-center">
            <a href="index.html" class="flex items-center">
              <h1 class="text-2xl font-bold laiq-logo text-charcoal">
                <span class="laiq-logo-text">LAIQ</span> <span class="text-charcoal">Bags</span>
              </h1>
            </a>
          </div>`,

  footerLogo: `
            <div class="flex items-center mb-4">
              <h3 class="text-2xl font-bold laiq-logo">
                <span class="laiq-logo-text">LAIQ</span> <span class="text-white">Bags</span>
              </h3>
            </div>`
};

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update favicon links
    if (content.includes('<link rel="icon" href="/favicon.ico" />')) {
      content = content.replace(
        /<link rel="icon" href="\/favicon\.ico" \/>/g,
        logoImplementation.head
      );
      updated = true;
    }

    // Update styles section
    if (content.includes('body { font-family:') && !content.includes('.laiq-logo {')) {
      content = content.replace(
        /(body \{ font-family:.*?\})/s,
        `$1\n      ${logoImplementation.styles}`
      );
      updated = true;
    }

    // Update header logo
    if (content.includes('<span class="text-gold">Laiq</span>') && !content.includes('laiq-logo.png')) {
      content = content.replace(
        /<!-- Logo -->\s*<div class="flex items-center">\s*<h1 class="text-2xl font-bold font-montserrat text-charcoal">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h1>\s*<\/div>/s,
        logoImplementation.headerLogo
      );
      updated = true;
    }

    // Update footer logo
    if (content.includes('<span class="text-gold">Laiq</span>') && content.includes('footer') && !content.includes('laiq-logo.png')) {
      content = content.replace(
        /<h3 class="text-2xl font-bold font-montserrat mb-4">\s*<span class="text-gold">Laiq<\/span> <span class="website-name">Bags<\/span>\s*<\/h3>/s,
        logoImplementation.footerLogo
      );
      updated = true;
    }

    // Update copyright text
    if (content.includes('© 2024 <span class="text-gold">Laiq</span>')) {
      content = content.replace(
        /© 2024 <span class="text-gold">Laiq<\/span>/g,
        '© 2024 <span class="text-gold laiq-logo">Laiq</span>'
      );
      updated = true;
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
  console.log('🎨 LAIQ Bags Branding Update Script');
  console.log('=====================================\n');

  let updatedCount = 0;
  let totalFiles = filesToUpdate.length;

  filesToUpdate.forEach(file => {
    if (updateFile(file)) {
      updatedCount++;
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Updated: ${updatedCount} files`);
  console.log(`ℹ️  Skipped: ${totalFiles - updatedCount} files`);
  console.log(`📁 Total: ${totalFiles} files processed`);

  if (updatedCount > 0) {
    console.log('\n🎉 Branding update completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the updated files');
    console.log('2. Test the website to ensure everything looks correct');
    console.log('3. Update any remaining custom pages manually');
    console.log('4. Create social media assets using the logo');
  } else {
    console.log('\nℹ️  All files are already up to date with the branding!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateFile, logoImplementation };
