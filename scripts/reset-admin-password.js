const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

const User = require('../models/User');

const resetAdminPassword = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin account
    const admin = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin account not found');
      return;
    }

    console.log('👤 Found admin account:', admin.name);
    console.log('🔒 Current lock status:', admin.isLocked);
    console.log('🔢 Login attempts:', admin.loginAttempts);

    // Hash the correct password
    const correctPassword = 'Mdhidayat786@';
    const hashedPassword = await bcrypt.hash(correctPassword, 12);
    
    console.log('🔑 Hashing new password...');

    // Update admin with new password and unlock account
    await User.updateOne(
      { email: 'mdhidayatullahsheikh786@gmail.com' },
      { 
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          lastLogin: new Date()
        },
        $unset: { 
          loginAttempts: 1, 
          lockUntil: 1 
        }
      }
    );

    console.log('✅ Admin password reset successfully');
    console.log('🔓 Account unlocked');
    console.log('🔑 New credentials:');
    console.log('   Email: mdhidayatullahsheikh786@gmail.com');
    console.log('   Password: Mdhidayat786@');

    // Test the password
    console.log('\n🧪 Testing password...');
    const testUser = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' }).select('+password');
    const isMatch = await bcrypt.compare(correctPassword, testUser.password);
    console.log('🔍 Password test result:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

resetAdminPassword();
