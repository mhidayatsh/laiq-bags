const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
});

// Reset customer password
async function resetCustomerPassword() {
    try {
        console.log('🔑 Resetting customer password...');
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        const result = await User.updateOne(
            { email: 'mdhidayatullahsheikh786@gmail.com' },
            { $set: { password: hashedPassword } }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ Customer password reset successfully');
            console.log('🔑 New password: 123456');
        } else {
            console.log('❌ Customer password reset failed');
        }
    } catch (error) {
        console.error('❌ Error resetting customer password:', error);
    }
}

// Run the function
resetCustomerPassword().then(() => {
    mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
}); 