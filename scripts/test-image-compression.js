const zlib = require('zlib');
const util = require('util');

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

// Test compression function
const compressText = async (text) => {
  if (!text || text.length < 500) return text;
  try {
    const compressed = await gzip(text);
    return compressed.toString('base64');
  } catch (error) {
    console.error('❌ Compression error:', error);
    return text;
  }
};

// Test decompression function
const decompressText = async (compressedText) => {
  if (!compressedText || !compressedText.startsWith('H4sI')) return compressedText;
  try {
    const buffer = Buffer.from(compressedText, 'base64');
    const decompressed = await gunzip(buffer);
    return decompressed.toString();
  } catch (error) {
    console.error('❌ Decompression error:', error);
    return compressedText;
  }
};

// Test with sample data
const testCompression = async () => {
  console.log('🧪 Testing image compression functionality...\n');
  
  // Sample large text (simulating base64 image)
  const sampleImage = 'data:image/jpeg;base64,' + 'A'.repeat(10000);
  
  console.log('📊 Test Data:');
  console.log(`  Original size: ${sampleImage.length.toLocaleString()} characters`);
  console.log(`  Is base64: ${sampleImage.startsWith('data:image/')}`);
  console.log(`  Should compress: ${sampleImage.length > 5000}`);
  
  // Test compression
  console.log('\n🗜️ Testing compression...');
  const compressed = await compressText(sampleImage);
  console.log(`  Compressed size: ${compressed.length.toLocaleString()} characters`);
  console.log(`  Is compressed: ${compressed.startsWith('H4sI')}`);
  
  if (compressed.startsWith('H4sI')) {
    const compressionRatio = ((1 - compressed.length / sampleImage.length) * 100).toFixed(1);
    console.log(`  Compression ratio: ${compressionRatio}%`);
  }
  
  // Test decompression
  console.log('\n🔓 Testing decompression...');
  const decompressed = await decompressText(compressed);
  console.log(`  Decompressed size: ${decompressed.length.toLocaleString()} characters`);
  console.log(`  Data integrity: ${decompressed === sampleImage ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test with small text
  console.log('\n📝 Testing small text (should not compress)...');
  const smallText = 'Hello World';
  const smallCompressed = await compressText(smallText);
  console.log(`  Original: "${smallText}"`);
  console.log(`  Result: "${smallCompressed}"`);
  console.log(`  Should be unchanged: ${smallCompressed === smallText ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n✅ Compression test completed!');
};

// Run test
testCompression().catch(console.error);
