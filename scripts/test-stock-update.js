const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const Product = require('../models/Product');

const testStockUpdate = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the first product
    const product = await Product.findById('68a365e67d377188edc9a5f6');
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }

    console.log('📦 Current product state:');
    console.log('   Name:', product.name);
    console.log('   Current stock:', product.stock);
    console.log('   Color variants:', product.colorVariants);

    // Test stock update
    const testColorVariants = [
      {
        name: 'Black',
        code: '#000000',
        stock: 50,
        isAvailable: true,
        images: []
      },
      {
        name: 'Blue',
        code: '#0000FF',
        stock: 30,
        isAvailable: true,
        images: []
      }
    ];

    console.log('\n🔄 Testing stock update...');
    console.log('   New color variants:', testColorVariants);
    console.log('   Expected total stock:', testColorVariants.reduce((sum, v) => sum + v.stock, 0));

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        colorVariants: testColorVariants,
        stock: testColorVariants.reduce((sum, v) => sum + v.stock, 0)
      },
      {
        new: true,
        runValidators: true
      }
    );

    console.log('\n✅ Updated product state:');
    console.log('   Name:', updatedProduct.name);
    console.log('   New stock:', updatedProduct.stock);
    console.log('   Color variants:', updatedProduct.colorVariants);
    console.log('   Total stock (calculated):', updatedProduct.totalStock);

    // Verify the update
    if (updatedProduct.stock === 80) {
      console.log('✅ Stock update successful!');
    } else {
      console.log('❌ Stock update failed!');
      console.log('   Expected: 80, Got:', updatedProduct.stock);
    }

  } catch (error) {
    console.error('❌ Error testing stock update:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testStockUpdate();
