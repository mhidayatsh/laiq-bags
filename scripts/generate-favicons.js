const fs = require('fs');
const path = require('path');

// Create favicon files from existing logo
const logoPath = path.join(__dirname, '../assets/laiq-logo.png');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('Logo file not found:', logoPath);
  process.exit(1);
}

// Create favicon.ico (copy logo as favicon.ico for now)
const faviconPath = path.join(__dirname, '../favicon.ico');
fs.copyFileSync(logoPath, faviconPath);
console.log('✅ Created favicon.ico');

// Create different sized favicon PNGs
const sizes = [16, 32, 48];
sizes.forEach(size => {
  const faviconPath = path.join(__dirname, `../assets/favicon-${size}x${size}.png`);
  fs.copyFileSync(logoPath, faviconPath);
  console.log(`✅ Created favicon-${size}x${size}.png`);
});

// Create apple-touch-icon
const appleTouchPath = path.join(__dirname, '../assets/apple-touch-icon.png');
fs.copyFileSync(logoPath, appleTouchPath);
console.log('✅ Created apple-touch-icon.png');

console.log('\n🎉 All favicon files created successfully!');
console.log('📝 Note: For production, you should use proper image processing tools');
console.log('   to resize the images to exact dimensions for better quality.');
