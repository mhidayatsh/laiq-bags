const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import User model
const User = require('./models/User');

const updateAdminPassword = async () => {
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

    // Hash new password
    const newPassword = 'Mdhidayat786@';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password directly in database
    const updateResult = await User.updateOne(
      { _id: adminUser._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('💾 Update result:', updateResult);
    
    if (updateResult.modifiedCount > 0) {
      console.log('✅ Admin password updated successfully');
      console.log('👤 Admin email: mdhidayatullahsheikh786@gmail.com');
      console.log('🔑 Admin password: Mdhidayat786@');
    } else {
      console.log('⚠️  Password was already correct');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateAdminPassword(); 