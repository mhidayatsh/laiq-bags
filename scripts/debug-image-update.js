const mongoose = require('mongoose');
const Product = require('../models/Product');

const debugProductImages = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://laiqbags:CVnxzKLO8U6WtY2A@cluster0.ejqjqjq.mongodb.net/laiqbags?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the specific product
    const productId = '68a365e67d377188edc9a5f6';
    const product = await Product.findById(productId);
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }
    
    console.log('\n📦 Product Details:');
    console.log(`  Name: ${product.name}`);
    console.log(`  ID: ${product._id}`);
    console.log(`  Images count: ${product.images ? product.images.length : 0}`);
    
    if (product.images && product.images.length > 0) {
      console.log('\n📸 Image Details:');
      product.images.forEach((image, index) => {
        console.log(`  Image ${index + 1}:`);
        console.log(`    Public ID: ${image.public_id}`);
        console.log(`    Alt: ${image.alt}`);
        console.log(`    Is Primary: ${image.isPrimary}`);
        console.log(`    URL length: ${image.url ? image.url.length : 0} characters`);
        console.log(`    URL starts with data: ${image.url ? image.url.startsWith('data:image/') : false}`);
        console.log(`    URL starts with H4sI (compressed): ${image.url ? image.url.startsWith('H4sI') : false}`);
        console.log(`    URL preview: ${image.url ? image.url.substring(0, 100) + '...' : 'NO URL'}`);
      });
    } else {
      console.log('\n📸 No images found');
    }
    
    // Check if images are compressed
    console.log('\n🗜️ Compression Analysis:');
    if (product.images && product.images.length > 0) {
      product.images.forEach((image, index) => {
        if (image.url) {
          const isCompressed = image.url.startsWith('H4sI');
          const isBase64 = image.url.startsWith('data:image/');
          const size = image.url.length;
          
          console.log(`  Image ${index + 1}:`);
          console.log(`    Size: ${size.toLocaleString()} characters`);
          console.log(`    Type: ${isCompressed ? 'Compressed' : isBase64 ? 'Base64' : 'External URL'}`);
          
          if (isCompressed) {
            console.log(`    Should be decompressed on retrieval`);
          } else if (isBase64 && size > 5000) {
            console.log(`    ⚠️ Large base64 image - should be compressed`);
          }
        }
      });
    }
    
    // Check the last modified date
    console.log('\n📅 Product Metadata:');
    console.log(`  Created: ${product.createdAt}`);
    console.log(`  Updated: ${product.updatedAt}`);
    
    // Check if there are any validation errors
    console.log('\n🔍 Validation Check:');
    try {
      await product.validate();
      console.log('  ✅ Product validation passed');
    } catch (validationError) {
      console.log('  ❌ Product validation failed:');
      console.log('    ', validationError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the debug
debugProductImages();
