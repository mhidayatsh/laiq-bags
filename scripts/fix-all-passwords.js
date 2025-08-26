const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function fixAllPasswords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Fix admin password
        console.log('\n🔑 Fixing Admin Password:');
        console.log('========================');
        
        const adminEmail = 'mdhidayatullahsheikh786@gmail.com';
        const adminPassword = 'Mdhidayat786@';
        
        // Find admin with password field included
        let admin = await User.findOne({ email: adminEmail }).select('+password');
        
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log('✅ Admin user found');
        console.log('Current password hash exists:', !!admin.password);
        console.log('Current password hash length:', admin.password ? admin.password.length : 0);
        
        // Create new password hash
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
        
        // Update admin password
        await User.findByIdAndUpdate(admin._id, { 
            password: hashedAdminPassword,
            passwordChangedAt: new Date()
        });
        
        console.log('✅ Admin password updated successfully');
        
        // Verify the update
        admin = await User.findOne({ email: adminEmail }).select('+password');
        console.log('Updated password hash exists:', !!admin.password);
        console.log('Updated password hash length:', admin.password ? admin.password.length : 0);
        
        // Test password verification
        const isAdminPasswordValid = await bcrypt.compare(adminPassword, admin.password);
        console.log('Admin password verification test:', isAdminPasswordValid);
        
        if (isAdminPasswordValid) {
            console.log('✅ Admin login should now work');
        }
        
        // Fix customer passwords
        console.log('\n👤 Fixing Customer Passwords:');
        console.log('============================');
        
        const customerPassword = 'Password123@';
        const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);
        
        // Get all customers
        const customers = await User.find({ role: 'customer' }).select('+password');
        
        for (const customer of customers) {
            console.log(`Processing ${customer.name} (${customer.email})...`);
            console.log('Current password hash exists:', !!customer.password);
            console.log('Current password hash length:', customer.password ? customer.password.length : 0);
            
            // Update customer password
            await User.findByIdAndUpdate(customer._id, { 
                password: hashedCustomerPassword,
                passwordChangedAt: new Date()
            });
            
            console.log(`✅ Updated password for ${customer.name}`);
        }
        
        // Verify customer passwords
        console.log('\n🔍 Verifying Customer Passwords:');
        console.log('===============================');
        
        const updatedCustomers = await User.find({ role: 'customer' }).select('+password');
        
        for (const customer of updatedCustomers) {
            const isCustomerPasswordValid = await bcrypt.compare(customerPassword, customer.password);
            console.log(`${customer.name} (${customer.email}): ${isCustomerPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
        }
        
        // Show final status
        console.log('\n📋 Final Login Credentials:');
        console.log('==========================');
        console.log('🔑 ADMIN:');
        console.log('Email: mdhidayatullahsheikh786@gmail.com');
        console.log('Password: Mdhidayat786@');
        console.log('');
        console.log('👤 CUSTOMERS:');
        console.log('Email: john@example.com (or any customer email)');
        console.log('Password: Password123@');
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        console.log('\n🎉 All login issues should now be resolved!');
        console.log('Try logging in with the credentials above.');
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

fixAllPasswords();
