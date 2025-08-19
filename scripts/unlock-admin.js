const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const User = require('../models/User');

const unlockAdmin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and unlock admin account
    const admin = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin account not found');
      return;
    }

    console.log('👤 Found admin account:', admin.name);
    console.log('🔒 Current lock status:', admin.isLocked);
    console.log('🔢 Login attempts:', admin.loginAttempts);
    console.log('⏰ Lock until:', admin.lockUntil);

    // Force unlock the account
    await User.updateOne(
      { email: 'mdhidayatullahsheikh786@gmail.com' },
      { 
        $unset: { 
          loginAttempts: 1, 
          lockUntil: 1 
        },
        $set: {
          lastLogin: new Date()
        }
      }
    );

    console.log('✅ Admin account unlocked successfully');
    console.log('🔑 You can now login with:');
    console.log('   Email: mdhidayatullahsheikh786@gmail.com');
    console.log('   Password: Mdhidayat786@');

  } catch (error) {
    console.error('❌ Error unlocking admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

unlockAdmin();
