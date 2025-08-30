// Shared Authentication Module
// Eliminates code duplication across Enhanced Order Management, Billing Management, and Shipping Management

class AuthModule {
    constructor() {
        this.isInitialized = false;
        this.authState = {
            isAuthenticated: false,
            userRole: null,
            userData: null,
            token: null
        };
        this.authCallbacks = [];
        this.autoRefreshInterval = null;
        this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry
    }

    // Initialize the authentication module
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🔐 Initializing Shared Authentication Module...');
        
        // Check existing authentication
        await this.checkExistingAuth();
        
        // Set up auto-refresh if authenticated
        if (this.authState.isAuthenticated) {
            this.setupAutoRefresh();
        }
        
        this.isInitialized = true;
        console.log('✅ Shared Authentication Module initialized');
    }

    // Check existing authentication from localStorage
    async checkExistingAuth() {
        const adminToken = localStorage.getItem('token');
        const adminUser = localStorage.getItem('user');
        const customerToken = localStorage.getItem('customerToken');
        const customerUser = localStorage.getItem('customerUser');

        // Check admin authentication first
        if (adminToken && adminUser) {
            try {
                const userData = JSON.parse(adminUser);
                if (userData.role === 'admin') {
                    this.authState = {
                        isAuthenticated: true,
                        userRole: 'admin',
                        userData: userData,
                        token: adminToken
                    };
                    console.log('✅ Admin authentication found');
                    return true;
                }
            } catch (error) {
                console.error('❌ Error parsing admin user data:', error);
            }
        }

        // Check customer authentication
        if (customerToken && customerUser) {
            try {
                const userData = JSON.parse(customerUser);
                if (userData.role === 'admin') {
                    // Customer is actually admin
                    this.authState = {
                        isAuthenticated: true,
                        userRole: 'admin',
                        userData: userData,
                        token: customerToken
                    };
                    console.log('✅ Customer with admin role found');
                    return true;
                } else if (userData.role === 'user') {
                    this.authState = {
                        isAuthenticated: true,
                        userRole: 'user',
                        userData: userData,
                        token: customerToken
                    };
                    console.log('✅ Customer authentication found');
                    return true;
                }
            } catch (error) {
                console.error('❌ Error parsing customer user data:', error);
            }
        }

        console.log('❌ No valid authentication found');
        return false;
    }

    // Check if user is authenticated as admin
    async checkAdminAuth() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.authState.isAuthenticated) {
            console.log('❌ User not authenticated');
            this.redirectToLogin('admin');
            return false;
        }

        if (this.authState.userRole !== 'admin') {
            console.log('❌ User is not admin');
            this.redirectToLogin('admin');
            return false;
        }

        // Check token expiry
        if (await this.isTokenExpired()) {
            console.log('❌ Token expired');
            await this.refreshToken();
            if (await this.isTokenExpired()) {
                this.redirectToLogin('admin');
                return false;
            }
        }

        console.log('✅ Admin authentication verified');
        return true;
    }

    // Check if user is authenticated as customer
    async checkCustomerAuth() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.authState.isAuthenticated) {
            console.log('❌ User not authenticated');
            this.redirectToLogin('customer');
            return false;
        }

        if (this.authState.userRole !== 'user') {
            console.log('❌ User is not customer');
            this.redirectToLogin('customer');
            return false;
        }

        // Check token expiry
        if (await this.isTokenExpired()) {
            console.log('❌ Token expired');
            await this.refreshToken();
            if (await this.isTokenExpired()) {
                this.redirectToLogin('customer');
                return false;
            }
        }

        console.log('✅ Customer authentication verified');
        return true;
    }

    // Check if token is expired
    async isTokenExpired() {
        if (!this.authState.token) return true;

        try {
            const payload = JSON.parse(atob(this.authState.token.split('.')[1]));
            const now = Date.now() / 1000;
            return payload.exp && payload.exp < now;
        } catch (error) {
            console.error('❌ Error checking token expiry:', error);
            return true;
        }
    }

    // Refresh authentication token
    async refreshToken() {
        try {
            console.log('🔄 Refreshing authentication token...');
            
            // Call refresh endpoint
            const response = await fetch('https://www.laiq.shop/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authState.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.token) {
                    this.authState.token = data.token;
                    
                    // Update localStorage
                    if (this.authState.userRole === 'admin') {
                        localStorage.setItem('token', data.token);
                    } else {
                        localStorage.setItem('customerToken', data.token);
                    }
                    
                    console.log('✅ Token refreshed successfully');
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Error refreshing token:', error);
        }

        return false;
    }

    // Setup automatic token refresh
    setupAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.autoRefreshInterval = setInterval(async () => {
            if (this.authState.isAuthenticated && await this.isTokenExpired()) {
                console.log('🔄 Auto-refreshing expired token...');
                await this.refreshToken();
            }
        }, 60000); // Check every minute
    }

    // Login user
    async login(email, password, userType = 'admin') {
        try {
            console.log(`🔐 Logging in as ${userType}...`);
            
            const endpoint = userType === 'admin' ? '/api/auth/admin/login' : '/api/auth/customer/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.token) {
                    // Update auth state
                    this.authState = {
                        isAuthenticated: true,
                        userRole: data.user.role,
                        userData: data.user,
                        token: data.token
                    };

                    // Store in localStorage
                    if (userType === 'admin') {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                    } else {
                        localStorage.setItem('customerToken', data.token);
                        localStorage.setItem('customerUser', JSON.stringify(data.user));
                    }

                    // Setup auto-refresh
                    this.setupAutoRefresh();

                    // Notify callbacks
                    this.notifyAuthChange();

                    console.log(`✅ ${userType} login successful`);
                    return { success: true, user: data.user };
                }
            }

            throw new Error('Login failed');
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            console.log('🚪 Logging out...');
            
            // Call logout endpoint
            if (this.authState.token) {
                await fetch('https://www.laiq.shop/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authState.token}`
                    }
                });
            }

            // Clear auth state
            this.authState = {
                isAuthenticated: false,
                userRole: null,
                userData: null,
                token: null
            };

            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customerUser');

            // Clear auto-refresh
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }

            // Notify callbacks
            this.notifyAuthChange();

            console.log('✅ Logout successful');
            return true;
        } catch (error) {
            console.error('❌ Logout error:', error);
            return false;
        }
    }

    // Get current authentication state
    getAuthState() {
        return { ...this.authState };
    }

    // Check if user has specific role
    hasRole(role) {
        return this.authState.isAuthenticated && this.authState.userRole === role;
    }

    // Check if user has permission
    hasPermission(permission) {
        if (!this.authState.isAuthenticated) return false;
        
        // Add permission logic here based on your requirements
        return this.authState.userRole === 'admin';
    }

    // Subscribe to authentication changes
    onAuthChange(callback) {
        this.authCallbacks.push(callback);
        return () => {
            const index = this.authCallbacks.indexOf(callback);
            if (index > -1) {
                this.authCallbacks.splice(index, 1);
            }
        };
    }

    // Notify all callbacks of auth changes
    notifyAuthChange() {
        this.authCallbacks.forEach(callback => {
            try {
                callback(this.getAuthState());
            } catch (error) {
                console.error('❌ Error in auth callback:', error);
            }
        });
    }

    // Redirect to appropriate login page
    redirectToLogin(userType) {
        const loginUrl = userType === 'admin' ? '/admin-login.html' : '/customer-login.html';
        
        // Show toast message
        if (typeof showToast === 'function') {
            showToast(`Please login as ${userType} to access this resource`, 'error');
        }
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = loginUrl;
        }, 2000);
    }

    // Get authorization header for API calls
    getAuthHeader() {
        if (this.authState.isAuthenticated && this.authState.token) {
            return { 'Authorization': `Bearer ${this.authState.token}` };
        }
        return {};
    }

    // Validate token format
    validateToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            
            const payload = JSON.parse(atob(parts[1]));
            return payload.exp && payload.iat && payload.id;
        } catch (error) {
            return false;
        }
    }

    // Clear all authentication data
    clearAllAuth() {
        console.log('🧹 Clearing all authentication data...');
        
        this.authState = {
            isAuthenticated: false,
            userRole: null,
            userData: null,
            token: null
        };

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerUser');

        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }

        this.notifyAuthChange();
        console.log('✅ All authentication data cleared');
    }
}

// Create global instance
const authModule = new AuthModule();

// Auto-initialize when module loads
authModule.initialize();

// Export for use in other modules
window.authModule = authModule;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authModule;
}

console.log('🔐 Shared Authentication Module loaded and ready');
