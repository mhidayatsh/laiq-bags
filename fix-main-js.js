#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing main.js syntax errors...');

const mainJsPath = path.join(__dirname, 'js', 'main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

// Fix 1: Missing comma after 'default'
content = content.replace(/'default'(\s*const)/g, "'default',\n                    $1");

// Fix 2: Fix all setTimeout semicolon issues
content = content.replace(/,\s*},/g, ';},');
content = content.replace(/,\s*\);/g, ');');

// Fix 3: Fix missing commas in object literals
content = content.replace(/(\w+):\s*([^,}]+)\s*(\n\s*)(\w+):/g, '$1: $2,$3$4:');

// Fix 4: Fix missing semicolons after statements
content = content.replace(/(\w+)\s*=\s*([^;]+)\s*(\n\s*)(\w+)/g, '$1 = $2;$3$4');

console.log('✅ Syntax fixes applied');

// Write back to file
fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('✅ main.js updated successfully');

// Test syntax
try {
    require('vm').runInNewContext(content, {}, { timeout: 5000 });
    console.log('✅ Syntax validation passed');
} catch (error) {
    console.log('⚠️ Syntax validation failed:', error.message);
    console.log('🔍 Please check the file manually for remaining issues');
}
