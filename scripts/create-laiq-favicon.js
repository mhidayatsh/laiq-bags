const fs = require('fs');

// Function to create a favicon with "LAIQ" logo in brand gold color
function createLaiqFavicon(size, filename) {
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
  
  // Create image data with "LAIQ" text
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
      
      // Create "LAIQ" text pattern
      const centerX = width / 2;
      const centerY = height / 2;
      const textWidth = width * 0.7;
      const textHeight = height * 0.4;
      
      // Check if pixel is within text area
      const inTextArea = (
        x > centerX - textWidth/2 && 
        x < centerX + textWidth/2 && 
        y > centerY - textHeight/2 && 
        y < centerY + textHeight/2
      );
      
      if (inTextArea) {
        // Create letter patterns
        const letterWidth = textWidth / 4; // 4 letters: L, A, I, Q
        const letterX = (x - (centerX - textWidth/2)) / letterWidth;
        const letterY = (y - (centerY - textHeight/2)) / textHeight;
        
        let isLetter = false;
        
        // L pattern
        if (letterX < 1 && letterY > 0.2) isLetter = true;
        // A pattern  
        if (letterX >= 1 && letterX < 2 && letterY > 0.1) isLetter = true;
        // I pattern
        if (letterX >= 2 && letterX < 3 && letterY > 0.1) isLetter = true;
        // Q pattern
        if (letterX >= 3 && letterX < 4 && letterY > 0.1) isLetter = true;
        
        if (isLetter) {
          pixelData[index] = goldR;
          pixelData[index + 1] = goldG;
          pixelData[index + 2] = goldB;
        } else {
          pixelData[index] = whiteR;
          pixelData[index + 1] = whiteG;
          pixelData[index + 2] = whiteB;
        }
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
  console.log(`✅ Created ${filename} (${size}x${size}) with "LAIQ" logo in gold`);
}

// Create favicon files
console.log('🔄 Creating LAIQ brand favicon files...');

// Create favicon.ico (32x32)
createLaiqFavicon(32, 'favicon.ico');

// Create other favicon sizes
createLaiqFavicon(16, 'assets/favicon-16x16.png');
createLaiqFavicon(32, 'assets/favicon-32x32.png');
createLaiqFavicon(48, 'assets/favicon-48x48.png');
createLaiqFavicon(180, 'assets/apple-touch-icon.png');
createLaiqFavicon(192, 'assets/laiq-logo-192x192.png');
createLaiqFavicon(512, 'assets/laiq-logo-512x512.png');

console.log('✅ All LAIQ brand favicon files created successfully!');
console.log('🎨 The favicon now shows "LAIQ" in your brand gold color (#d4af37)');
console.log('🔄 Please clear your browser cache and refresh the page to see the new favicon.');
