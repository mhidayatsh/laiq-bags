const fs = require('fs');

console.log('🔧 Fixing CSS conflict that caused image display issues...');

// Read the CSS file
let cssContent = fs.readFileSync('css/styles.css', 'utf8');

// Remove the conflicting CSS that overrides the HTML grid classes
cssContent = cssContent.replace(
    /\/\* Prevent layout shifts in featured products container \*\/\s*#featured-products\s*\{\s*min-height:\s*400px;\s*\/\* Reserve space for skeleton loader \*\/\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(280px,\s*1fr\)\);\s*gap:\s*2rem;\s*\}\s*\/\* Ensure skeleton cards have proper dimensions \*\/\s*#featured-products\s*\.animate-pulse\s*\{\s*height:\s*400px;\s*width:\s*100%;\s*\}\s*\/\* Responsive grid adjustments \*\/\s*@media\s*\(min-width:\s*640px\)\s*\{\s*#featured-products\s*\{\s*grid-template-columns:\s*repeat\(2,\s*1fr\);\s*\}\s*\}\s*@media\s*\(min-width:\s*768px\)\s*\{\s*#featured-products\s*\{\s*grid-template-columns:\s*repeat\(3,\s*1fr\);\s*\}\s*\}\s*@media\s*\(min-width:\s*1024px\)\s*\{\s*#featured-products\s*\{\s*grid-template-columns:\s*repeat\(4,\s*1fr\);\s*\}\s*\}/s,
    `/* Prevent layout shifts in featured products container */
#featured-products {
    min-height: 400px; /* Reserve space for skeleton loader */
}

/* Ensure skeleton cards have proper dimensions */
#featured-products .animate-pulse {
    height: 400px;
    width: 100%;
}`
);

// Write the fixed CSS
fs.writeFileSync('css/styles.css', cssContent, 'utf8');

console.log('✅ CSS conflict fixed!');
console.log('🎯 Images should now display properly!');
