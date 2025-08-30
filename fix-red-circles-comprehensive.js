const fs = require('fs');

console.log('🔧 Applying comprehensive red circles fix...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Replace the image rendering with comprehensive red circles prevention
const newImageCode = `        // Comprehensive red circles prevention
        const imgSrc = product.images?.[0]?.url || product.image || 'assets/thumbnail.jpg';
        
        return \`
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div class="relative">
                    <a href="product?id=\${productId}" class="block">
                        <img src="\${imgSrc}" alt="\${product.name}"
                             loading="lazy" decoding="async" fetchpriority="low"
                             width="400" height="256"
                             onerror="this.onerror=null; this.src='assets/thumbnail.jpg'; this.style.display='block'; this.style.visibility='visible';"
                             onload="this.style.display='block'; this.style.visibility='visible'; this.style.opacity='1';"
                             style="display: block; visibility: visible; opacity: 1;"
                             class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </a>`;

// Replace the image rendering part
homeJS = homeJS.replace(
    /\/\/ Use a reliable fallback chain\s*const imgSrc = product\.images\?\.[0]\.url \|\| product\.image \|\| 'assets\/thumbnail\.jpg';\s*\n\s*return \`\s*<div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">\s*<div class="relative">\s*<a href="product\?id=\${productId}" class="block">\s*<img src="\${imgSrc}" alt="\${product\.name}"\s*loading="lazy" decoding="async" fetchpriority="low"\s*width="400" height="256"\s*onerror="this\.onerror=null; this\.src='assets\/thumbnail\.jpg';"\s*class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" \/>/,
    newImageCode
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS);

console.log('✅ Comprehensive red circles fix applied!');
console.log('🎯 Multiple layers of protection added to prevent red ovals');
