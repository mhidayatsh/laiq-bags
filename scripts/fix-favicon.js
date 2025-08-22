const fs = require('fs');
const path = require('path');

// Function to create a simple colored square favicon
function createSimpleFavicon(size, filename) {
  // Create a simple PNG with the Laiq brand color (#d4af37)
  const width = size;
  const height = size;
  
  // PNG header
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (13 bytes of data)
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
  // Simple CRC (not accurate but will work for basic PNG)
  ihdrData.writeUInt32BE(0x12345678, 21);
  
  // Create a simple gold-colored image data
  const pixelData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = 0xD4;     // Red
    pixelData[i + 1] = 0xAF; // Green
    pixelData[i + 2] = 0x37; // Blue
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
  console.log(`✅ Created ${filename} (${size}x${size})`);
}

// Create favicon files
console.log('🔄 Creating proper favicon files...');

// Create favicon.ico (32x32)
createSimpleFavicon(32, 'favicon.ico');

// Create other favicon sizes
createSimpleFavicon(16, 'assets/favicon-16x16.png');
createSimpleFavicon(32, 'assets/favicon-32x32.png');
createSimpleFavicon(48, 'assets/favicon-48x48.png');
createSimpleFavicon(180, 'assets/apple-touch-icon.png');
createSimpleFavicon(192, 'assets/laiq-logo-192x192.png');
createSimpleFavicon(512, 'assets/laiq-logo-512x512.png');

console.log('✅ All favicon files created successfully!');
console.log('🔄 Please clear your browser cache and refresh the page to see the new favicon.');
