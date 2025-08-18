const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import User model
const User = require('./models/User');

const createAdminUser = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@laiqbags.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('👤 Admin email: admin@laiqbags.com');
      console.log('🔑 Admin password: admin123');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@laiqbags.com',
      password: hashedPassword,
      role: 'admin',
      phone: '9999999999'
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully');
    console.log('👤 Admin email: admin@laiqbags.com');
    console.log('🔑 Admin password: admin123');
    console.log('🔑 Admin role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createAdminUser(); 