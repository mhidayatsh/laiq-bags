const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'js/product.js',
  'js/main.js', 
  'js/shop.js',
  'js/home.js',
  'server.js'
];

console.log('🔧 Fixing product URLs for better link sharing...');

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace product.html?id= with product?id=
    content = content.replace(/product\.html\?id=/g, 'product?id=');
    
    // Replace /product.html?id= with /product?id=
    content = content.replace(/\/product\.html\?id=/g, '/product?id=');
    
    // Replace href="product.html?id= with href="product?id=
    content = content.replace(/href="product\.html\?id=/g, 'href="product?id=');
    
    // Replace href="/product.html?id= with href="/product?id=
    content = content.replace(/href="\/product\.html\?id=/g, 'href="/product?id=');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('\n🎉 Product URL fix completed!');
console.log('📱 Now your product links will show proper images when shared on WhatsApp, Facebook, etc.');
console.log('\n📋 Next steps:');
console.log('1. Restart your server: npm start');
console.log('2. Test sharing a product link');
console.log('3. The link preview should now show the actual product image instead of the logo');
