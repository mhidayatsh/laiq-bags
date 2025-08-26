const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('../models/User');

// Test customer data
const testCustomer = {
  name: "Test Customer",
  email: "test@example.com",
  password: "Test123@",
  phone: "9876543211",
  role: "customer",
  emailVerified: true,
  address: {
    street: "Test Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India"
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  createTestCustomer();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function createTestCustomer() {
  try {
    // Check if customer already exists
    const existingCustomer = await User.findOne({ email: testCustomer.email });
    
    if (existingCustomer) {
      console.log('👤 Test customer already exists:', existingCustomer.email);
      console.log('📋 Test Customer Credentials:');
      console.log('Email: test@example.com');
      console.log('Password: Test123@');
      process.exit(0);
    }

    // Create test customer
    const hashedPassword = await bcrypt.hash(testCustomer.password, 12);
    const customer = await User.create({
      ...testCustomer,
      password: hashedPassword
    });
    
    console.log('👤 Test customer created:', customer.email);
    console.log('✅ Test customer account created successfully!');
    console.log('\n📋 Test Customer Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: Test123@');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
    process.exit(1);
  }
}
