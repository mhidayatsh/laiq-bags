const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

async function unlockAdminAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find admin user
        const admin = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
        
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log('✅ Admin user found');
        console.log('Current lock status:', admin.isLocked || false);
        console.log('Lock until:', admin.lockUntil || 'Not locked');
        console.log('Failed login attempts:', admin.failedLoginAttempts || 0);
        
        // Unlock the account by resetting lock fields
        await User.findByIdAndUpdate(admin._id, {
            isLocked: false,
            lockUntil: null,
            failedLoginAttempts: 0,
            lastFailedLogin: null
        });
        
        console.log('✅ Admin account unlocked successfully');
        
        // Verify the unlock
        const updatedAdmin = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
        console.log('Updated lock status:', updatedAdmin.isLocked || false);
        console.log('Updated lock until:', updatedAdmin.lockUntil || 'Not locked');
        console.log('Updated failed attempts:', updatedAdmin.failedLoginAttempts || 0);
        
        // Also unlock any customer accounts that might be locked
        const lockedCustomers = await User.find({ 
            role: 'customer',
            $or: [
                { isLocked: true },
                { lockUntil: { $exists: true, $ne: null } }
            ]
        });
        
        if (lockedCustomers.length > 0) {
            console.log(`\n🔓 Unlocking ${lockedCustomers.length} customer accounts...`);
            
            for (const customer of lockedCustomers) {
                await User.findByIdAndUpdate(customer._id, {
                    isLocked: false,
                    lockUntil: null,
                    failedLoginAttempts: 0,
                    lastFailedLogin: null
                });
                console.log(`✅ Unlocked ${customer.name} (${customer.email})`);
            }
        } else {
            console.log('\n✅ No customer accounts are locked');
        }
        
        console.log('\n📋 Login Credentials:');
        console.log('===================');
        console.log('🔑 ADMIN:');
        console.log('Email: mdhidayatullahsheikh786@gmail.com');
        console.log('Password: Mdhidayat786@');
        console.log('');
        console.log('👤 CUSTOMER:');
        console.log('Email: john@example.com');
        console.log('Password: Password123@');
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        console.log('\n🎉 All accounts unlocked! You can now try logging in again.');
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

unlockAdminAccount();
