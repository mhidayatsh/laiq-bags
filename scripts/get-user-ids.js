const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

async function getUserIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const users = await User.find({}, '_id name email role');
        
        console.log('\n👥 Users in Database:');
        console.log('===================');
        
        users.forEach(user => {
            console.log(`${user.role.toUpperCase()}:`);
            console.log(`  ID: ${user._id}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Email: ${user.email}`);
            console.log('');
        });
        
        // Show admin and customer separately
        const admin = users.find(u => u.role === 'admin');
        const customers = users.filter(u => u.role === 'customer');
        
        console.log('🔑 ADMIN USER:');
        console.log('=============');
        if (admin) {
            console.log(`ID: ${admin._id}`);
            console.log(`Name: ${admin.name}`);
            console.log(`Email: ${admin.email}`);
        }
        
        console.log('\n👤 CUSTOMER USERS:');
        console.log('==================');
        customers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.name}:`);
            console.log(`   ID: ${customer._id}`);
            console.log(`   Email: ${customer.email}`);
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

getUserIds();
