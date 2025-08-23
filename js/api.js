// API Configuration
// Choose API base URL dynamically to avoid CORS/mixed-content issues in dev
function resolveApiBaseUrl() {
  try {
    const hasWindow = typeof window !== 'undefined' && typeof window.location !== 'undefined';
    if (hasWindow) {
      const { protocol, hostname, port, origin } = window.location;
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isHttps = protocol === 'https:';

      // If the site is being served by our Express dev server, use same-origin
      if (isLocalHost && (port === '3001' || port === '3443')) {
        return `${origin}/api`;
      }

      // For production/live websites, use the same origin
      if (!isLocalHost) {
        return `${origin}/api`;
      }

      // If the page itself is HTTPS (e.g. https://localhost:3443), prefer HTTPS API
      if (isHttps) {
        return 'https://localhost:3443/api';
      }

      // Default dev API
      return 'http://localhost:3001/api';
    }
  } catch (_) {
    // no-op, fall back below
  }
  return 'http://localhost:3001/api';
}

const API_BASE_URL = resolveApiBaseUrl();

// API Service Class
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.cache = new Map();
        this.cacheTimeout = 60000; // 60 seconds for list endpoints smoothing
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Get token from localStorage with context-aware preference
        let token = null;
        try {
            const hasWindow = typeof window !== 'undefined' && typeof window.location !== 'undefined';
            const path = hasWindow ? window.location.pathname : '';
            const isAdminContext = /admin/i.test(path) || /enhanced-order-management/i.test(path) || /billing-management/i.test(path) || /shipping-management/i.test(path);
            const adminToken = localStorage.getItem('token');
            const customerToken = localStorage.getItem('customerToken');
            
            // For admin endpoints, we need to ensure we're using the correct token
            if (endpoint.startsWith('/admin/')) {
                // For admin endpoints, prioritize admin token
                if (adminToken) {
                    const adminUser = localStorage.getItem('user');
                    if (adminUser) {
                        try {
                            const userData = JSON.parse(adminUser);
                            if (userData.role === 'admin') {
                                token = adminToken;
                            }
                        } catch (error) {
                            console.warn('Error parsing admin user data:', error);
                        }
                    }
                }
                
                // If no valid admin token, check if customer token has admin role
                if (!token && customerToken) {
                    const customerUser = localStorage.getItem('customerUser');
                    if (customerUser) {
                        try {
                            const userData = JSON.parse(customerUser);
                            if (userData.role === 'admin') {
                                token = customerToken;
                            }
                        } catch (error) {
                            console.warn('Error parsing customer user data:', error);
                        }
                    }
                }
                
                // If still no token, this will cause a 401/403 error as expected
            } else {
                // For non-admin endpoints, use context-aware token selection
                if (isAdminContext) {
                    token = adminToken || customerToken || null;
                } else {
                    token = customerToken || adminToken || null;
                }
            }
        } catch (_) {
            // Fallback to previous behavior
            token = localStorage.getItem('customerToken') || localStorage.getItem('token') || null;
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
            // Support request timeout via AbortController
            const controller = new AbortController();
            const timeoutMs = options.timeoutMs || 60000; // Default timeout of 60 seconds
            let timeoutId = null;

            if (timeoutMs > 0) {
                timeoutId = setTimeout(() => {
                    console.warn(`Request to ${url} timed out after ${timeoutMs}ms`);
                    controller.abort();
                }, timeoutMs);
            }

            // Avoid keepalive for large POST bodies (Chrome limits keepalive payload ~64KB)
            const fetchOptions = { ...config, signal: controller.signal };
            if (options && options.keepalive === true) {
                fetchOptions.keepalive = true;
            }
            const response = await fetch(url, fetchOptions);
            
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            if (!response.ok) {
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    // Universal token cleanup for both admin and customer
                    localStorage.removeItem('token');
                    localStorage.removeItem('customerToken');
                    localStorage.removeItem('user'); // Admin user object
                    localStorage.removeItem('customerUser'); // Customer user object

                    // Smart redirect
                    if (window.location.pathname.includes('admin')) {
                        window.location.href = 'admin-login.html';
                    } else if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
                        // Avoid redirect loops on auth pages
                        // Consider redirecting to customer login or showing a modal
                    }
                    
                    throw new Error('Unauthorized - Please login again');
                }
                
                // Handle 429 Too Many Requests with exponential backoff retry (non-blocking UI)
                if (response.status === 429) {
                    console.warn('Rate limit exceeded, scheduling retry...');
                    const retryAfter = response.headers.get('Retry-After');
                    const retrySeconds = retryAfter ? parseInt(retryAfter) : 1;
                    // Fire-and-forget background retry: do not block, just log and return a friendly error
                    setTimeout(() => {
                        fetch(url, config).catch(() => {});
                    }, Math.min(retrySeconds, 5) * 1000);
                    throw new Error(`Rate limit exceeded - Please wait ${retrySeconds} seconds before trying again`);
                }
                
                // Try to get error response body
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('API Error Response:', errorData);
                } catch (e) {
                    console.error('Could not parse error response');
                }
                
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Handle CORS and timeout errors specifically
            if (error && error.name === 'AbortError') {
                console.warn(`Request timeout for ${url} - consider increasing timeout or checking server performance`);
                throw new Error('Request timeout - Server may be slow or overloaded');
            }
            if (error && error.message && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
                // Detect common mixed-content scenario: page is HTTPS but API is HTTP
                try {
                    const isHttpsPage = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
                    const apiIsHttp = typeof this.baseURL === 'string' && this.baseURL.startsWith('http://');
                    if (isHttpsPage && apiIsHttp) {
                        console.warn('Mixed content blocked: page is HTTPS but API is HTTP');
                        throw new Error('Mixed content blocked - Use HTTPS for both site and API, or open the site on http://localhost:3001');
                    }
                } catch (_) {
                    // ignore detection errors
                }

                console.warn('CORS or network error detected. If using file://, please use a local server.');
                throw new Error('CORS/network error - Serve the site via http://localhost:3001 or Live Server instead of file://');
            }
            
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Products API
    async getProducts(paramsOrQuery = {}, options = {}) {
        // Simple in-memory cache for 10s to smooth rapid navigations
        const cacheKey = this.getCacheKey('/products', paramsOrQuery);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        let queryString;
        if (typeof paramsOrQuery === 'string') {
            queryString = paramsOrQuery.startsWith('?') ? paramsOrQuery.slice(1) : paramsOrQuery;
        } else {
            queryString = new URLSearchParams(paramsOrQuery).toString();
        }
        const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
        const res = await this.request(endpoint, options);
        // If backend served warm-stale data, still cache it briefly (10s) for UX
        if (res && res.cache) {
            const prevTimeout = this.cacheTimeout;
            this.cacheTimeout = 10000;
            this.setCache(cacheKey, res);
            this.cacheTimeout = prevTimeout;
            return res;
        }
        this.setCache(cacheKey, res);
        return res;
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    // Authentication API
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async adminLogin(email, password) {
        return this.request('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    async updateProfile(userData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    }

    // Wishlist API
    async getWishlist() {
        return this.request('/wishlist');
    }

    async addToWishlist(productId) {
        return this.request('/wishlist/add', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
    }

    async removeFromWishlist(productId) {
        return this.request('/wishlist/remove', {
            method: 'DELETE',
            body: JSON.stringify({ productId })
        });
    }

    // Orders API
    async createOrder(orderData) {
        return this.request('/orders/new', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders() {
        return this.request('/orders/me');
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    // Reviews API
    async createReview(productId, reviewData) {
        // Backend expects /api/review/new with { productId, rating, title, comment }
        return this.request('/review/new', {
            method: 'POST',
            body: JSON.stringify({ ...reviewData, productId })
        });
    }

    // Newsletter API
    async subscribeNewsletter(email) {
        return this.request('/newsletter/subscribe', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async unsubscribeNewsletter(email) {
        return this.request('/newsletter/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    // Admin Newsletter Methods
    async getNewsletterSubscribers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/newsletter/admin/subscribers${queryString ? `?${queryString}` : ''}`);
    }

    async getNewsletterStats() {
        return this.request('/newsletter/admin/stats');
    }

    async sendNewsletter(newsletterData) {
        return this.request('/newsletter/admin/send', {
            method: 'POST',
            body: JSON.stringify(newsletterData)
        });
    }

    async deleteNewsletterSubscriber(subscriberId) {
        return this.request(`/newsletter/admin/subscribers/${subscriberId}`, {
            method: 'DELETE'
        });
    }

    async updateNewsletterSubscriberStatus(subscriberId, status) {
        return this.request(`/newsletter/admin/subscribers/${subscriberId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // Analytics API
    async trackPageView(pageData) {
        return this.request('/analytics/track/pageview', {
            method: 'POST',
            body: JSON.stringify(pageData)
        });
    }

    async trackUserBehavior(behaviorData) {
        return this.request('/analytics/track/behavior', {
            method: 'POST',
            body: JSON.stringify(behaviorData)
        });
    }

    async trackConversion(conversionData) {
        return this.request('/analytics/track/conversion', {
            method: 'POST',
            body: JSON.stringify(conversionData)
        });
    }

    // Admin Analytics Methods
    async getAnalyticsSummary(period = '7') {
        return this.request(`/analytics/admin/summary?period=${period}`);
    }

    async getDailyAnalytics(date) {
        const queryString = date ? `?date=${date}` : '';
        return this.request(`/analytics/admin/daily${queryString}`);
    }

    async getWeeklyAnalytics(startDate) {
        const queryString = startDate ? `?startDate=${startDate}` : '';
        return this.request(`/analytics/admin/weekly${queryString}`);
    }

    async getRealTimeAnalytics() {
        return this.request('/analytics/admin/realtime');
    }

    async getTopPages(days = '7') {
        return this.request(`/analytics/admin/top-pages?days=${days}`);
    }

    async getUserJourney(userId) {
        return this.request(`/analytics/admin/user-journey/${userId}`);
    }

    async getConversionAnalytics(days = '30') {
        return this.request(`/analytics/admin/conversions?days=${days}`);
    }

    // Admin Methods
    async getDashboardStats() {
        return await this.request('/admin/dashboard');
    }

    async getAdminProducts(params = {}) {
        const safeParams = { page: params.page || 1, limit: params.limit || 20, ...params };
        const cacheKey = this.getCacheKey('/admin/products', safeParams);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const queryString = new URLSearchParams(safeParams).toString();
        // Use timeout from params or default to 60s for admin products
        const timeoutMs = params.timeoutMs || 60000;
        const response = await this.request(`/admin/products${queryString ? `?${queryString}` : ''}`, { timeoutMs });
        this.setCache(cacheKey, response);
        return response;
    }

    async createProduct(productData) {
        try {
            console.log('📦 Creating product via API:', productData);
            const response = await this.request('/admin/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            console.log('✅ Product created successfully:', response);
            
            // Clear product-related cache after successful creation
            if (response.success) {
                this.clearProductCache();
                
                // Set flag for customer pages to clear cache on next load
                try {
                    sessionStorage.setItem('clearCacheOnNextLoad', 'true');
                    console.log('🏷️ Set cache clear flag for customer pages');
                } catch (e) {
                    console.warn('⚠️ Could not set cache clear flag:', e);
                }
            }
            
            return response;
        } catch (error) {
            console.error('❌ Error creating product:', error);
            
            // Provide more detailed error information
            if (error.message.includes('401')) {
                throw new Error('Authentication failed. Please login again as admin.');
            } else if (error.message.includes('403')) {
                throw new Error('Access denied. Admin role required.');
            } else if (error.message.includes('400')) {
                throw new Error('Invalid product data. Please check all required fields.');
            } else if (error.message.includes('500')) {
                throw new Error('Server error. Please try again later.');
            }
            
            throw error;
        }
    }

    async updateProduct(productId, productData) {
        const response = await this.request(`/admin/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
        
        // Clear product-related cache after successful update
        if (response.success) {
            this.clearProductCache();
            
            // Set flag for customer pages to clear cache on next load
            try {
                sessionStorage.setItem('clearCacheOnNextLoad', 'true');
                console.log('🏷️ Set cache clear flag for customer pages');
            } catch (e) {
                console.warn('⚠️ Could not set cache clear flag:', e);
            }
        }
        
        return response;
    }

    async deleteProduct(productId) {
        const response = await this.request(`/admin/products/${productId}`, {
            method: 'DELETE'
        });
        
        // Clear product-related cache after successful deletion
        if (response.success) {
            this.clearProductCache();
            
            // Set flag for customer pages to clear cache on next load
            try {
                sessionStorage.setItem('clearCacheOnNextLoad', 'true');
                console.log('🏷️ Set cache clear flag for customer pages');
            } catch (e) {
                console.warn('⚠️ Could not set cache clear flag:', e);
            }
        }
        
        return response;
    }

    async getAdminOrders(queryParams = '') {
        // Parse query params to extract timeout
        const params = new URLSearchParams(queryParams);
        const timeoutMs = params.get('timeoutMs') || 60000;
        
        return await this.request(`/admin/orders${queryParams}`, { timeoutMs: parseInt(timeoutMs) });
    }

    async getAdminDashboard() {
        return await this.request('/admin/dashboard');
    }

    async updateOrderStatus(orderId, statusData) {
        return await this.request(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusData)
        });
    }

    async getAdminCustomers() {
        return await this.request('/admin/customers');
    }

    async getAnalytics() {
        return await this.request('/admin/analytics');
    }

    // Settings Methods
    async getSettings() {
        // This is a public endpoint, should not require admin auth
        try {
            // Add cache busting parameter to prevent caching
            const cacheBuster = Date.now();
            const response = await this.request(`/settings?cb=${cacheBuster}`, {}); // Cache busting
            if (response.success) {
                return response;
            } else {
                // Fallback to a default or cached settings object if API fails
                console.warn('Could not fetch settings, using fallback.');
                return { success: true, settings: { websiteName: 'Laiq Bags' } };
            }
        } catch (error) {
            console.error('Failed to get settings:', error);
            // Return a fallback object on error
            return { success: true, settings: { websiteName: 'Laiq Bags' } };
        }
    }

    async updateSettings(settingsData) {
        return await this.request('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData)
        });
    }

    // Customer Authentication API
    async customerLogin(email, password) {
        return this.request('/auth/customer/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async customerRegister(userData) {
        return this.request('/auth/customer/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async customerLogout() {
        return this.request('/auth/customer/logout', {
            method: 'GET'
        });
    }

    async getCustomerProfile() {
        return this.request('/auth/customer/me', {});
    }

    async updateCustomerProfile(userData) {
        return this.request('/auth/customer/me/update', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // Customer Orders API
    async getCustomerOrders(page = 1, options = {}) {
        const token = localStorage.getItem('customerToken');
        const customerUser = localStorage.getItem('customerUser');
        if (!token || !customerUser) {
            throw new Error('Customer not authenticated');
        }
        try {
            const user = JSON.parse(customerUser);
            if (!user._id) {
                throw new Error('Invalid customer ID');
            }
            console.log('👤 Getting orders for customer:', user._id);
            const limit = 10;
            const qp = `?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
            const reqOptions = { ...options, timeoutMs: options.timeoutMs ?? 20000 };
            return this.request(`/orders/me${qp}`, reqOptions);
        } catch (error) {
            console.error('❌ Error getting customer orders:', error);
            throw error;
        }
    }

    async createCustomerOrder(orderData) {
        return await this.request('/orders/new', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getCustomerOrder(id) {
        return await this.request(`/orders/${id}`, {});
    }

    // Customer Wishlist API
    async getCustomerWishlist(options = {}) {
        const token = localStorage.getItem('customerToken');
        const customerUser = localStorage.getItem('customerUser');
        
        if (!token || !customerUser) {
            throw new Error('Customer not authenticated');
        }
        
        try {
            const user = JSON.parse(customerUser);
            if (!user._id) {
                throw new Error('Invalid customer ID');
            }
            
            console.log('👤 Getting wishlist for customer:', user._id);
            const reqOptions = { ...options, timeoutMs: options.timeoutMs ?? 20000 };
            return this.request('/wishlist', reqOptions);
        } catch (error) {
            console.error('❌ Error getting customer wishlist:', error);
            throw error;
        }
    }

    // Cart API functions
    async getCart(options = {}) {
        const reqOptions = { ...options, timeoutMs: options.timeoutMs ?? 10000 };
        return this.request('/cart/me', reqOptions);
    }

    async addToCart(productId, quantity = 1, color = null) {
        const requestBody = { productId, quantity };
        if (color) {
            requestBody.color = color;
        }
        
        return this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });
    }

    async updateCartItem(productId, quantity, color = null) {
        let endpoint = `/cart/update/${productId}`;
        if (color) {
            endpoint += `?color=${encodeURIComponent(color)}`;
        }
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(productId, color = null) {
        let endpoint = `/cart/remove/${productId}`;
        if (color && color !== 'Default' && color !== 'default') {
            endpoint += `?color=${encodeURIComponent(color)}`;
        }
        console.log('🗑️ API removeFromCart called with:', { productId, color, endpoint });
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return this.request('/cart/clear', {
            method: 'DELETE'
        });
    }

    async addToCustomerWishlist(productId, options = {}) {
        return this.request('/wishlist/add', {
            method: 'POST',
            body: JSON.stringify({ productId }),
            ...options
        });
    }

    async removeFromCustomerWishlist(productId) {
        return this.request('/wishlist/remove', {
            method: 'DELETE',
            body: JSON.stringify({ productId })
        });
    }

    // Customer Reviews API
    async createCustomerReview(productId, reviewData) {
        return this.request('/review/new', {
            method: 'POST',
            body: JSON.stringify({ ...reviewData, productId })
        });
    }

    // Review methods
    async createReview(reviewData) {
        return await this.request('/review/new', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    async getProductReviews(productId) {
        return await this.request(`/review/${productId}`);
    }

    async getSingleReview(reviewId) {
        return await this.request(`/review/single/${reviewId}`);
    }

    async updateReview(reviewId, reviewData) {
        return await this.request(`/review/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData)
        });
    }

    async deleteReview(reviewId) {
        return await this.request(`/review/${reviewId}`, {
            method: 'DELETE'
        });
    }

    async markReviewHelpful(reviewId) {
        return await this.request(`/review/${reviewId}/helpful`, {
            method: 'POST'
        });
    }

    // Admin review methods
    async getAllReviews() {
        return await this.request('/review/admin/all');
    }

    async verifyReview(reviewId) {
        return await this.request(`/review/admin/${reviewId}/verify`, {
            method: 'PUT'
        });
    }

    // Admin customer methods
    async getCustomerDetails(customerId) {
        return await this.request(`/admin/customers/${customerId}`);
    }

    async getCustomer(customerId) {
        return await this.request(`/admin/customers/${customerId}`);
    }

    async updateCustomer(customerId, customerData) {
        return await this.request(`/admin/customers/${customerId}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    }

    async getAdminCustomerOrders(customerId) {
        return await this.request(`/admin/customers/${customerId}/orders`);
    }

    async getAdminCustomerWishlist(customerId) {
        return this.request(`/admin/customers/${customerId}/wishlist`);
    }

    // Get admin customer cart
    async getAdminCustomerCart(customerId) {
        return this.request(`/admin/customers/${customerId}/cart`);
    }

    // Payment Methods
    async createStripePaymentIntent(amount) {
        return this.request('/payment/stripe/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }

    async createRazorpayOrder(amount) {
        return this.request('/payment/razorpay/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }

    async verifyRazorpayPayment(paymentData) {
        return this.request('/payment/razorpay/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    // Order Management Methods
    async cancelOrder(orderId, reason) {
        return await this.request(`/orders/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async cancelCustomerOrder(orderId, reason) {
        return await this.request(`/orders/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async cancelOrderByAdmin(orderId, reason, refundAmount, forceCancel = false) {
        return await this.request(`/orders/admin/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason, refundAmount, forceCancel })
        });
    }

    async processRefund(orderId, refundMethod, refundAmount) {
        return await this.request(`/orders/admin/${orderId}/refund`, {
            method: 'POST',
            body: JSON.stringify({ refundMethod, refundAmount })
        });
    }

    async updateTracking(orderId, trackingData) {
        return await this.request(`/orders/admin/${orderId}/tracking`, {
            method: 'PUT',
            body: JSON.stringify(trackingData)
        });
    }

    async addOrderNotes(orderId, notes) {
        return await this.request(`/orders/${orderId}/notes`, {
            method: 'POST',
            body: JSON.stringify(notes)
        });
    }

    async getOrderDetails(orderId) {
        return await this.request(`/orders/${orderId}`);
    }

    // Customer Address Management
    async getCustomerAddresses() {
        return this.request('/auth/customer/addresses', {});
    }

    async addCustomerAddress(addressData) {
        return this.request('/auth/customer/addresses', {
            method: 'POST',
            body: JSON.stringify(addressData)
        });
    }

    async updateCustomerAddress(addressId, addressData) {
        return this.request(`/auth/customer/addresses/${addressId}`, {
            method: 'PUT',
            body: JSON.stringify(addressData)
        });
    }

    async deleteCustomerAddress(addressId) {
        return this.request(`/auth/customer/addresses/${addressId}`, {
            method: 'DELETE'
        });
    }

    // Customer Profile Management

    // Cache management
    getCacheKey(endpoint, params = {}) {
        return `${endpoint}?${JSON.stringify(params)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    clearProductCache() {
        // Clear all product-related cache entries
        const keysToDelete = [];
        for (const [key, value] of this.cache.entries()) {
            if (key.includes('/products') || key.includes('/admin/products')) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            this.cache.delete(key);
            console.log('🗑️ Cleared product cache:', key);
        });
        
        console.log(`🗑️ Cleared ${keysToDelete.length} product cache entries`);
    }

    // Merge Guest Wishlist with User Wishlist
    async mergeGuestWishlist(guestWishlist) {
        console.log('🔄 Merging guest wishlist with user account...', guestWishlist);
        if (!guestWishlist || guestWishlist.length === 0) {
            console.log('✅ No guest wishlist items to merge.');
            return { success: true, message: 'No items to merge.' };
        }
        return this.request('/wishlist/merge', {
            method: 'POST',
            body: JSON.stringify({ guestWishlist }),
        });
    }
}

// Create global API instance
const api = new ApiService();

// Export for use in other files
window.api = api; 