const fs = require('fs');

console.log('🔧 Final CLS fix for homepage...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Replace the skeleton loading implementation with a more aggressive approach
const newSkeletonCode = `// Home Page JavaScript

// Add skeleton loader to prevent layout shift - IMMEDIATE execution
(function() {
    // Show skeleton immediately, don't wait for DOMContentLoaded
    const container = document.getElementById('featured-products');
    if (container) {
        const skeletonHTML = Array(4).fill(0).map(() => \`
            <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div class="relative">
                    <div class="w-full h-64 bg-gray-200"></div>
                    <div class="absolute top-3 left-3 w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div class="p-4">
                    <div class="h-6 bg-gray-200 rounded mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        \`).join('');
        container.innerHTML = skeletonHTML;
        console.log('🔄 Skeleton loader applied immediately');
    }
})();

// Also show skeleton on DOMContentLoaded as backup
function showHomeSkeletonLoader() {
    const container = document.getElementById('featured-products');
    if (container && container.children.length === 0) {
        const skeletonHTML = Array(4).fill(0).map(() => \`
            <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div class="relative">
                    <div class="w-full h-64 bg-gray-200"></div>
                    <div class="absolute top-3 left-3 w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div class="p-4">
                    <div class="h-6 bg-gray-200 rounded mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        \`).join('');
        container.innerHTML = skeletonHTML;
        console.log('🔄 Skeleton loader applied on DOMContentLoaded');
    }
}

// Show skeleton loader immediately when page loads
document.addEventListener('DOMContentLoaded', function() {
    showHomeSkeletonLoader();
});`;

// Replace the beginning of the file
homeJS = homeJS.replace(
    /\/\/ Home Page JavaScript\n\n\/\/ Add skeleton loader to prevent layout shift[\s\S]*?document\.addEventListener\('DOMContentLoaded', function\(\) \{\s*showHomeSkeletonLoader\(\);\s*\}\);[\s\S]*?let featuredProducts = \[\];/,
    newSkeletonCode + '\n\nlet featuredProducts = [];'
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS, 'utf8');

console.log('✅ Final CLS fix applied!');
console.log('🎯 This should eliminate layout shifts on both hard and normal refresh!');
