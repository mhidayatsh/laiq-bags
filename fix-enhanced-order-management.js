// Enhanced Order Management Fix Script
console.log('🔧 Enhanced Order Management Fix Script');
console.log('=====================================');

// Fix 1: Add missing getAdminDashboard function to API
function fixMissingApiFunctions() {
    console.log('🔧 Fix 1: Adding missing API functions...');
    
    if (typeof api !== 'undefined') {
        // Add getAdminDashboard function if it doesn't exist
        if (!api.getAdminDashboard) {
            api.getAdminDashboard = async function() {
                return await this.request('/admin/dashboard');
            };
            console.log('✅ Added getAdminDashboard function');
        }
        
        // Add getDashboardStats function if it doesn't exist (for backward compatibility)
        if (!api.getDashboardStats) {
            api.getDashboardStats = async function() {
                return await this.request('/admin/dashboard');
            };
            console.log('✅ Added getDashboardStats function');
        }
    } else {
        console.log('❌ API service not available');
    }
}

// Fix 2: Improve authentication checking
function fixAuthenticationLogic() {
    console.log('🔧 Fix 2: Improving authentication logic...');
    
    // Override the checkAdminAuth function in enhanced-order-management.js
    if (typeof checkAdminAuth !== 'undefined') {
        const originalCheckAdminAuth = checkAdminAuth;
        
        window.checkAdminAuth = async function() {
            let token = localStorage.getItem('token'); // Admin token
            let user = localStorage.getItem('user'); // Admin user
            
            console.log('🔍 Checking admin authentication for enhanced order management...');
            console.log('🔑 Admin token exists:', !!token);
            console.log('👤 Admin user data exists:', !!user);
            
            // Check if customer is also logged in
            const customerToken = localStorage.getItem('customerToken');
            const customerUser = localStorage.getItem('customerUser');
            
            if (customerToken && customerUser) {
                console.log('⚠️ Customer session detected alongside admin session');
            }
            
            // If no admin token, check for customer token (might be logged in as customer)
            if (!token) {
                console.log('🔑 Customer token exists:', !!customerToken);
                console.log('👤 Customer user data exists:', !!customerUser);
                
                if (customerToken && customerUser) {
                    try {
                        const customerData = JSON.parse(customerUser);
                        console.log('👤 Customer data:', customerData);
                        
                        // Check if customer is actually an admin
                        if (customerData.role === 'admin') {
                            console.log('✅ Customer is actually admin, using customer token');
                            token = customerToken;
                            user = customerUser;
                        } else {
                            console.log('❌ Customer is not admin, redirecting to login');
                            showToast('Please login as admin to access enhanced order management', 'error');
                            setTimeout(() => {
                                window.location.href = '/admin-login.html';
                            }, 2000);
                            return false;
                        }
                    } catch (error) {
                        console.error('❌ Error parsing customer data:', error);
                        showToast('Authentication error. Please login again.', 'error');
                        setTimeout(() => {
                            window.location.href = '/admin-login.html';
                        }, 2000);
                        return false;
                    }
                } else {
                    console.log('❌ No authentication found, redirecting to login');
                    showToast('Please login as admin to access enhanced order management', 'error');
                    setTimeout(() => {
                        window.location.href = '/admin-login.html';
                    }, 2000);
                    return false;
                }
            }
            
            // Verify the user data we have is actually an admin
            if (token && user) {
                try {
                    const userData = JSON.parse(user);
                    if (userData.role !== 'admin') {
                        console.log('❌ User is not admin, redirecting to login');
                        showToast('Please login as admin to access enhanced order management', 'error');
                        setTimeout(() => {
                            window.location.href = '/admin-login.html';
                        }, 2000);
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Error parsing user data:', error);
                    showToast('Authentication error. Please login again.', 'error');
                    setTimeout(() => {
                        window.location.href = '/admin-login.html';
                    }, 2000);
                    return false;
                }
            }
            
            if (!token || !user) {
                console.log('❌ Invalid authentication, redirecting to login');
                showToast('Please login as admin to access enhanced order management', 'error');
                return false;
            }
            
            console.log('✅ Admin authentication verified');
            return true;
        };
        
        console.log('✅ Updated checkAdminAuth function');
    } else {
        console.log('⚠️ checkAdminAuth function not found, will be created when needed');
    }
}

// Fix 3: Fix loadStatistics function
function fixLoadStatistics() {
    console.log('🔧 Fix 3: Fixing loadStatistics function...');
    
    // Override the loadStatistics function
    window.loadStatistics = async function() {
        try {
            const response = await api.getAdminDashboard();
            if (response.success) {
                const data = response.data;
                
                // Update statistics based on available data
                if (document.getElementById('total-orders')) {
                    document.getElementById('total-orders').textContent = data.totalOrders || 0;
                }
                
                if (document.getElementById('pending-orders')) {
                    // Calculate pending orders from recent orders
                    const pendingOrders = data.recentOrders?.filter(order => 
                        ['pending', 'processing', 'confirmed'].includes(order.status)
                    ).length || 0;
                    document.getElementById('pending-orders').textContent = pendingOrders;
                }
                
                if (document.getElementById('total-revenue')) {
                    document.getElementById('total-revenue').textContent = `₹${(data.totalRevenue || 0).toLocaleString()}`;
                }
                
                if (document.getElementById('delivered-today')) {
                    // Calculate delivered today from recent orders
                    const today = new Date().toDateString();
                    const deliveredToday = data.recentOrders?.filter(order => 
                        order.status === 'delivered' && 
                        new Date(order.createdAt).toDateString() === today
                    ).length || 0;
                    document.getElementById('delivered-today').textContent = deliveredToday;
                }
            }
        } catch (error) {
            console.error('❌ Error loading statistics:', error);
        }
    };
    
    console.log('✅ Updated loadStatistics function');
}

// Fix 4: Add error handling for API calls
function fixApiErrorHandling() {
    console.log('🔧 Fix 4: Adding better API error handling...');
    
    // Override the loadOrders function with better error handling
    if (typeof loadOrders !== 'undefined') {
        const originalLoadOrders = loadOrders;
        
        window.loadOrders = async function() {
            try {
                const container = document.getElementById('orders-container');
                if (!container) {
                    console.log('⚠️ Orders container not found');
                    return;
                }
                
                container.innerHTML = `
                    <div class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                        <span class="ml-3 text-lg text-gray-600">Loading orders...</span>
                    </div>
                `;
                
                const params = new URLSearchParams({ page: currentPage, limit: 10 });
                if (filters.status) params.append('status', filters.status);
                if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
                if (filters.date) params.append('date', filters.date);
                if (filters.search) params.append('search', filters.search);
                
                const response = await api.getAdminOrders(`?${params.toString()}`);
                
                if (response.success) {
                    orders = response.orders || [];
                    totalPages = response.totalPages || 1;
                    renderOrders();
                    renderPagination();
                } else {
                    throw new Error(response.message || 'Failed to load orders');
                }
            } catch (error) {
                console.error('❌ Error loading orders:', error);
                
                // Check if it's an authentication error
                if (error.message && error.message.includes('Role') && error.message.includes('not allowed')) {
                    showToast('Authentication error. Please login as admin.', 'error');
                    setTimeout(() => {
                        window.location.href = '/admin-login.html';
                    }, 2000);
                    return;
                }
                
                showToast('Failed to load orders', 'error');
                
                const container = document.getElementById('orders-container');
                if (container) {
                    container.innerHTML = `
                        <div class="text-center py-12 text-red-500">
                            <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                            <p class="text-lg">Failed to load orders</p>
                            <p class="text-sm text-gray-600 mb-4">${error.message}</p>
                            <button onclick="loadOrders()" class="mt-4 bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors">
                                Try Again
                            </button>
                        </div>
                    `;
                }
            }
        };
        
        console.log('✅ Updated loadOrders function with better error handling');
    } else {
        console.log('⚠️ loadOrders function not found, will be created when needed');
    }
}

// Fix 5: Add showToast function if missing
function fixShowToast() {
    console.log('🔧 Fix 5: Adding showToast function if missing...');
    
    if (typeof showToast === 'undefined') {
        window.showToast = function(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
            
            // Set background color based on type
            switch (type) {
                case 'success':
                    toast.className += ' bg-green-500 text-white';
                    break;
                case 'error':
                    toast.className += ' bg-red-500 text-white';
                    break;
                case 'warning':
                    toast.className += ' bg-yellow-500 text-white';
                    break;
                default:
                    toast.className += ' bg-blue-500 text-white';
            }
            
            toast.textContent = message;
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        };
        
        console.log('✅ Added showToast function');
    } else {
        console.log('✅ showToast function already exists');
    }
}

// Fix 6: Initialize enhanced order management properly
function initializeEnhancedOrderManagement() {
    console.log('🔧 Fix 6: Initializing enhanced order management...');
    
    // Check if we're on the enhanced order management page
    if (window.location.pathname.includes('enhanced-order-management.html')) {
        console.log('🎯 On enhanced order management page, initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runInitialization);
        } else {
            runInitialization();
        }
    } else {
        console.log('⚠️ Not on enhanced order management page');
    }
}

function runInitialization() {
    console.log('🚀 Running enhanced order management initialization...');
    
    // Apply all fixes
    fixMissingApiFunctions();
    fixAuthenticationLogic();
    fixLoadStatistics();
    fixApiErrorHandling();
    fixShowToast();
    
    // Check authentication
    if (typeof checkAdminAuth === 'function') {
        checkAdminAuth().then(isAuthenticated => {
            if (isAuthenticated) {
                console.log('✅ Authentication successful, loading data...');
                
                // Load data if functions exist
                if (typeof loadOrders === 'function') {
                    loadOrders();
                }
                
                if (typeof loadStatistics === 'function') {
                    loadStatistics();
                }
                
                if (typeof initializeEventListeners === 'function') {
                    initializeEventListeners();
                }
                
                // Set up periodic refresh
                setInterval(() => {
                    if (typeof loadStatistics === 'function') {
                        loadStatistics();
                    }
                }, 30000);
                
            } else {
                console.log('❌ Authentication failed');
            }
        });
    } else {
        console.log('⚠️ checkAdminAuth function not available');
    }
}

// Fix 7: Add global error handler
function addGlobalErrorHandler() {
    console.log('🔧 Fix 7: Adding global error handler...');
    
    window.addEventListener('error', function(event) {
        console.error('🌐 Global error:', event.error);
        
        // Check if it's an authentication error
        if (event.error && event.error.message && 
            (event.error.message.includes('Role') || event.error.message.includes('403'))) {
            console.log('🔐 Authentication error detected, redirecting to login...');
            showToast('Authentication error. Please login as admin.', 'error');
            setTimeout(() => {
                window.location.href = '/admin-login.html';
            }, 2000);
        }
    });
    
    console.log('✅ Added global error handler');
}

// Main fix function
function runAllFixes() {
    console.log('🚀 Running all enhanced order management fixes...');
    
    fixMissingApiFunctions();
    fixAuthenticationLogic();
    fixLoadStatistics();
    fixApiErrorHandling();
    fixShowToast();
    addGlobalErrorHandler();
    initializeEnhancedOrderManagement();
    
    console.log('✅ All fixes applied successfully!');
}

// Auto-run fixes when script loads
runAllFixes();

// Export functions for manual use
window.fixEnhancedOrderManagement = {
    runAllFixes,
    fixMissingApiFunctions,
    fixAuthenticationLogic,
    fixLoadStatistics,
    fixApiErrorHandling,
    fixShowToast,
    addGlobalErrorHandler,
    initializeEnhancedOrderManagement
};

console.log('🎯 Available functions:');
console.log('- fixEnhancedOrderManagement.runAllFixes() - Run all fixes');
console.log('- fixEnhancedOrderManagement.fixMissingApiFunctions() - Fix API functions');
console.log('- fixEnhancedOrderManagement.fixAuthenticationLogic() - Fix authentication');
console.log('- fixEnhancedOrderManagement.fixLoadStatistics() - Fix statistics loading');
console.log('- fixEnhancedOrderManagement.fixApiErrorHandling() - Fix error handling');
console.log('- fixEnhancedOrderManagement.fixShowToast() - Fix toast notifications');
console.log('- fixEnhancedOrderManagement.addGlobalErrorHandler() - Add error handler');
console.log('- fixEnhancedOrderManagement.initializeEnhancedOrderManagement() - Initialize system');
