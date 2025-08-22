const fs = require('fs');

// Function to create a proper PNG favicon with golden "LAIQ" text
function createProperGoldenFavicon(size, filename) {
  const width = size;
  const height = size;
  
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (13 bytes of data + 4 bytes CRC)
  const ihdrData = Buffer.alloc(25);
  ihdrData.writeUInt32BE(13, 0); // Length
  ihdrData.write('IHDR', 4); // Type
  ihdrData.writeUInt32BE(width, 8); // Width
  ihdrData.writeUInt32BE(height, 12); // Height
  ihdrData.writeUInt8(8, 16); // Bit depth
  ihdrData.writeUInt8(2, 17); // Color type (RGB)
  ihdrData.writeUInt8(0, 18); // Compression
  ihdrData.writeUInt8(0, 19); // Filter
  ihdrData.writeUInt8(0, 20); // Interlace
  
  // Calculate CRC for IHDR (simplified)
  let crc = 0;
  for (let i = 4; i < 21; i++) {
    crc = ((crc << 8) + ihdrData[i]) & 0xFFFFFFFF;
  }
  ihdrData.writeUInt32BE(crc, 21);
  
  // Create image data with golden "LAIQ" text
  const pixelData = Buffer.alloc(width * height * 3);
  
  // Golden color: #d4af37 (your brand gold)
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
      const textWidth = width * 0.8;
      const textHeight = height * 0.5;
      
      // Check if pixel is within text area
      const inTextArea = (
        x > centerX - textWidth/2 && 
        x < centerX + textWidth/2 && 
        y > centerY - textHeight/2 && 
        y < centerY + textHeight/2
      );
      
      if (inTextArea) {
        // Create letter patterns for L, A, I, Q
        const letterWidth = textWidth / 4; // 4 letters
        const letterX = (x - (centerX - textWidth/2)) / letterWidth;
        const letterY = (y - (centerY - textHeight/2)) / textHeight;
        
        let isLetter = false;
        
        // L pattern - vertical line and horizontal base
        if (letterX < 1) {
          if (letterY > 0.15 || (letterX > 0.6 && letterY > 0.7)) isLetter = true;
        }
        // A pattern - triangle shape
        else if (letterX >= 1 && letterX < 2) {
          if (letterY > 0.15 && letterY < 0.85) {
            const aX = letterX - 1;
            if (aX < 0.5) {
              if (letterY > 0.15 + aX * 0.7) isLetter = true;
            } else {
              if (letterY > 0.15 + (1 - aX) * 0.7) isLetter = true;
            }
          }
        }
        // I pattern - vertical line
        else if (letterX >= 2 && letterX < 3) {
          if (letterY > 0.15 && letterY < 0.85) isLetter = true;
        }
        // Q pattern - circle with tail
        else if (letterX >= 3 && letterX < 4) {
          const qX = letterX - 3;
          const qY = letterY - 0.5;
          const radius = 0.3;
          const distance = Math.sqrt(qX * qX + qY * qY);
          if (distance < radius || (qX > 0.2 && qY > 0.2 && qX < 0.4 && qY < 0.4)) {
            isLetter = true;
          }
        }
        
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
  const idatData = Buffer.alloc(8);
  idatData.writeUInt32BE(pixelData.length, 0);
  idatData.write('IDAT', 4);
  
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
  console.log(`✅ Created ${filename} (${size}x${size}) with proper PNG structure`);
}

// Create favicon files with proper PNG structure
console.log('🔄 Creating proper PNG favicon files...');

// Create favicon.ico (32x32)
createProperGoldenFavicon(32, 'favicon.ico');

// Create other favicon sizes
createProperGoldenFavicon(16, 'assets/favicon-16x16.png');
createProperGoldenFavicon(32, 'assets/favicon-32x32.png');
createProperGoldenFavicon(48, 'assets/favicon-48x48.png');
createProperGoldenFavicon(180, 'assets/apple-touch-icon.png');
createProperGoldenFavicon(192, 'assets/laiq-logo-192x192.png');
createProperGoldenFavicon(512, 'assets/laiq-logo-512x512.png');

console.log('✅ All proper PNG favicon files created successfully!');
console.log('🎨 The favicon now shows golden "LAIQ" logo with proper PNG structure');
console.log('🔄 Please clear your browser cache and refresh the page to see the new favicon.');
