const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const Product = require('../models/Product');

const deepStockAnalysis = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Check current product state
    console.log('\n📊 STEP 1: Current Product State');
    console.log('='.repeat(50));
    
    const product = await Product.findById('68a365e67d377188edc9a5f6');
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }

    console.log('📦 Product Details:');
    console.log('   ID:', product._id);
    console.log('   Name:', product.name);
    console.log('   Current Stock:', product.stock);
    console.log('   Color Variants Count:', product.colorVariants?.length || 0);
    console.log('   Color Variants:', JSON.stringify(product.colorVariants, null, 2));
    console.log('   Total Stock (Virtual):', product.totalStock);

    // 2. Simulate the exact admin panel update
    console.log('\n📊 STEP 2: Simulating Admin Panel Update');
    console.log('='.repeat(50));
    
    const adminUpdateData = {
      name: 'Classic Backpack',
      price: 2499,
      category: 'backpack',
      type: 'backpack',
      material: 'Premium Canvas',
      size: 'Medium',
      description: 'A timeless backpack perfect for daily use. Features multiple compartments and comfortable shoulder straps.',
      colorVariants: [
        {
          name: 'Black',
          code: '#000000',
          stock: 100, // Increased stock
          isAvailable: true,
          images: []
        },
        {
          name: 'Blue',
          code: '#0000FF',
          stock: 75, // Increased stock
          isAvailable: true,
          images: []
        }
      ],
      specifications: {
        dimensions: { display: '45 x 30 x 15 cm' },
        weight: '1.2 kg',
        capacity: '25L',
        features: ['Multiple compartments', 'Laptop sleeve', 'Water-resistant'],
        care: 'Wipe with damp cloth',
        warranty: '1 year',
        closure: 'Zipper',
        pockets: 'Multiple compartments',
        waterResistant: true,
        laptopCompartment: true,
        usbPort: false
      },
      featured: false,
      bestSeller: false,
      newArrival: false
    };

    console.log('📝 Admin Update Data:');
    console.log('   Color Variants:', adminUpdateData.colorVariants.map(v => ({ name: v.name, stock: v.stock })));
    console.log('   Expected Total Stock:', adminUpdateData.colorVariants.reduce((sum, v) => sum + v.stock, 0));

    // 3. Test different update methods
    console.log('\n📊 STEP 3: Testing Different Update Methods');
    console.log('='.repeat(50));

    // Method 1: Direct findByIdAndUpdate
    console.log('\n🔄 Method 1: findByIdAndUpdate');
    try {
      const result1 = await Product.findByIdAndUpdate(
        product._id,
        adminUpdateData,
        { new: true, runValidators: true }
      );
      console.log('   ✅ Success - Stock:', result1.stock);
      console.log('   Color Variants:', result1.colorVariants.map(v => ({ name: v.name, stock: v.stock })));
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Method 2: findOneAndUpdate
    console.log('\n🔄 Method 2: findOneAndUpdate');
    try {
      const result2 = await Product.findOneAndUpdate(
        { _id: product._id },
        adminUpdateData,
        { new: true, runValidators: true }
      );
      console.log('   ✅ Success - Stock:', result2.stock);
      console.log('   Color Variants:', result2.colorVariants.map(v => ({ name: v.name, stock: v.stock })));
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Method 3: Save with pre-save hooks
    console.log('\n🔄 Method 3: Save with pre-save hooks');
    try {
      const productToUpdate = await Product.findById(product._id);
      Object.assign(productToUpdate, adminUpdateData);
      const result3 = await productToUpdate.save();
      console.log('   ✅ Success - Stock:', result3.stock);
      console.log('   Color Variants:', result3.colorVariants.map(v => ({ name: v.name, stock: v.stock })));
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Method 4: Update with explicit stock calculation
    console.log('\n🔄 Method 4: Update with explicit stock calculation');
    try {
      const calculatedStock = adminUpdateData.colorVariants.reduce((sum, v) => sum + v.stock, 0);
      const updateDataWithStock = {
        ...adminUpdateData,
        stock: calculatedStock
      };
      
      const result4 = await Product.findByIdAndUpdate(
        product._id,
        updateDataWithStock,
        { new: true, runValidators: true }
      );
      console.log('   ✅ Success - Stock:', result4.stock);
      console.log('   Color Variants:', result4.colorVariants.map(v => ({ name: v.name, stock: v.stock })));
      console.log('   Calculated Stock:', calculatedStock);
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // 4. Check final state
    console.log('\n📊 STEP 4: Final Product State');
    console.log('='.repeat(50));
    
    const finalProduct = await Product.findById(product._id);
    console.log('📦 Final Product Details:');
    console.log('   Stock:', finalProduct.stock);
    console.log('   Total Stock (Virtual):', finalProduct.totalStock);
    console.log('   Color Variants:', finalProduct.colorVariants.map(v => ({ name: v.name, stock: v.stock })));

    // 5. Test API endpoint simulation
    console.log('\n📊 STEP 5: API Endpoint Simulation');
    console.log('='.repeat(50));
    
    // Simulate what the API route does
    const apiUpdateData = { ...adminUpdateData };
    
    // Recalculate stock on backend (like the API route does)
    if (Array.isArray(apiUpdateData.colorVariants)) {
      const calculatedStock = apiUpdateData.colorVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      apiUpdateData.stock = calculatedStock;
      console.log('   API Stock Calculation:', {
        colorVariants: apiUpdateData.colorVariants.map(v => ({ name: v.name, stock: v.stock })),
        calculatedStock: calculatedStock
      });
    }

    const apiResult = await Product.findOneAndUpdate(
      { _id: product._id },
      apiUpdateData,
      { new: true, runValidators: true }
    );
    
    console.log('   API Update Result:');
    console.log('   Stock:', apiResult.stock);
    console.log('   Color Variants:', apiResult.colorVariants.map(v => ({ name: v.name, stock: v.stock })));

  } catch (error) {
    console.error('❌ Error in deep analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

deepStockAnalysis();
