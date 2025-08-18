const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import Product model
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  addDiscounts();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function addDiscounts() {
  try {
    console.log('🎯 Adding discounts to products...');
    
    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);
    
    // Set end date to 30 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Add discounts to specific products
    const discountUpdates = [
      {
        productId: '688ced1cd43f0406a4174bb7', // Classic Backpack
        discount: 20,
        discountType: 'percentage',
        discountEndDate: endDate
      },
      {
        productId: '688ced1cd43f0406a4174bb9', // Elegant Sling
        discount: 15,
        discountType: 'percentage',
        discountEndDate: endDate
      },
      {
        productId: '688ced1cd43f0406a4174bbb', // Urban Tote
        discount: 25,
        discountType: 'percentage',
        discountEndDate: endDate
      },
      {
        productId: '688e1552f8784a8845f378e7', // Purse
        discount: 30,
        discountType: 'percentage',
        discountEndDate: endDate
      }
    ];
    
    for (const update of discountUpdates) {
      const product = await Product.findById(update.productId);
      if (product) {
        product.discount = update.discount;
        product.discountType = update.discountType;
        product.discountEndDate = update.discountEndDate;
        product.isDiscountActive = true;
        
        await product.save();
        console.log(`✅ Added ${update.discount}% discount to ${product.name}`);
      } else {
        console.log(`❌ Product not found: ${update.productId}`);
      }
    }
    
    // Verify discounts were added
    console.log('\n🔍 Verifying discounts...');
    const productsWithDiscounts = await Product.find({ discount: { $gt: 0 } });
    
    productsWithDiscounts.forEach(product => {
      const discountInfo = product.getDiscountInfo();
      console.log(`📦 ${product.name}: ${discountInfo ? discountInfo.value : 'No discount'} - Status: ${discountInfo ? discountInfo.status : 'inactive'}`);
    });
    
    console.log('\n✅ Discounts added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding discounts:', error);
    process.exit(1);
  }
} 