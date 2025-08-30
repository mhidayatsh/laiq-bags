// Fix for Shop Page Performance - Reduce Cumulative Layout Shift (CLS)
const fs = require('fs');

console.log('🔧 Fixing shop page performance to reduce CLS...');

// Read the shop.js file
let shopJS = fs.readFileSync('js/shop.js', 'utf8');

// Fix 1: Add proper image dimensions to prevent layout shift
shopJS = shopJS.replace(
    /<img src="([^"]*)" alt="([^"]*)" loading="lazy" decoding="async" fetchpriority="low"/g,
    '<img src="$1" alt="$2" loading="lazy" decoding="async" fetchpriority="low" width="400" height="256"'
);

// Fix 2: Add skeleton loading state to prevent layout shift
const skeletonLoader = `
// Add skeleton loader to prevent layout shift
function showSkeletonLoader() {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        const skeletonHTML = Array(8).fill(0).map(() => \`
            <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div class="relative">
                    <div class="w-full h-64 bg-gray-200"></div>
                    <div class="absolute top-3 right-3 w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div class="p-4">
                    <div class="h-6 bg-gray-200 rounded mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        \`).join('');
        productsGrid.innerHTML = skeletonHTML;
    }
}

// Show skeleton loader immediately when page loads
document.addEventListener('DOMContentLoaded', function() {
    showSkeletonLoader();
});
`;

// Insert skeleton loader at the beginning
shopJS = shopJS.replace(
    '// Shop Page JavaScript',
    '// Shop Page JavaScript\n' + skeletonLoader
);

// Fix 3: Update the showShopLoader function to use skeleton
shopJS = shopJS.replace(
    /function showShopLoader\(\) \{[\s\S]*?\}/,
    `function showShopLoader() {
    showSkeletonLoader();
}`
);

// Fix 4: Add CSS for better image loading
const cssFix = `
<style>
/* Prevent layout shift for product images */
.product-image-container {
    aspect-ratio: 5/4;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

/* Skeleton animation */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
`;

// Add CSS to the beginning of the file
shopJS = cssFix + '\n' + shopJS;

// Write the updated file
fs.writeFileSync('js/shop.js', shopJS, 'utf8');

console.log('✅ Shop page performance fixes applied!');
console.log('📊 Expected improvements:');
console.log('   - Reduced CLS (Cumulative Layout Shift)');
console.log('   - Better loading experience');
console.log('   - Skeleton loading states');
console.log('   - Proper image dimensions');

console.log('\n🔄 Please restart your server to see the improvements!');
