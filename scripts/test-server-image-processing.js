const mongoose = require('mongoose');
const Product = require('../models/Product');
const zlib = require('zlib');
const util = require('util');

const gzip = util.promisify(zlib.gzip);

// Test server-side image processing
const testServerImageProcessing = async () => {
    try {
        console.log('🧪 Testing server-side image processing...');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://laiqbags:CVnxzKLO8U6WtY2A@cluster0.ejqjqjq.mongodb.net/laiqbags?retryWrites=true&w=majority';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        
        // Test image compression
        const testImage = 'data:image/jpeg;base64,' + 'A'.repeat(100000); // 100k character test image
        console.log(`📸 Test image size: ${testImage.length.toLocaleString()} characters`);
        
        // Test compression
        console.log('🗜️ Testing compression...');
        const startTime = Date.now();
        const compressed = await gzip(testImage);
        const compressionTime = Date.now() - startTime;
        
        console.log(`  Compression time: ${compressionTime}ms`);
        console.log(`  Compressed size: ${compressed.length.toLocaleString()} bytes`);
        console.log(`  Compression ratio: ${((1 - compressed.length / testImage.length) * 100).toFixed(1)}%`);
        
        // Test with multiple images
        console.log('\n📸 Testing multiple images...');
        const multipleImages = [
            {
                public_id: 'test-1',
                url: 'data:image/jpeg;base64,' + 'B'.repeat(50000),
                alt: 'Test Image 1',
                isPrimary: true
            },
            {
                public_id: 'test-2',
                url: 'data:image/jpeg;base64,' + 'C'.repeat(50000),
                alt: 'Test Image 2',
                isPrimary: false
            }
        ];
        
        console.log(`  Processing ${multipleImages.length} images...`);
        
        const processedImages = [];
        for (let i = 0; i < multipleImages.length; i++) {
            const image = multipleImages[i];
            console.log(`  Image ${i + 1}: ${image.url.length.toLocaleString()} characters`);
            
            if (image.url.length > 5000) {
                console.log(`    Compressing image ${i + 1}...`);
                const compressedUrl = await gzip(image.url);
                processedImages.push({
                    ...image,
                    url: compressedUrl.toString('base64')
                });
                console.log(`    Compressed to: ${compressedUrl.length.toLocaleString()} bytes`);
            } else {
                processedImages.push(image);
                console.log(`    Image ${i + 1} not compressed (too small)`);
            }
        }
        
        console.log(`✅ Processed ${processedImages.length} images successfully`);
        
        // Test memory usage
        const memUsage = process.memoryUsage();
        console.log('\n💾 Memory Usage:');
        console.log(`  RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
        console.log(`  Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
        console.log(`  Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
        
        // Test with actual product data
        console.log('\n📦 Testing with actual product data...');
        const productId = '68a365e67d377188edc9a5f6';
        const product = await Product.findById(productId);
        
        if (product) {
            console.log(`  Found product: ${product.name}`);
            console.log(`  Current images: ${product.images ? product.images.length : 0}`);
            
            if (product.images && product.images.length > 0) {
                console.log('  Analyzing current images...');
                product.images.forEach((image, index) => {
                    console.log(`    Image ${index + 1}: ${image.url ? image.url.length : 0} characters`);
                    if (image.url && image.url.startsWith('H4sI')) {
                        console.log(`      Status: Already compressed`);
                    } else if (image.url && image.url.startsWith('data:image/')) {
                        console.log(`      Status: Base64 (needs compression)`);
                    } else {
                        console.log(`      Status: External URL`);
                    }
                });
            }
        }
        
        console.log('\n✅ Server-side image processing test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during server-side image processing test:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run the test
testServerImageProcessing();
