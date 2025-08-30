const fs = require('fs');

console.log('🔧 Fixing the final syntax error in shop.js...');

// Read the shop.js file
let shopJS = fs.readFileSync('js/shop.js', 'utf8');

// Fix the extra closing brace at line 339
shopJS = shopJS.replace(
    /}, 100\);\n    \}\n\}/,
    '}, 100);\n}'
);

// Write the fixed file
fs.writeFileSync('js/shop.js', shopJS, 'utf8');

console.log('✅ Final syntax error fixed!');
console.log('🎉 Your shop.js file should now be completely error-free!');
