#!/usr/bin/env node

/**
 * LAIQ Bags SEO Logo Optimizer
 * This script optimizes logo implementation for better SEO
 */

const fs = require('fs');
const path = require('path');

// SEO-optimized logo patterns
const seoOptimizedLogo = {
  // Header logo with proper semantic structure
  headerLogo: `
    <div class="flex items-center">
      <a href="index.html" class="flex items-center" aria-label="Laiq Bags - Home">
        <h1 class="text-2xl font-bold laiq-logo text-charcoal">
          <span class="laiq-logo-text" aria-label="LAIQ">LAIQ</span> 
          <span class="text-charcoal" aria-label="Bags">Bags</span>
        </h1>
      </a>
    </div>`,

  // Footer logo with proper semantic structure
  footerLogo: `
    <div class="flex items-center mb-4">
      <h3 class="text-2xl font-bold laiq-logo">
        <span class="laiq-logo-text" aria-label="LAIQ">LAIQ</span> 
        <span class="text-white" aria-label="Bags">Bags</span>
      </h3>
    </div>`,

  // Copyright with proper semantic structure
  copyright: `
    <p>&copy; 2024 <span class="text-gold laiq-logo" aria-label="LAIQ">LAIQ</span> 
    <span class="website-name" aria-label="Bags">Bags</span>. All rights reserved.</p>`,

  // Enhanced CSS with better accessibility
  enhancedCSS: `
    /* SEO-Optimized LAIQ Logo Font - Orbitron */
    .laiq-logo {
      font-family: 'Orbitron', 'Montserrat', sans-serif;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      /* Ensure good contrast for accessibility */
      color: #36454f;
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
      /* Fallback for browsers that don't support background-clip */
      color: #d4af37;
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .laiq-logo-text {
        -webkit-text-fill-color: #d4af37;
        background: none;
        text-shadow: none;
      }
    }
    
    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .laiq-logo-text {
        transition: none;
      }
    }`,

  // Enhanced meta tags for better SEO
  enhancedMetaTags: `
    <!-- Enhanced SEO Meta Tags -->
    <meta name="application-name" content="Laiq Bags">
    <meta name="apple-mobile-web-app-title" content="Laiq Bags">
    <meta name="msapplication-TileColor" content="#d4af37">
    <meta name="theme-color" content="#d4af37">
    
    <!-- Structured Data for Logo -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Laiq Bags",
      "url": "https://laiqbags.com",
      "logo": "https://laiqbags.com/assets/laiq-logo.png",
      "description": "Carry Style with Confidence - Premium bags and accessories",
      "brand": {
        "@type": "Brand",
        "name": "LAIQ"
      }
    }
    </script>`
};

function optimizeLogoForSEO(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Add enhanced meta tags if not present
    if (!content.includes('application-name') && content.includes('<title>')) {
      content = content.replace(
        /<title>([^<]+)<\/title>/,
        `<title>$1</title>${seoOptimizedLogo.enhancedMetaTags}`
      );
      updated = true;
      console.log(`✅ Added enhanced meta tags to ${filePath}`);
    }

    // Update CSS with enhanced accessibility features
    if (content.includes('.laiq-logo-text') && !content.includes('prefers-contrast')) {
      content = content.replace(
        /\/\* Custom LAIQ Logo Font[^*]*\*\/[\s\S]*?\.laiq-logo-text[^}]*}/g,
        seoOptimizedLogo.enhancedCSS
      );
      updated = true;
      console.log(`✅ Enhanced CSS with accessibility features in ${filePath}`);
    }

    // Update header logos with better semantic structure
    const headerPatterns = [
      {
        search: /<div class="flex items-center">\s*<a href="index\.html" class="[^"]*">\s*<h1[^>]*>\s*<span class="laiq-logo-text">LAIQ<\/span>\s*<span[^>]*>Bags<\/span>\s*<\/h1>\s*<\/a>\s*<\/div>/g,
        replace: seoOptimizedLogo.headerLogo
      }
    ];

    headerPatterns.forEach(pattern => {
      if (pattern.search.test(content)) {
        content = content.replace(pattern.search, pattern.replace);
        updated = true;
        console.log(`✅ Enhanced header logo SEO in ${filePath}`);
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ SEO optimized: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No SEO changes needed: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error optimizing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🎯 LAIQ Bags SEO Logo Optimizer');
  console.log('================================\n');

  const filesToOptimize = [
    'index.html',
    'about.html',
    'shop.html',
    'contact.html',
    'product.html',
    'checkout.html',
    'forgot-password.html'
  ];

  let optimizedCount = 0;
  let totalFiles = filesToOptimize.length;

  filesToOptimize.forEach(file => {
    if (optimizeLogoForSEO(file)) {
      optimizedCount++;
    }
  });

  console.log('\n📊 SEO Optimization Summary:');
  console.log(`✅ Optimized: ${optimizedCount} files`);
  console.log(`ℹ️  Skipped: ${totalFiles - optimizedCount} files`);
  console.log(`📁 Total: ${totalFiles} files processed`);

  if (optimizedCount > 0) {
    console.log('\n🎉 SEO optimization completed successfully!');
    console.log('\n📋 SEO Benefits Added:');
    console.log('1. ✅ Enhanced semantic HTML structure');
    console.log('2. ✅ ARIA labels for accessibility');
    console.log('3. ✅ Structured data for search engines');
    console.log('4. ✅ High contrast mode support');
    console.log('5. ✅ Reduced motion support');
    console.log('6. ✅ Enhanced meta tags');
    console.log('7. ✅ Better color contrast');
  } else {
    console.log('\nℹ️  All files are already SEO optimized!');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { optimizeLogoForSEO, seoOptimizedLogo };
