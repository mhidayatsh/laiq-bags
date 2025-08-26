#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Domain Consistency Issues...\n');

// Files to check and fix
const filesToCheck = [
  'index.html',
  'about.html',
  'contact.html',
  'shop.html',
  'product.html',
  'customer-login.html',
  'customer-register.html',
  'forgot-password.html',
  'robots.txt',
  'structured-data.json'
];

let totalReplacements = 0;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace non-www URLs with www URLs
    content = content.replace(/https?:\/\/laiq\.shop/g, 'https://www.laiq.shop');
    content = content.replace(/href="\/\//g, 'href="https://www.laiq.shop/');
    content = content.replace(/src="\/\//g, 'src="https://www.laiq.shop/');
    
    // Add canonical URLs if missing
    if (file.endsWith('.html') && !content.includes('rel="canonical"')) {
      const canonicalTag = `<link rel="canonical" href="https://www.laiq.shop/${file}" />`;
      content = content.replace('</head>', `  ${canonicalTag}\n  </head>`);
    }
    
    // Count replacements
    const replacements = (content.match(/https:\/\/www\.laiq\.shop/g) || []).length;
    totalReplacements += replacements;
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file} (${replacements} replacements)`);
    } else {
      console.log(`✅ ${file} already consistent`);
    }
  } else {
    console.log(`⚠️  ${file} not found`);
  }
});

// Check server.js for domain consistency
const serverPath = path.join(__dirname, '..', 'server.js');
if (fs.existsSync(serverPath)) {
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  let originalServerContent = serverContent;
  
  // Ensure all hardcoded URLs use www version
  serverContent = serverContent.replace(/https?:\/\/laiq\.shop/g, 'https://www.laiq.shop');
  
  const serverReplacements = (serverContent.match(/https:\/\/www\.laiq\.shop/g) || []).length;
  totalReplacements += serverReplacements;
  
  if (serverContent !== originalServerContent) {
    fs.writeFileSync(serverPath, serverContent);
    console.log(`✅ Fixed server.js (${serverReplacements} replacements)`);
  } else {
    console.log(`✅ server.js already consistent`);
  }
}

console.log(`\n🎯 Total replacements made: ${totalReplacements}`);
console.log('\n📋 Next Steps:');
console.log('1. Deploy the updated files to your server');
console.log('2. Test redirects: http://laiq.shop → https://www.laiq.shop');
console.log('3. Submit sitemap to Google Search Console');
console.log('4. Set www.laiq.shop as preferred domain in Search Console');
console.log('5. Monitor for consolidation over 2-4 weeks');

console.log('\n✅ Domain consistency fix completed!');
