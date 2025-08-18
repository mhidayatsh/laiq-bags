// Auth Switcher Utility
// Handles switching between admin and customer authentication contexts

class AuthSwitcher {
    constructor() {
        this.adminTokenKey = 'token';
        this.customerTokenKey = 'customerToken';
        this.adminUserKey = 'user';
        this.customerUserKey = 'customerUser';
    }

    // Check if user is currently authenticated as admin
    isAdminAuthenticated() {
        const token = localStorage.getItem(this.adminTokenKey);
        const user = localStorage.getItem(this.adminUserKey);
        
        if (!token || !user) return false;
        
        try {
            const userData = JSON.parse(user);
            return userData.role === 'admin';
        } catch (error) {
            return false;
        }
    }

    // Check if user is currently authenticated as customer
    isCustomerAuthenticated() {
        const token = localStorage.getItem(this.customerTokenKey);
        const user = localStorage.getItem(this.customerUserKey);
        
        return !!(token && user);
    }

    // Switch to customer context (from admin)
    switchToCustomer() {
        console.log('🔄 Switching from admin to customer context...');
        
        // Store admin context temporarily
        const adminToken = localStorage.getItem(this.adminTokenKey);
        const adminUser = localStorage.getItem(this.adminUserKey);
        
        if (adminToken && adminUser) {
            localStorage.setItem('tempAdminToken', adminToken);
            localStorage.setItem('tempAdminUser', adminUser);
            console.log('💾 Admin context saved temporarily');
        }
        
        // Clear admin context
        localStorage.removeItem(this.adminTokenKey);
        localStorage.removeItem(this.adminUserKey);
        
        // Check if customer context exists
        if (this.isCustomerAuthenticated()) {
            console.log('✅ Switched to customer context');
            return true;
        } else {
            console.log('⚠️ No customer context found, redirecting to login');
            return false;
        }
    }

    // Switch to admin context (from customer)
    switchToAdmin() {
        console.log('🔄 Switching from customer to admin context...');
        
        // Store customer context temporarily
        const customerToken = localStorage.getItem(this.customerTokenKey);
        const customerUser = localStorage.getItem(this.customerUserKey);
        
        if (customerToken && customerUser) {
            localStorage.setItem('tempCustomerToken', customerToken);
            localStorage.setItem('tempCustomerUser', customerUser);
            console.log('💾 Customer context saved temporarily');
        }
        
        // Clear customer context
        localStorage.removeItem(this.customerTokenKey);
        localStorage.removeItem(this.customerUserKey);
        
        // Check if admin context exists
        if (this.isAdminAuthenticated()) {
            console.log('✅ Switched to admin context');
            return true;
        } else {
            console.log('⚠️ No admin context found, redirecting to login');
            return false;
        }
    }

    // Restore previous context
    restorePreviousContext() {
        console.log('🔄 Restoring previous context...');
        
        // Try to restore admin context
        const tempAdminToken = localStorage.getItem('tempAdminToken');
        const tempAdminUser = localStorage.getItem('tempAdminUser');
        
        if (tempAdminToken && tempAdminUser) {
            localStorage.setItem(this.adminTokenKey, tempAdminToken);
            localStorage.setItem(this.adminUserKey, tempAdminUser);
            localStorage.removeItem('tempAdminToken');
            localStorage.removeItem('tempAdminUser');
            console.log('✅ Admin context restored');
            return 'admin';
        }
        
        // Try to restore customer context
        const tempCustomerToken = localStorage.getItem('tempCustomerToken');
        const tempCustomerUser = localStorage.getItem('tempCustomerUser');
        
        if (tempCustomerToken && tempCustomerUser) {
            localStorage.setItem(this.customerTokenKey, tempCustomerToken);
            localStorage.setItem(this.customerUserKey, tempCustomerUser);
            localStorage.removeItem('tempCustomerToken');
            localStorage.removeItem('tempCustomerUser');
            console.log('✅ Customer context restored');
            return 'customer';
        }
        
        console.log('⚠️ No previous context to restore');
        return null;
    }

    // Clear all authentication contexts
    clearAllContexts() {
        console.log('🧹 Clearing all authentication contexts...');
        
        // Clear current contexts
        localStorage.removeItem(this.adminTokenKey);
        localStorage.removeItem(this.adminUserKey);
        localStorage.removeItem(this.customerTokenKey);
        localStorage.removeItem(this.customerUserKey);
        
        // Clear temporary contexts
        localStorage.removeItem('tempAdminToken');
        localStorage.removeItem('tempAdminUser');
        localStorage.removeItem('tempCustomerToken');
        localStorage.removeItem('tempCustomerUser');
        
        console.log('✅ All contexts cleared');
    }

    // Get current authentication status
    getCurrentStatus() {
        const isAdmin = this.isAdminAuthenticated();
        const isCustomer = this.isCustomerAuthenticated();
        
        if (isAdmin) return 'admin';
        if (isCustomer) return 'customer';
        return 'none';
    }

    // Debug: Log current authentication state
    debugAuthState() {
        console.log('🔍 Current Authentication State:');
        console.log('   Admin Token:', !!localStorage.getItem(this.adminTokenKey));
        console.log('   Admin User:', !!localStorage.getItem(this.adminUserKey));
        console.log('   Customer Token:', !!localStorage.getItem(this.customerTokenKey));
        console.log('   Customer User:', !!localStorage.getItem(this.customerUserKey));
        console.log('   Current Status:', this.getCurrentStatus());
        
        // Log temporary contexts
        console.log('   Temp Admin Token:', !!localStorage.getItem('tempAdminToken'));
        console.log('   Temp Customer Token:', !!localStorage.getItem('tempCustomerToken'));
    }
}

// Create global instance
window.authSwitcher = new AuthSwitcher();

// Auto-detect page type and switch context if needed
function autoSwitchContext() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('admin') || currentPath.includes('admin-')) {
        // Admin page - ensure admin context
        if (authSwitcher.getCurrentStatus() === 'customer') {
            console.log('🔄 Auto-switching to admin context for admin page');
            authSwitcher.switchToAdmin();
        }
    } else if (currentPath.includes('customer') || currentPath.includes('profile')) {
        // Customer page - ensure customer context
        if (authSwitcher.getCurrentStatus() === 'admin') {
            console.log('🔄 Auto-switching to customer context for customer page');
            authSwitcher.switchToCustomer();
        }
    }
}

// Run auto-switch on page load
document.addEventListener('DOMContentLoaded', autoSwitchContext);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSwitcher;
}
