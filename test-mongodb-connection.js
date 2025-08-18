const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env.production' });

async function testConnection() {
    try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Set' : 'Missing');
        
        if (!process.env.MONGODB_URI) {
            console.log('❌ MONGODB_URI not found in environment variables');
            console.log('💡 Please set your MongoDB connection string in config.env.production');
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ MongoDB connected successfully!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);
        console.log('🔌 Port:', mongoose.connection.port);

        // Test a simple query
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 Collections found:', collections.length);
        
        if (collections.length > 0) {
            console.log('📋 Collection names:');
            collections.forEach(col => console.log(`   - ${col.name}`));
        }

        await mongoose.disconnect();
        console.log('✅ Connection test completed successfully!');

    } catch (error) {
        console.log('❌ MongoDB connection failed!');
        console.log('🔍 Error details:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log('🔐 Authentication Error: Check your username and password');
            console.log('💡 Make sure to update the password in your connection string');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('🌐 Network Error: Check your cluster URL');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('🚫 Connection Refused: Check your IP whitelist settings');
        }
    }
}

testConnection();
