const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Test admin login
        console.log('\n🔑 Testing Admin Login:');
        console.log('=====================');
        
        const adminEmail = 'mdhidayatullahsheikh786@gmail.com';
        const adminPassword = 'Mdhidayat786@';
        
        const admin = await User.findOne({ email: adminEmail });
        
        if (!admin) {
            console.log('❌ Admin user not found in database');
            return;
        }
        
        console.log('✅ Admin user found in database');
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Password hash exists:', !!admin.password);
        console.log('Password hash length:', admin.password ? admin.password.length : 0);
        
        // Test password verification
        const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
        console.log('Password verification result:', isPasswordValid);
        
        if (isPasswordValid) {
            console.log('✅ Admin login credentials are valid');
        } else {
            console.log('❌ Admin password is incorrect');
            
            // Try to create a new admin with correct password
            console.log('\n🔄 Creating new admin with correct password...');
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            
            // Update admin password
            await User.findByIdAndUpdate(admin._id, { password: hashedPassword });
            console.log('✅ Admin password updated successfully');
        }
        
        // Test customer login
        console.log('\n👤 Testing Customer Login:');
        console.log('========================');
        
        const customerEmail = 'john@example.com';
        const customerPassword = 'Password123@';
        
        const customer = await User.findOne({ email: customerEmail });
        
        if (!customer) {
            console.log('❌ Customer user not found in database');
            return;
        }
        
        console.log('✅ Customer user found in database');
        console.log('Email:', customer.email);
        console.log('Role:', customer.role);
        console.log('Password hash exists:', !!customer.password);
        console.log('Password hash length:', customer.password ? customer.password.length : 0);
        
        // Test password verification
        const isCustomerPasswordValid = await bcrypt.compare(customerPassword, customer.password);
        console.log('Password verification result:', isCustomerPasswordValid);
        
        if (isCustomerPasswordValid) {
            console.log('✅ Customer login credentials are valid');
        } else {
            console.log('❌ Customer password is incorrect');
            
            // Try to create a new customer with correct password
            console.log('\n🔄 Creating new customer with correct password...');
            const hashedCustomerPassword = await bcrypt.hash(customerPassword, 12);
            
            // Update customer password
            await User.findByIdAndUpdate(customer._id, { password: hashedCustomerPassword });
            console.log('✅ Customer password updated successfully');
        }
        
        // Show all users
        console.log('\n👥 All Users in Database:');
        console.log('========================');
        const allUsers = await User.find({}, 'name email role');
        allUsers.forEach(user => {
            console.log(`${user.role.toUpperCase()}: ${user.name} (${user.email})`);
        });
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

testLogin();
