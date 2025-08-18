#!/usr/bin/env node

/**
 * Fix Authentication and Cart Loading Issues
 * This script addresses the 401 Unauthorized errors and missing loadUserCart function
 */

console.log('🔧 Starting authentication and cart loading fixes...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
    console.log('🌐 Browser environment detected');
    
    // Wait for DOM to be ready
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // Wait for scripts to load
    function waitForScripts() {
        return new Promise((resolve) => {
            const checkScripts = () => {
                if (window.authSwitcher && window.api && typeof window.loadCartFromBackend !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkScripts, 100);
                }
            };
            checkScripts();
        });
    }
    
    // Main fix function
    async function applyFixes() {
        console.log('⏳ Waiting for scripts to load...');
        await waitForScripts();
        console.log('✅ Scripts loaded, applying fixes...');
        
        // Fix 1: Add missing loadUserCart function
        if (typeof window.loadUserCart === 'undefined') {
            console.log('➕ Adding missing loadUserCart function...');
            
            window.loadUserCart = function() {
                try {
                    const userCartData = localStorage.getItem('userCart');
                    if (userCartData) {
                        try {
                            const userCart = JSON.parse(userCartData);
                            console.log('📥 Loaded user cart from localStorage:', userCart.length, 'items');
                            
                            // Normalize data structure
                            return userCart.map(item => ({
                                id: item.id || item.productId || 'unknown',
                                productId: item.productId || item.id || 'unknown',
                                name: item.name || 'Unknown Product',
                                price: parseFloat(item.price) || 0,
                                image: item.image || 'https://via.placeholder.com/56x56?text=Product',
                                qty: parseInt(item.qty) || parseInt(item.quantity) || 1,
                                color: item.color || null,
                            }));
                        } catch (parseError) {
                            console.error('❌ Error parsing user cart from localStorage:', parseError);
                            return [];
                        }
                    }
                    return [];
                } catch (error) {
                    console.error('❌ Error loading user cart:', error);
                    return [];
                }
            };
            
            console.log('✅ loadUserCart function added');
        }
        
        // Fix 2: Improve API service token handling
        if (window.api && window.api.request) {
            console.log('🔧 Improving API service token handling...');
            
            const originalRequest = window.api.request;
            window.api.request = async function(endpoint, options = {}) {
                // Get token from localStorage - check both admin and customer tokens
                let token = localStorage.getItem('token'); // Admin token
                if (!token) {
                    token = localStorage.getItem('customerToken'); // Customer token
                }
                
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                };

                // Add Authorization header if token exists
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                
                try {
                    const response = await originalRequest.call(this, endpoint, config);
                    return response;
                } catch (error) {
                    // Handle 401 errors gracefully
                    if (error.message && error.message.includes('Unauthorized')) {
                        console.log('🔐 User not authorized, clearing tokens...');
                        localStorage.removeItem('token');
                        localStorage.removeItem('customerToken');
                        localStorage.removeItem('user');
                        localStorage.removeItem('customerUser');
                        
                        // Don't throw error, return empty response for cart
                        if (endpoint.includes('/cart')) {
                            return { success: true, cart: { items: [] } };
                        }
                    }
                    throw error;
                }
            };
            
            console.log('✅ API service token handling improved');
        }
        
        // Fix 3: Improve cart loading error handling
        if (typeof window.loadCartFromBackend !== 'undefined') {
            console.log('🔧 Improving cart loading error handling...');
            
            const originalLoadCartFromBackend = window.loadCartFromBackend;
            window.loadCartFromBackend = async function() {
                try {
                    return await originalLoadCartFromBackend.call(this);
                } catch (error) {
                    console.log('⚠️ Cart loading failed, using localStorage fallback...');
                    
                    // Handle 401 Unauthorized errors gracefully
                    if (error.message && error.message.includes('Unauthorized')) {
                        console.log('🔐 User not authorized, loading from localStorage...');
                        if (typeof window.isCustomerLoggedIn === 'function' && window.isCustomerLoggedIn()) {
                            const userCart = window.loadUserCart();
                            if (window.cart !== undefined) {
                                window.cart = userCart || [];
                                console.log('📦 Loaded user cart from localStorage after auth error:', window.cart.length, 'items');
                            }
                            if (typeof window.updateCartCount === 'function') {
                                window.updateCartCount();
                            }
                            if (typeof window.renderCartDrawer === 'function') {
                                window.renderCartDrawer();
                            }
                            return { success: true, cart: { items: userCart || [] } };
                        } else {
                            const guestCart = window.loadGuestCart ? window.loadGuestCart() : [];
                            if (window.cart !== undefined) {
                                window.cart = guestCart;
                                console.log('📦 Loaded guest cart from localStorage after auth error:', window.cart.length, 'items');
                            }
                            if (typeof window.updateCartCount === 'function') {
                                window.updateCartCount();
                            }
                            if (typeof window.renderCartDrawer === 'function') {
                                window.renderCartDrawer();
                            }
                            return { success: true, cart: { items: guestCart || [] } };
                        }
                    }
                    
                    throw error;
                }
            };
            
            console.log('✅ Cart loading error handling improved');
        }
        
        // Fix 4: Add better authentication state management
        if (typeof window.authSwitcher !== 'undefined') {
            console.log('🔧 Improving authentication state management...');
            
            // Add method to check token validity
            window.authSwitcher.checkTokenValidity = function(tokenType = 'auto') {
                let token = null;
                let userData = null;
                
                if (tokenType === 'auto' || tokenType === 'admin') {
                    token = localStorage.getItem('token');
                    userData = localStorage.getItem('user');
                }
                
                if (tokenType === 'auto' || tokenType === 'customer') {
                    if (!token) {
                        token = localStorage.getItem('customerToken');
                        userData = localStorage.getItem('customerUser');
                    }
                }
                
                if (!token) {
                    return { valid: false, reason: 'No token found' };
                }
                
                try {
                    // Decode JWT token to check expiration
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const now = Date.now() / 1000;
                    
                    if (payload.exp && payload.exp < now) {
                        return { valid: false, reason: 'Token expired', expiredAt: new Date(payload.exp * 1000) };
                    }
                    
                    return { 
                        valid: true, 
                        payload,
                        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
                        userData: userData ? JSON.parse(userData) : null
                    };
                } catch (error) {
                    return { valid: false, reason: 'Invalid token format', error: error.message };
                }
            };
            
            // Add method to refresh authentication state
            window.authSwitcher.refreshAuthState = function() {
                const adminToken = localStorage.getItem('token');
                const customerToken = localStorage.getItem('customerToken');
                
                if (adminToken) {
                    const adminValidity = this.checkTokenValidity('admin');
                    if (!adminValidity.valid) {
                        console.log('⚠️ Admin token invalid:', adminValidity.reason);
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
                
                if (customerToken) {
                    const customerValidity = this.checkTokenValidity('customer');
                    if (!customerValidity.valid) {
                        console.log('⚠️ Customer token invalid:', customerValidity.reason);
                        localStorage.removeItem('customerToken');
                        localStorage.removeItem('customerUser');
                    }
                }
                
                // Update current status
                if (typeof this.updateCurrentStatus === 'function') {
                    this.updateCurrentStatus();
                }
            };
            
            console.log('✅ Authentication state management improved');
        }
        
        console.log('✅ All browser-side fixes applied');
        
        // Make the fix function available globally
        window.runComprehensiveFixScript = function() {
            console.log('🚀 Running comprehensive fix script...');
            // All fixes are already applied
            return true;
        };
    }
    
    // Start applying fixes
    waitForDOM().then(() => {
        applyFixes().catch(error => {
            console.error('❌ Error applying fixes:', error);
        });
    });
    
} else {
    console.log('🖥️ Node.js environment detected');
    
    // Server-side fixes can be added here if needed
    console.log('ℹ️ Server-side fixes not needed for this script');
}

console.log('🎉 Authentication and cart loading fixes script loaded!');
console.log('📋 This script will automatically apply fixes when the page is ready');
