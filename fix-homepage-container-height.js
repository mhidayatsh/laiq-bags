const fs = require('fs');

console.log('🔧 Adding container height fix for homepage...');

// Read the CSS file
let cssContent = fs.readFileSync('css/styles.css', 'utf8');

// Add CSS to prevent layout shifts in featured products container
const containerHeightCSS = `
/* Prevent layout shifts in featured products container */
#featured-products {
    min-height: 400px; /* Reserve space for skeleton loader */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
}

/* Ensure skeleton cards have proper dimensions */
#featured-products .animate-pulse {
    height: 400px;
    width: 100%;
}

/* Responsive grid adjustments */
@media (min-width: 640px) {
    #featured-products {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 768px) {
    #featured-products {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1024px) {
    #featured-products {
        grid-template-columns: repeat(4, 1fr);
    }
}`;

// Add the CSS to the end of the file
cssContent += containerHeightCSS;

// Write the updated CSS
fs.writeFileSync('css/styles.css', cssContent, 'utf8');

console.log('✅ Container height fix applied!');
console.log('🎯 This should completely eliminate layout shifts!');
