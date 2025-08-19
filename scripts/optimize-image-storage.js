const mongoose = require('mongoose');
const Product = require('../models/Product');
const zlib = require('zlib');
const util = require('util');

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

// Enhanced compression function
const compressText = async (text) => {
  if (!text || text.length < 1000) return text;
  try {
    const compressed = await gzip(text);
    return compressed.toString('base64');
  } catch (error) {
    console.error('❌ Compression error:', error);
    return text;
  }
};

// Enhanced decompression function
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

// Function to analyze and optimize product images
const optimizeProductImages = async () => {
  try {
    console.log('🔍 Starting image optimization analysis...');
    
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to analyze`);
    
    let totalImages = 0;
    let base64Images = 0;
    let compressedImages = 0;
    let largeImages = 0;
    let totalSizeBefore = 0;
    let totalSizeAfter = 0;
    
    for (const product of products) {
      console.log(`\n📋 Analyzing product: ${product.name}`);
      
      if (product.images && product.images.length > 0) {
        totalImages += product.images.length;
        
        for (let i = 0; i < product.images.length; i++) {
          const image = product.images[i];
          const url = image.url;
          
          if (!url) continue;
          
          if (url.startsWith('data:image/')) {
            base64Images++;
            const size = url.length;
            totalSizeBefore += size;
            
            console.log(`  📸 Image ${i + 1}: Base64 (${size.toLocaleString()} chars)`);
            
            if (size > 10000) {
              largeImages++;
              console.log(`    ⚠️  Large image detected (${size.toLocaleString()} chars)`);
              
              // Compress the image
              const compressed = await compressText(url);
              const compressedSize = compressed.length;
              totalSizeAfter += compressedSize;
              
              console.log(`    🗜️  Compressed to ${compressedSize.toLocaleString()} chars (${((1 - compressedSize/size) * 100).toFixed(1)}% reduction)`);
              
              // Update the image URL
              image.url = compressed;
              compressedImages++;
            }
          } else if (url.startsWith('H4sI')) {
            compressedImages++;
            console.log(`  📸 Image ${i + 1}: Already compressed (${url.length.toLocaleString()} chars)`);
          } else {
            console.log(`  📸 Image ${i + 1}: External URL (${url.length.toLocaleString()} chars)`);
          }
        }
        
        // Save the product if any images were compressed
        if (product.isModified('images')) {
          await product.save();
          console.log(`  ✅ Product updated with compressed images`);
        }
      }
      
      // Also check color variants
      if (product.colorVariants && product.colorVariants.length > 0) {
        for (const variant of product.colorVariants) {
          if (variant.images && variant.images.length > 0) {
            for (let i = 0; i < variant.images.length; i++) {
              const image = variant.images[i];
              const url = image.url;
              
              if (url && url.startsWith('data:image/') && url.length > 10000) {
                console.log(`  🎨 Color variant ${variant.name} image ${i + 1}: Compressing...`);
                image.url = await compressText(url);
                totalSizeAfter += image.url.length;
                compressedImages++;
              }
            }
          }
        }
        
        if (product.isModified('colorVariants')) {
          await product.save();
          console.log(`  ✅ Product updated with compressed color variant images`);
        }
      }
    }
    
    console.log('\n📊 Image Optimization Summary:');
    console.log(`  📦 Total products analyzed: ${products.length}`);
    console.log(`  📸 Total images: ${totalImages}`);
    console.log(`  🔗 Base64 images: ${base64Images}`);
    console.log(`  🗜️  Compressed images: ${compressedImages}`);
    console.log(`  ⚠️  Large images (>10k chars): ${largeImages}`);
    console.log(`  💾 Total size before: ${totalSizeBefore.toLocaleString()} chars`);
    console.log(`  💾 Total size after: ${totalSizeAfter.toLocaleString()} chars`);
    
    if (totalSizeBefore > 0) {
      const savings = ((totalSizeBefore - totalSizeAfter) / totalSizeBefore * 100).toFixed(1);
      console.log(`  🎯 Storage savings: ${savings}%`);
    }
    
    console.log('\n✅ Image optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during image optimization:', error);
  }
};

// Function to convert base64 images to external URLs (placeholder)
const convertToExternalStorage = async () => {
  console.log('\n🔄 This function would convert base64 images to external storage URLs');
  console.log('   (e.g., AWS S3, Cloudinary, or similar service)');
  console.log('   Implementation depends on your chosen storage provider');
};

// Main execution
const main = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://laiqbags:CVnxzKLO8U6WtY2A@cluster0.ejqjqjq.mongodb.net/laiqbags?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Run optimization
    await optimizeProductImages();
    
    // Optional: Convert to external storage
    // await convertToExternalStorage();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  optimizeProductImages,
  convertToExternalStorage
};
