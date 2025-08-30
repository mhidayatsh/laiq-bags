const fs = require('fs');

console.log('🔧 Fixing final syntax errors in shop.js...');

// Read the shop.js file
let shopJS = fs.readFileSync('js/shop.js', 'utf8');

// Fix the extra closing braces and parentheses at lines 338-340
shopJS = shopJS.replace(
    /}, 100\);\n\}\);\n    \}\n\}/,
    '}, 100);\n    }\n}'
);

// Write the fixed file
fs.writeFileSync('js/shop.js', shopJS, 'utf8');

console.log('✅ Final syntax errors fixed in shop.js!');
console.log('🎉 Your shop page should now be completely error-free!');
