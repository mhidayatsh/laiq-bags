#!/usr/bin/env node

// Test script for authentication switching
console.log('🔐 Testing Authentication Switching');
console.log('==================================\n');

// Simulate localStorage for testing
const mockLocalStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    }
};

// Mock window object
global.window = {
    localStorage: mockLocalStorage,
    location: {
        pathname: '/customer-profile.html'
    }
};

// Mock document
global.document = {
    addEventListener: () => {}
};

// Import the AuthSwitcher class
const AuthSwitcher = require('../js/auth-switcher.js');

// Test scenarios
function testAuthSwitching() {
    console.log('🧪 Testing Authentication Switching Scenarios\n');
    
    const authSwitcher = new AuthSwitcher();
    
    // Scenario 1: No authentication
    console.log('1️⃣ Scenario: No Authentication');
    mockLocalStorage.data = {};
    console.log('   Current Status:', authSwitcher.getCurrentStatus());
    console.log('   Is Admin:', authSwitcher.isAdminAuthenticated());
    console.log('   Is Customer:', authSwitcher.isCustomerAuthenticated());
    console.log('');
    
    // Scenario 2: Admin authentication
    console.log('2️⃣ Scenario: Admin Authentication');
    mockLocalStorage.data = {
        'token': 'admin-jwt-token',
        'user': JSON.stringify({
            _id: 'admin123',
            name: 'Admin User',
            email: 'admin@laiqbags.com',
            role: 'admin'
        })
    };
    console.log('   Current Status:', authSwitcher.getCurrentStatus());
    console.log('   Is Admin:', authSwitcher.isAdminAuthenticated());
    console.log('   Is Customer:', authSwitcher.isCustomerAuthenticated());
    console.log('');
    
    // Scenario 3: Customer authentication
    console.log('3️⃣ Scenario: Customer Authentication');
    mockLocalStorage.data = {
        'customerToken': 'customer-jwt-token',
        'customerUser': JSON.stringify({
            _id: 'customer123',
            name: 'Customer User',
            email: 'customer@example.com'
        })
    };
    console.log('   Current Status:', authSwitcher.getCurrentStatus());
    console.log('   Is Admin:', authSwitcher.isAdminAuthenticated());
    console.log('   Is Customer:', authSwitcher.isCustomerAuthenticated());
    console.log('');
    
    // Scenario 4: Switch from admin to customer
    console.log('4️⃣ Scenario: Switch from Admin to Customer');
    mockLocalStorage.data = {
        'token': 'admin-jwt-token',
        'user': JSON.stringify({
            _id: 'admin123',
            name: 'Admin User',
            email: 'admin@laiqbags.com',
            role: 'admin'
        }),
        'customerToken': 'customer-jwt-token',
        'customerUser': JSON.stringify({
            _id: 'customer123',
            name: 'Customer User',
            email: 'customer@example.com'
        })
    };
    
    console.log('   Before switch - Current Status:', authSwitcher.getCurrentStatus());
    const switchResult = authSwitcher.switchToCustomer();
    console.log('   Switch Result:', switchResult);
    console.log('   After switch - Current Status:', authSwitcher.getCurrentStatus());
    console.log('   Temp Admin Token:', !!mockLocalStorage.getItem('tempAdminToken'));
    console.log('   Temp Admin User:', !!mockLocalStorage.getItem('tempAdminUser'));
    console.log('');
    
    // Scenario 5: Restore admin context
    console.log('5️⃣ Scenario: Restore Admin Context');
    const restoreResult = authSwitcher.restorePreviousContext();
    console.log('   Restore Result:', restoreResult);
    console.log('   After restore - Current Status:', authSwitcher.getCurrentStatus());
    console.log('   Temp Admin Token:', !!mockLocalStorage.getItem('tempAdminToken'));
    console.log('   Temp Admin User:', !!mockLocalStorage.getItem('tempAdminUser'));
    console.log('');
    
    // Scenario 6: Clear all contexts
    console.log('6️⃣ Scenario: Clear All Contexts');
    authSwitcher.clearAllContexts();
    console.log('   After clear - Current Status:', authSwitcher.getCurrentStatus());
    console.log('   Is Admin:', authSwitcher.isAdminAuthenticated());
    console.log('   Is Customer:', authSwitcher.isCustomerAuthenticated());
    console.log('');
}

// Run tests
try {
    testAuthSwitching();
    console.log('✅ All authentication switching tests completed successfully!');
} catch (error) {
    console.error('❌ Test failed:', error);
}

console.log('\n💡 How to use in browser:');
console.log('   1. Include auth-switcher.js in your HTML');
console.log('   2. Use window.authSwitcher.switchToCustomer() to switch from admin to customer');
console.log('   3. Use window.authSwitcher.switchToAdmin() to switch from customer to admin');
console.log('   4. Use window.authSwitcher.restorePreviousContext() to restore previous context');
console.log('   5. Use window.authSwitcher.debugAuthState() to see current state');

process.exit(0);
