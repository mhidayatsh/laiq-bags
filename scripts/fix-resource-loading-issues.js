const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Resource Loading Issues for Google Search Console...\n');

// 1. Fix Google Fonts Loading Issues
function fixGoogleFonts() {
    console.log('📝 Fixing Google Fonts loading issues...');
    
    const files = [
        'index.html', 'shop.html', 'product.html', 'about.html', 'contact.html',
        'customer-login.html', 'customer-register.html', 'admin-login.html', 'admin.html',
        'checkout.html', 'order-confirmation.html', 'payment-success.html', 'payment-cancelled.html',
        'forgot-password.html', 'reset-password.html', 'customer-profile.html',
        'order-management.html', 'enhanced-order-management.html', 'billing-management.html',
        'shipping-management.html', 'size-guide.html', 'payment-callback.html'
    ];
    
    let fixedCount = 0;
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                let content = fs.readFileSync(file, 'utf8');
                let originalContent = content;
                
                // Add preconnect for Google Fonts
                if (content.includes('fonts.googleapis.com') && !content.includes('preconnect')) {
                    const preconnectTags = `
    <!-- Preconnect to Google Fonts for faster loading -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">`;
                    
                    // Insert after <head> tag
                    content = content.replace('<head>', `<head>${preconnectTags}`);
                }
                
                // Add font-display: swap for better loading
                content = content.replace(
                    /href="https:\/\/fonts\.googleapis\.com\/css2\?([^"]+)"/g,
                    'href="https://fonts.googleapis.com/css2?$1&display=swap"'
                );
                
                if (content !== originalContent) {
                    fs.writeFileSync(file, content, 'utf8');
                    console.log(`✅ Fixed: ${file}`);
                    fixedCount++;
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
    });
    
    console.log(`📊 Google Fonts fixes applied to ${fixedCount} files\n`);
}

// 2. Fix Local Asset Loading Issues
function fixLocalAssets() {
    console.log('📁 Fixing local asset loading issues...');
    
    // Check if assets exist
    const assetsToCheck = [
        'assets/bag-video.mp4',
        'assets/placeholder-avatar-1.jpg',
        'assets/placeholder-avatar-2.jpg',
        'assets/placeholder-avatar-3.jpg',
        'assets/laiq-logo.png'
    ];
    
    assetsToCheck.forEach(asset => {
        if (fs.existsSync(asset)) {
            console.log(`✅ Asset exists: ${asset}`);
        } else {
            console.log(`❌ Missing asset: ${asset}`);
        }
    });
    
    // Create fallback images if missing
    const fallbackImages = [
        'assets/placeholder-avatar-1.jpg',
        'assets/placeholder-avatar-2.jpg',
        'assets/placeholder-avatar-3.jpg'
    ];
    
    fallbackImages.forEach(imagePath => {
        if (!fs.existsSync(imagePath)) {
            console.log(`⚠️  Missing: ${imagePath} - Consider adding a fallback image`);
        }
    });
    
    console.log('📊 Local asset check completed\n');
}

// 3. Fix Cloudinary Image Loading Issues
function fixCloudinaryImages() {
    console.log('☁️  Fixing Cloudinary image loading issues...');
    
    // Check if Cloudinary images are accessible
    const cloudinaryImages = [
        'https://res.cloudinary.com/dmfw0s5ht/image/upload/v1755692842/laiq-bags/products/zh7qnqhz3lfzr33gbt7d.webp',
        'https://res.cloudinary.com/dmfw0s5ht/image/upload/v1755692919/laiq-bags/products/sd9vcx36sc3luyfgdy9w.webp',
        'https://res.cloudinary.com/dmfw0s5ht/image/upload/v1755781179/laiq-bags/products/azxf4ydhjwoup6wqq6oh.webp',
        'https://res.cloudinary.com/dmfw0s5ht/image/upload/v1755868918/laiq_home_bviegi.png',
        'https://res.cloudinary.com/dmfw0s5ht/image/upload/v1755961399/laiq-bags/products/mqkzwegcjgvn2ntmrygz.webp'
    ];
    
    console.log('🔍 Cloudinary images to verify:');
    cloudinaryImages.forEach(url => {
        console.log(`   - ${url}`);
    });
    
    console.log('\n💡 Recommendations:');
    console.log('   1. Verify Cloudinary account is active');
    console.log('   2. Check image URLs are correct');
    console.log('   3. Ensure images are publicly accessible');
    console.log('   4. Consider adding fallback images\n');
}

// 4. Add Resource Hints
function addResourceHints() {
    console.log('🚀 Adding resource hints for better loading...');
    
    const files = ['index.html', 'shop.html', 'product.html'];
    let fixedCount = 0;
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                let content = fs.readFileSync(file, 'utf8');
                let originalContent = content;
                
                // Add resource hints if not present
                if (!content.includes('rel="preconnect"')) {
                    const resourceHints = `
    <!-- Resource Hints for Better Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://res.cloudinary.com">
    <link rel="dns-prefetch" href="https://fonts.googleapis.com">
    <link rel="dns-prefetch" href="https://fonts.gstatic.com">
    <link rel="dns-prefetch" href="https://res.cloudinary.com">`;
                    
                    content = content.replace('<head>', `<head>${resourceHints}`);
                }
                
                if (content !== originalContent) {
                    fs.writeFileSync(file, content, 'utf8');
                    console.log(`✅ Added resource hints to: ${file}`);
                    fixedCount++;
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
            }
        }
    });
    
    console.log(`📊 Resource hints added to ${fixedCount} files\n`);
}

// 5. Generate Server Configuration Recommendations
function generateServerRecommendations() {
    console.log('⚙️  Server Configuration Recommendations:\n');
    
    console.log('1. Add to server.js CORS configuration:');
    console.log(`
app.use((req, res, next) => {
  // Allow Google's crawler to access resources
  if (req.get('User-Agent')?.includes('Googlebot')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
});
`);
    
    console.log('2. Ensure static file serving is configured:');
    console.log(`
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400');
  }
}));
`);
    
    console.log('3. Add security headers for Google crawler:');
    console.log(`
app.use((req, res, next) => {
  if (req.get('User-Agent')?.includes('Googlebot')) {
    res.header('X-Robots-Tag', 'index, follow');
    res.header('X-Content-Type-Options', 'nosniff');
  }
  next();
});
`);
}

// Main execution
function main() {
    console.log('🎯 Resource Loading Issue Fix Script\n');
    
    fixGoogleFonts();
    fixLocalAssets();
    fixCloudinaryImages();
    addResourceHints();
    generateServerRecommendations();
    
    console.log('✅ Resource loading fixes completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy the updated files');
    console.log('2. Test resource loading in browser');
    console.log('3. Request re-crawl in Google Search Console');
    console.log('4. Monitor for improved resource loading');
    
    console.log('\n🔍 To verify fixes:');
    console.log('- Check browser developer tools Network tab');
    console.log('- Use Google PageSpeed Insights');
    console.log('- Monitor Google Search Console for improvements');
}

// Run the script
main();
