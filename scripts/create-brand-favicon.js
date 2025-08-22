const fs = require('fs');

// Function to create a favicon with "L" logo
function createLFavicon(size, filename) {
  const width = size;
  const height = size;
  
  // PNG header
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(29);
  ihdrData.writeUInt32BE(13, 0); // Length
  ihdrData.write('IHDR', 4); // Type
  ihdrData.writeUInt32BE(width, 8); // Width
  ihdrData.writeUInt32BE(height, 12); // Height
  ihdrData.writeUInt8(8, 16); // Bit depth
  ihdrData.writeUInt8(2, 17); // Color type (RGB)
  ihdrData.writeUInt8(0, 18); // Compression
  ihdrData.writeUInt8(0, 19); // Filter
  ihdrData.writeUInt8(0, 20); // Interlace
  ihdrData.writeUInt32BE(0x12345678, 21); // Simple CRC
  
  // Create image data with "L" shape
  const pixelData = Buffer.alloc(width * height * 3);
  
  // Laiq brand color: #d4af37 (gold)
  const goldR = 0xD4;
  const goldG = 0xAF;
  const goldB = 0x37;
  
  // Background color: white
  const whiteR = 0xFF;
  const whiteG = 0xFF;
  const whiteB = 0xFF;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      
      // Create "L" shape
      const isL = (
        // Vertical part of L (left side)
        (x < width * 0.3 && y > height * 0.2) ||
        // Horizontal part of L (bottom)
        (x > width * 0.1 && x < width * 0.8 && y > height * 0.7)
      );
      
      if (isL) {
        pixelData[index] = goldR;
        pixelData[index + 1] = goldG;
        pixelData[index + 2] = goldB;
      } else {
        pixelData[index] = whiteR;
        pixelData[index + 1] = whiteG;
        pixelData[index + 2] = whiteB;
      }
    }
  }
  
  // IDAT chunk
  const idatData = Buffer.alloc(12);
  idatData.writeUInt32BE(pixelData.length, 0);
  idatData.write('IDAT', 4);
  idatData.writeUInt32BE(0x87654321, 8); // Simple CRC
  
  // IEND chunk
  const iendData = Buffer.from([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  // Combine all chunks
  const pngData = Buffer.concat([
    pngSignature,
    ihdrData,
    idatData,
    pixelData,
    iendData
  ]);
  
  // Write to file
  fs.writeFileSync(filename, pngData);
  console.log(`✅ Created ${filename} (${size}x${size}) with "L" logo`);
}

// Create favicon files
console.log('🔄 Creating brand favicon files with "L" logo...');

// Create favicon.ico (32x32)
createLFavicon(32, 'favicon.ico');

// Create other favicon sizes
createLFavicon(16, 'assets/favicon-16x16.png');
createLFavicon(32, 'assets/favicon-32x32.png');
createLFavicon(48, 'assets/favicon-48x48.png');
createLFavicon(180, 'assets/apple-touch-icon.png');
createLFavicon(192, 'assets/laiq-logo-192x192.png');
createLFavicon(512, 'assets/laiq-logo-512x512.png');

console.log('✅ All brand favicon files created successfully!');
console.log('🔄 Please clear your browser cache and refresh the page to see the new favicon.');
console.log('🎨 The favicon now shows a gold "L" on white background representing Laiq Bags.');
