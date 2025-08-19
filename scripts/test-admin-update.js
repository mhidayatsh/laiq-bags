const axios = require('axios');

const testAdminUpdate = async () => {
  try {
    console.log('🧪 Testing Admin Panel Stock Update');
    console.log('='.repeat(50));

    // 1. Login as admin
    console.log('\n🔐 Step 1: Admin Login');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'mdhidayatullahsheikh786@gmail.com',
      password: 'Mdhidayat786@'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Get current product state
    console.log('\n📦 Step 2: Get Current Product State');
    const productResponse = await axios.get('http://localhost:3001/api/products/68a365e67d377188edc9a5f6');
    
    if (!productResponse.data.success) {
      throw new Error('Failed to get product');
    }

    const currentProduct = productResponse.data.product;
    console.log('📊 Current State:');
    console.log('   Stock:', currentProduct.stock);
    console.log('   Color Variants:', currentProduct.colorVariants?.map(v => ({ name: v.name, stock: v.stock })) || []);

    // 3. Simulate admin panel update
    console.log('\n🔄 Step 3: Simulate Admin Panel Update');
    
    const updateData = {
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
          stock: 150, // Increased stock
          isAvailable: true,
          images: []
        },
        {
          name: 'Blue',
          code: '#0000FF',
          stock: 100, // Increased stock
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

    console.log('📝 Update Data:');
    console.log('   Color Variants:', updateData.colorVariants.map(v => ({ name: v.name, stock: v.stock })));
    console.log('   Expected Total Stock:', updateData.colorVariants.reduce((sum, v) => sum + v.stock, 0));

    // 4. Send update request
    console.log('\n📡 Step 4: Send Update Request');
    const updateResponse = await axios.put(
      `http://localhost:3001/api/products/68a365e67d377188edc9a5f6`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!updateResponse.data.success) {
      throw new Error('Update failed: ' + updateResponse.data.message);
    }

    console.log('✅ Update successful');
    console.log('📊 Response:', updateResponse.data.product);

    // 5. Verify the update
    console.log('\n✅ Step 5: Verify Update');
    const verifyResponse = await axios.get('http://localhost:3001/api/products/68a365e67d377188edc9a5f6');
    const updatedProduct = verifyResponse.data.product;

    console.log('📦 Final Product State:');
    console.log('   Stock:', updatedProduct.stock);
    console.log('   Color Variants:', updatedProduct.colorVariants?.map(v => ({ name: v.name, stock: v.stock })) || []);
    console.log('   Expected Stock:', updateData.colorVariants.reduce((sum, v) => sum + v.stock, 0));

    // 6. Check if update was successful
    const expectedStock = updateData.colorVariants.reduce((sum, v) => sum + v.stock, 0);
    if (updatedProduct.stock === expectedStock) {
      console.log('🎉 SUCCESS: Stock updated correctly!');
    } else {
      console.log('❌ FAILED: Stock not updated correctly');
      console.log('   Expected:', expectedStock);
      console.log('   Got:', updatedProduct.stock);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testAdminUpdate();
