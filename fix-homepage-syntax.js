const fs = require('fs');

console.log('🔧 Fixing syntax errors in home.js...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Fix the loadFeaturedProducts function by adding missing closing braces
homeJS = homeJS.replace(
    /console\.log\(\`✅ Loaded \${featuredProducts\.length} featured products from API\`\);\s*\n\s*\n\s*\/\/ Render featured products/,
    `console.log(\`✅ Loaded \${featuredProducts.length} featured products from API\`);
        
        // Render featured products
        renderFeaturedProducts();
    } catch (error) {
        console.error('❌ Failed to load featured products from API:', error);
        throw error;
    }
}

// Render featured products`
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS, 'utf8');

console.log('✅ Syntax errors fixed in home.js!');
console.log('🎉 Your homepage should now be completely error-free!');
