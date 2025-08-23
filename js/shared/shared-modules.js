// Shared Modules Integration
// Brings together all shared modules for unified access across management systems

class SharedModules {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
        this.initializationCallbacks = [];
        
        this.initialize();
    }

    // Initialize all shared modules
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Shared Modules Integration...');
        
        try {
            // Wait for all modules to be available
            await this.waitForModules();
            
            // Initialize modules in dependency order
            await this.initializeModules();
            
            // Setup cross-module communication
            this.setupCrossModuleCommunication();
            
            // Warm up cache with common data
            await this.warmupCache();
            
            this.isInitialized = true;
            console.log('✅ All Shared Modules initialized successfully');
            
            // Notify initialization callbacks
            this.notifyInitializationCallbacks();
            
        } catch (error) {
            console.error('❌ Failed to initialize shared modules:', error);
            throw error;
        }
    }

    // Wait for all required modules to be available
    async waitForModules() {
        const requiredModules = ['authModule', 'cacheModule', 'errorBoundary', 'optimizedAPI'];
        const maxWaitTime = 10000; // 10 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            const missingModules = requiredModules.filter(module => !window[module]);
            
            if (missingModules.length === 0) {
                console.log('✅ All required modules are available');
                return;
            }
            
            console.log(`⏳ Waiting for modules: ${missingModules.join(', ')}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Timeout waiting for required modules');
    }

    // Initialize modules in dependency order
    async initializeModules() {
        // 1. Authentication Module (no dependencies)
        if (window.authModule) {
            this.modules.set('auth', window.authModule);
            console.log('✅ Authentication module registered');
        }

        // 2. Error Boundary (depends on auth)
        if (window.errorBoundary) {
            this.modules.set('error', window.errorBoundary);
            console.log('✅ Error Boundary module registered');
        }

        // 3. Cache Module (depends on auth)
        if (window.cacheModule) {
            this.modules.set('cache', window.cacheModule);
            console.log('✅ Cache module registered');
        }

        // 4. Optimized API (depends on auth and cache)
        if (window.optimizedAPI) {
            this.modules.set('api', window.optimizedAPI);
            console.log('✅ Optimized API module registered');
        }
    }

    // Setup cross-module communication
    setupCrossModuleCommunication() {
        // Setup authentication change listeners
        if (this.modules.has('auth')) {
            const auth = this.modules.get('auth');
            auth.onAuthChange((authState) => {
                console.log('🔐 Authentication state changed:', authState);
                
                // Clear cache on logout
                if (!authState.isAuthenticated && this.modules.has('cache')) {
                    this.modules.get('cache').clear();
                }
                
                // Clear API queues on logout
                if (!authState.isAuthenticated && this.modules.has('api')) {
                    this.modules.get('api').clearQueues();
                }
            });
        }

        // Setup error boundary with recovery strategies
        if (this.modules.has('error') && this.modules.has('auth')) {
            const errorBoundary = this.modules.get('error');
            const auth = this.modules.get('auth');
            
            // Add custom recovery strategy for authentication errors
            errorBoundary.addRecoveryStrategy('sharedAuth', /(unauthorized|forbidden)/i, async (error) => {
                if (auth.isAuthenticated) {
                    const refreshed = await auth.refreshToken();
                    if (refreshed) {
                        return { recovered: true, action: 'retry' };
                    }
                }
                return { recovered: false, action: 'redirect' };
            });
        }
    }

    // Warm up cache with common data
    async warmupCache() {
        if (!this.modules.has('cache') || !this.modules.has('api')) return;
        
        console.log('🔥 Warming up cache with common data...');
        
        const commonEndpoints = [
            { url: '/api/admin/dashboard', ttl: 2 * 60 * 1000 },
            { url: '/api/admin/orders', ttl: 1 * 60 * 1000 },
            { url: '/api/admin/products', ttl: 5 * 60 * 1000 }
        ];

        try {
            await this.modules.get('api').preloadData(commonEndpoints);
            console.log('✅ Cache warmup completed');
        } catch (error) {
            console.warn('⚠️ Cache warmup failed:', error);
        }
    }

    // Get module by name
    getModule(name) {
        return this.modules.get(name);
    }

    // Check if module is available
    hasModule(name) {
        return this.modules.has(name);
    }

    // Get all available modules
    getAvailableModules() {
        return Array.from(this.modules.keys());
    }

    // Subscribe to initialization completion
    onInitialized(callback) {
        if (this.isInitialized) {
            callback();
        } else {
            this.initializationCallbacks.push(callback);
        }
    }

    // Notify initialization callbacks
    notifyInitializationCallbacks() {
        this.initializationCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('❌ Error in initialization callback:', error);
            }
        });
        this.initializationCallbacks = [];
    }

    // Unified authentication check
    async checkAuth(requiredRole = 'admin') {
        if (!this.modules.has('auth')) {
            throw new Error('Authentication module not available');
        }

        const auth = this.modules.get('auth');
        
        if (requiredRole === 'admin') {
            return await auth.checkAdminAuth();
        } else if (requiredRole === 'customer') {
            return await auth.checkCustomerAuth();
        } else {
            throw new Error(`Unknown role: ${requiredRole}`);
        }
    }

    // Unified API request with caching and error handling
    async apiRequest(endpoint, options = {}) {
        if (!this.modules.has('api')) {
            throw new Error('API module not available');
        }

        const api = this.modules.get('api');
        
        try {
            return await api.request(endpoint, options);
        } catch (error) {
            // Let error boundary handle the error
            if (this.modules.has('error')) {
                this.modules.get('error').handleError(error, {
                    type: 'api',
                    source: 'shared-modules',
                    endpoint: endpoint
                });
            }
            throw error;
        }
    }

    // Batch multiple API requests
    async batchApiRequests(requests) {
        if (!this.modules.has('api')) {
            throw new Error('API module not available');
        }

        const api = this.modules.get('api');
        return await api.batchRequests(requests);
    }

    // Cache operations
    cacheSet(key, value, ttl) {
        if (!this.modules.has('cache')) {
            console.warn('⚠️ Cache module not available');
            return false;
        }

        const cache = this.modules.get('cache');
        return cache.set(key, value, ttl);
    }

    cacheGet(key) {
        if (!this.modules.has('cache')) {
            return null;
        }

        const cache = this.modules.get('cache');
        return cache.get(key);
    }

    cacheDelete(key) {
        if (!this.modules.has('cache')) {
            return false;
        }

        const cache = this.modules.get('cache');
        return cache.delete(key);
    }

    // Error handling
    handleError(error, context = {}) {
        if (!this.modules.has('error')) {
            console.error('❌ Error Boundary not available:', error);
            return;
        }

        const errorBoundary = this.modules.get('error');
        errorBoundary.handleError(error, context);
    }

    // Wrap function with error handling
    wrapFunction(fn, context = {}) {
        if (!this.modules.has('error')) {
            return fn;
        }

        const errorBoundary = this.modules.get('error');
        return errorBoundary.wrapAsync(fn, context);
    }

    // Get system status
    getSystemStatus() {
        const status = {
            initialized: this.isInitialized,
            modules: this.getAvailableModules(),
            auth: null,
            cache: null,
            api: null,
            error: null
        };

        if (this.modules.has('auth')) {
            status.auth = this.modules.get('auth').getAuthState();
        }

        if (this.modules.has('cache')) {
            status.cache = this.modules.get('cache').getStats();
        }

        if (this.modules.has('api')) {
            status.api = this.modules.get('api').getRequestStats();
        }

        if (this.modules.has('error')) {
            status.error = this.modules.get('error').getErrorStats();
        }

        return status;
    }

    // Performance optimization
    async optimizePerformance() {
        console.log('⚡ Optimizing system performance...');
        
        if (this.modules.has('cache')) {
            this.modules.get('cache').optimizeCache();
        }
        
        if (this.modules.has('api')) {
            this.modules.get('api').optimizeRequests();
        }
        
        console.log('✅ Performance optimization completed');
    }

    // Cleanup all modules
    cleanup() {
        console.log('🧹 Cleaning up shared modules...');
        
        this.modules.forEach((module, name) => {
            if (module.cleanup && typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                    console.log(`✅ Cleaned up ${name} module`);
                } catch (error) {
                    console.error(`❌ Error cleaning up ${name} module:`, error);
                }
            }
        });
        
        this.modules.clear();
        this.isInitialized = false;
        console.log('✅ All shared modules cleaned up');
    }
}

// Create global instance
const sharedModules = new SharedModules();

// Export for use in other modules
window.sharedModules = sharedModules;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sharedModules;
}

// Convenience functions for easy access
window.checkAuth = (role) => sharedModules.checkAuth(role);
window.apiRequest = (endpoint, options) => sharedModules.apiRequest(endpoint, options);
window.batchApiRequests = (requests) => sharedModules.batchApiRequests(requests);
window.cacheSet = (key, value, ttl) => sharedModules.cacheSet(key, value, ttl);
window.cacheGet = (key) => sharedModules.cacheGet(key);
window.cacheDelete = (key) => sharedModules.cacheDelete(key);
window.handleError = (error, context) => sharedModules.handleError(error, context);
window.wrapFunction = (fn, context) => sharedModules.wrapFunction(fn, context);

console.log('🚀 Shared Modules Integration loaded and ready');
