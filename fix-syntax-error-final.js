const fs = require('fs');

console.log('🔧 Fixing final syntax error - removing extra closing braces...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Remove the extra closing braces that are causing the syntax error
// Lines 123 and 126 have extra } that shouldn't be there
homeJS = homeJS.replace(
    /}\s*\n\s*}\s*\n\s*\/\/ Simplified image handling/,
    `}\n\n// Simplified image handling`
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS);

console.log('✅ Syntax error fixed!');
console.log('🎯 Removed extra closing braces that were causing the parser error');
