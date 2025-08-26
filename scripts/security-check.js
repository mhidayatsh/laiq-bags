const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function securityCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        console.log('\n🔒 ADMIN SECURITY CHECK');
        console.log('======================');
        
        // Check admin user
        const admin = await User.findOne({ email: 'mdhidayatullahsheikh786@gmail.com' }).select('+password');
        
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log('✅ Admin user found');
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Email verified:', admin.emailVerified || false);
        
        // Password security check
        console.log('\n🔐 PASSWORD SECURITY:');
        console.log('====================');
        console.log('Password hash exists:', !!admin.password);
        console.log('Password hash length:', admin.password ? admin.password.length : 0);
        console.log('Password hash starts with $2b$:', admin.password ? admin.password.startsWith('$2b$') : false);
        console.log('Password hash format valid:', admin.password ? /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(admin.password) : false);
        
        // Test password verification
        const testPassword = 'Mdhidayat786@';
        const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
        console.log('Password verification test:', isPasswordValid);
        
        // Account lock status
        console.log('\n🔒 ACCOUNT LOCK STATUS:');
        console.log('======================');
        console.log('Account locked:', admin.isLocked || false);
        console.log('Lock until:', admin.lockUntil || 'Not locked');
        console.log('Failed login attempts:', admin.failedLoginAttempts || 0);
        console.log('Last failed login:', admin.lastFailedLogin || 'None');
        
        // Security features
        console.log('\n🛡️ SECURITY FEATURES:');
        console.log('====================');
        console.log('Password changed at:', admin.passwordChangedAt || 'Not set');
        console.log('Password history count:', admin.passwordHistory ? admin.passwordHistory.length : 0);
        console.log('Account created:', admin.createdAt);
        console.log('Last updated:', admin.updatedAt);
        
        // Environment security
        console.log('\n🌐 ENVIRONMENT SECURITY:');
        console.log('========================');
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
        console.log('ENCRYPTION_KEY exists:', !!process.env.ENCRYPTION_KEY);
        console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        // Security recommendations
        console.log('\n📋 SECURITY RECOMMENDATIONS:');
        console.log('============================');
        
        let securityScore = 0;
        const totalChecks = 8;
        
        if (admin.password && admin.password.startsWith('$2b$')) {
            console.log('✅ Password properly hashed with bcrypt');
            securityScore++;
        } else {
            console.log('❌ Password not properly hashed');
        }
        
        if (admin.password && admin.password.length >= 60) {
            console.log('✅ Password hash length is secure');
            securityScore++;
        } else {
            console.log('❌ Password hash length is insufficient');
        }
        
        if (isPasswordValid) {
            console.log('✅ Password verification working correctly');
            securityScore++;
        } else {
            console.log('❌ Password verification failed');
        }
        
        if (!admin.isLocked) {
            console.log('✅ Account is not locked');
            securityScore++;
        } else {
            console.log('❌ Account is currently locked');
        }
        
        if (admin.emailVerified) {
            console.log('✅ Email is verified');
            securityScore++;
        } else {
            console.log('⚠️ Email not verified (consider enabling)');
        }
        
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
            console.log('✅ JWT_SECRET is properly configured');
            securityScore++;
        } else {
            console.log('❌ JWT_SECRET needs improvement');
        }
        
        if (process.env.ENCRYPTION_KEY) {
            console.log('✅ ENCRYPTION_KEY is configured');
            securityScore++;
        } else {
            console.log('❌ ENCRYPTION_KEY not configured');
        }
        
        if (process.env.NODE_ENV === 'production') {
            console.log('✅ Running in production mode');
            securityScore++;
        } else {
            console.log('⚠️ Not running in production mode');
        }
        
        console.log(`\n🎯 SECURITY SCORE: ${securityScore}/${totalChecks} (${Math.round(securityScore/totalChecks*100)}%)`);
        
        if (securityScore >= 7) {
            console.log('🟢 EXCELLENT - Your admin account is well secured!');
        } else if (securityScore >= 5) {
            console.log('🟡 GOOD - Your admin account is reasonably secure');
        } else {
            console.log('🔴 NEEDS IMPROVEMENT - Consider enhancing security');
        }
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

securityCheck();
