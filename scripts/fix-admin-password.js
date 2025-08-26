const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function fixAdminPassword() {
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
        console.log('Current password hash exists:', !!admin.password);
        console.log('Current password hash length:', admin.password ? admin.password.length : 0);
        
        // Create new password hash
        const adminPassword = 'Mdhidayat786@';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        // Update admin password
        await User.findByIdAndUpdate(admin._id, { password: hashedPassword });
        
        console.log('✅ Admin password updated successfully');
        
        // Verify the update
        const updatedAdmin = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' });
        console.log('Updated password hash exists:', !!updatedAdmin.password);
        console.log('Updated password hash length:', updatedAdmin.password ? updatedAdmin.password.length : 0);
        
        // Test password verification
        const isPasswordValid = await bcrypt.compare(adminPassword, updatedAdmin.password);
        console.log('Password verification test:', isPasswordValid);
        
        if (isPasswordValid) {
            console.log('✅ Admin login should now work');
            console.log('\n📋 Admin Login Credentials:');
            console.log('Email: mdhidayatullahsheikh786@gmail.com');
            console.log('Password: Mdhidayat786@');
        }
        
        // Also fix customer passwords
        console.log('\n👤 Fixing customer passwords...');
        
        const customers = await User.find({ role: 'customer' });
        const customerPassword = 'Password123@';
        const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);
        
        for (const customer of customers) {
            await User.findByIdAndUpdate(customer._id, { password: hashedCustomerPassword });
            console.log(`✅ Updated password for ${customer.name} (${customer.email})`);
        }
        
        console.log('\n📋 Customer Login Credentials:');
        console.log('Email: john@example.com (or any customer email)');
        console.log('Password: Password123@');
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        console.log('\n🎉 All login issues should now be resolved!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

fixAdminPassword();
