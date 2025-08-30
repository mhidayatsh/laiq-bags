const fs = require('fs');

console.log('🔧 Fixing syntax error in home.js...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Fix the loadFeaturedProducts function by adding missing closing braces
homeJS = homeJS.replace(
    /console\.log\(\`✅ Loaded \${featuredProducts\.length} featured products from API\`\);\s*\n\s*\n\s*\/\/ Enhanced image loading handler/,
    `console.log(\`✅ Loaded \${featuredProducts.length} featured products from API\`);
        
        // Render featured products
        renderFeaturedProducts();
    } catch (error) {
        console.error('❌ Failed to load featured products from API:', error);
        throw error;
    }
}

// Enhanced image loading handler`
);

// Fix the renderFeaturedProducts function by adding missing closing brace
homeJS = homeJS.replace(
    /addFeaturedProductEventListeners\(\);\s*\n\s*\/\/ Add event listeners to featured product buttons/,
    `addFeaturedProductEventListeners();
}

// Add event listeners to featured product buttons`
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS, 'utf8');

console.log('✅ Syntax error fixed in home.js!');
console.log('🎯 JavaScript should now run properly!');
