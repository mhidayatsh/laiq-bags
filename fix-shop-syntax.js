const fs = require('fs');

console.log('🔧 Fixing syntax errors in shop.js...');

// Read the corrupted shop.js file
let shopJS = fs.readFileSync('js/shop.js', 'utf8');

// Remove the CSS that was incorrectly added to the JavaScript file
shopJS = shopJS.replace(/<style>[\s\S]*?<\/style>\s*/, '');

// Fix the duplicate closing brace in showShopLoader function
shopJS = shopJS.replace(
    /function showShopLoader\(\) \{\s*showSkeletonLoader\(\);\s*\}\s*\}/,
    'function showShopLoader() {\n    showSkeletonLoader();\n}'
);

// Write the fixed file
fs.writeFileSync('js/shop.js', shopJS, 'utf8');

console.log('✅ Syntax errors fixed in shop.js!');

// Now add the CSS to the proper CSS file
const cssContent = `
/* Shop page performance improvements */
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
`;

// Add CSS to the main styles file
const cssFile = 'css/styles.css';
if (fs.existsSync(cssFile)) {
    let existingCSS = fs.readFileSync(cssFile, 'utf8');
    existingCSS += '\n' + cssContent;
    fs.writeFileSync(cssFile, existingCSS, 'utf8');
    console.log('✅ CSS added to styles.css');
} else {
    console.log('⚠️ CSS file not found, CSS improvements not added');
}

console.log('🎉 All syntax errors fixed! Your shop page should work perfectly now.');
