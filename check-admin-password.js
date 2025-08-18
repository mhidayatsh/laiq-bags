const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import User model
const User = require('./models/User');

const checkAndUpdateAdminPassword = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin user found:', adminUser.name);
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Current password hash:', adminUser.password.substring(0, 20) + '...');

    // Test current password
    const testPassword = 'mdhidayat';
    const isMatch = await bcrypt.compare(testPassword, adminUser.password);
    console.log('🔍 Password match test:', isMatch);

    if (!isMatch) {
      console.log('🔄 Updating admin password...');
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      
      // Update password
      adminUser.password = hashedPassword;
      await adminUser.save();
      
      console.log('✅ Admin password updated successfully');
      console.log('👤 Admin email: mdhidayatullahsheikh786@gmail.com');
      console.log('🔑 Admin password: mdhidayat');
    } else {
      console.log('✅ Password is already correct');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkAndUpdateAdminPassword(); 