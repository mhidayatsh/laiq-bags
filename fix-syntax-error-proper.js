const fs = require('fs');

console.log('🔧 Properly fixing the loadFeaturedProducts function...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Fix the loadFeaturedProducts function by adding the missing renderFeaturedProducts call
// and removing the extra closing brace
homeJS = homeJS.replace(
    /console\.log\(`✅ Loaded \${featuredProducts\.length} featured products from API`\);\s*\n\s*\/\/ Render featured products\s*\n\s*renderFeaturedProducts\(\);\s*\}\s*catch\s*\(error\)\s*\{\s*console\.error\('❌ Failed to load featured products from API:', error\);\s*throw error;\s*\}\s*\}\s*\n\s*\/\/ Simplified image handling/,
    `console.log(\`✅ Loaded \${featuredProducts.length} featured products from API\`);
        
        // Render featured products
        renderFeaturedProducts();
    } catch (error) {
        console.error('❌ Failed to load featured products from API:', error);
        throw error;
    }
}

// Simplified image handling`
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS);

console.log('✅ Syntax error properly fixed!');
console.log('🎯 Added missing renderFeaturedProducts call and removed extra brace');
