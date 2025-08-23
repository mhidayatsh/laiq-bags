// Test script to debug authentication issues and switch between customer/admin sessions
console.log('🔍 Authentication Debug Tool');
console.log('============================');

// Check current authentication state
function checkAuthState() {
    console.log('\n📊 Current Authentication State:');
    console.log('--------------------------------');
    
    const adminToken = localStorage.getItem('token');
    const adminUser = localStorage.getItem('user');
    const customerToken = localStorage.getItem('customerToken');
    const customerUser = localStorage.getItem('customerUser');
    
    console.log('🔑 Admin Token:', adminToken ? '✅ Present' : '❌ Missing');
    console.log('👤 Admin User:', adminUser ? '✅ Present' : '❌ Missing');
    console.log('🔑 Customer Token:', customerToken ? '✅ Present' : '❌ Missing');
    console.log('👤 Customer User:', customerUser ? '✅ Present' : '❌ Missing');
    
    if (adminUser) {
        try {
            const userData = JSON.parse(adminUser);
            console.log('👤 Admin Role:', userData.role || 'N/A');
            console.log('👤 Admin Email:', userData.email || 'N/A');
        } catch (error) {
            console.log('❌ Error parsing admin user data:', error.message);
        }
    }
    
    if (customerUser) {
        try {
            const userData = JSON.parse(customerUser);
            console.log('👤 Customer Role:', userData.role || 'N/A');
            console.log('👤 Customer Email:', userData.email || 'N/A');
        } catch (error) {
            console.log('❌ Error parsing customer user data:', error.message);
        }
    }
}

// Clear all authentication
function clearAllAuth() {
    console.log('\n🧹 Clearing all authentication...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    console.log('✅ All authentication cleared');
    checkAuthState();
}

// Switch to admin authentication (if available)
function switchToAdmin() {
    console.log('\n🔄 Switching to admin authentication...');
    const adminToken = localStorage.getItem('token');
    const adminUser = localStorage.getItem('user');
    
    if (adminToken && adminUser) {
        try {
            const userData = JSON.parse(adminUser);
            if (userData.role === 'admin') {
                console.log('✅ Switching to admin session');
                // Clear customer session
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerUser');
                checkAuthState();
                return true;
            } else {
                console.log('❌ Admin user is not actually an admin');
                return false;
            }
        } catch (error) {
            console.log('❌ Error parsing admin user data:', error.message);
            return false;
        }
    } else {
        console.log('❌ No admin authentication available');
        return false;
    }
}

// Switch to customer authentication (if available)
function switchToCustomer() {
    console.log('\n🔄 Switching to customer authentication...');
    const customerToken = localStorage.getItem('customerToken');
    const customerUser = localStorage.getItem('customerUser');
    
    if (customerToken && customerUser) {
        console.log('✅ Switching to customer session');
        // Clear admin session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        checkAuthState();
        return true;
    } else {
        console.log('❌ No customer authentication available');
        return false;
    }
}

// Test API calls
async function testApiCalls() {
    console.log('\n🧪 Testing API calls...');
    console.log('------------------------');
    
    try {
        // Test admin dashboard
        console.log('📊 Testing admin dashboard...');
        const dashboardResponse = await api.getAdminDashboard();
        console.log('✅ Dashboard response:', dashboardResponse.success ? 'Success' : 'Failed');
        if (dashboardResponse.success) {
            console.log('📈 Data available:', Object.keys(dashboardResponse.data || {}));
        }
    } catch (error) {
        console.log('❌ Dashboard error:', error.message);
    }
    
    try {
        // Test admin orders
        console.log('📦 Testing admin orders...');
        const ordersResponse = await api.getAdminOrders('?page=1&limit=5');
        console.log('✅ Orders response:', ordersResponse.success ? 'Success' : 'Failed');
        if (ordersResponse.success) {
            console.log('📦 Orders count:', ordersResponse.orders?.length || 0);
        }
    } catch (error) {
        console.log('❌ Orders error:', error.message);
    }
}

// Initialize
checkAuthState();

// Add global functions for easy access
window.checkAuthState = checkAuthState;
window.clearAllAuth = clearAllAuth;
window.switchToAdmin = switchToAdmin;
window.switchToCustomer = switchToCustomer;
window.testApiCalls = testApiCalls;

console.log('\n🎯 Available commands:');
console.log('- checkAuthState() - Check current authentication state');
console.log('- clearAllAuth() - Clear all authentication');
console.log('- switchToAdmin() - Switch to admin session');
console.log('- switchToCustomer() - Switch to customer session');
console.log('- testApiCalls() - Test API calls');
