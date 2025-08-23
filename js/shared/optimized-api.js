// Optimized API Module with Request Batching
// Provides intelligent request batching, caching, and performance optimization

class OptimizedAPI {
    constructor() {
        this.requestQueue = new Map();
        this.batchQueue = new Map();
        this.batchTimeout = 100; // Batch requests within 100ms
        this.maxBatchSize = 10; // Maximum requests per batch
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
        this.requestStats = {
            total: 0,
            cached: 0,
            batched: 0,
            failed: 0
        };
        
        this.initialize();
    }

    // Initialize the optimized API
    initialize() {
        console.log('🚀 Initializing Optimized API Module...');
        
        // Setup request batching
        this.setupRequestBatching();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('✅ Optimized API Module initialized');
    }

    // Setup request batching
    setupRequestBatching() {
        // Process batch queue periodically
        setInterval(() => {
            this.processBatchQueue();
        }, this.batchTimeout);
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor API performance every 30 seconds
        setInterval(() => {
            this.logPerformanceStats();
        }, 30000);
    }

    // Make a single API request with optimization
    async request(endpoint, options = {}) {
        const requestId = this.generateRequestId();
        const cacheKey = this.generateCacheKey(endpoint, options);
        
        // Check cache first
        if (window.cacheModule && !options.skipCache) {
            const cached = window.cacheModule.get(cacheKey);
            if (cached) {
                this.requestStats.cached++;
                return cached;
            }
        }

        // Check if request is already in progress
        if (this.requestQueue.has(cacheKey)) {
            return this.requestQueue.get(cacheKey);
        }

        // Create request promise
        const requestPromise = this.executeRequest(endpoint, options, requestId);
        
        // Add to request queue
        this.requestQueue.set(cacheKey, requestPromise);
        
        // Clean up from queue when done
        requestPromise.finally(() => {
            this.requestQueue.delete(cacheKey);
        });

        this.requestStats.total++;
        return requestPromise;
    }

    // Execute actual API request with retry logic
    async executeRequest(endpoint, options, requestId) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const startTime = performance.now();
                
                const response = await this.makeRequest(endpoint, options);
                
                const duration = performance.now() - startTime;
                this.logRequestSuccess(endpoint, duration, attempt);
                
                // Cache successful response
                if (window.cacheModule && response && !options.skipCache) {
                    const cacheKey = this.generateCacheKey(endpoint, options);
                    const ttl = options.cacheTTL || 5 * 60 * 1000; // 5 minutes default
                    window.cacheModule.set(cacheKey, response, ttl);
                }
                
                return response;
                
            } catch (error) {
                lastError = error;
                
                if (attempt === this.retryConfig.maxRetries) {
                    this.requestStats.failed++;
                    this.logRequestFailure(endpoint, error, attempt);
                    throw error;
                }
                
                // Calculate delay with exponential backoff
                const delay = Math.min(
                    this.retryConfig.baseDelay * Math.pow(2, attempt),
                    this.retryConfig.maxDelay
                );
                
                console.log(`🔄 Retrying request to ${endpoint} in ${delay}ms (attempt ${attempt + 1})`);
                await this.delay(delay);
            }
        }
    }

    // Make actual HTTP request
    async makeRequest(endpoint, options) {
        const url = new URL(endpoint, window.location.origin);
        
        // Add query parameters
        if (options.params) {
            Object.keys(options.params).forEach(key => {
                if (options.params[key] !== undefined && options.params[key] !== null) {
                    url.searchParams.append(key, options.params[key]);
                }
            });
        }

        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            ...(window.authModule ? window.authModule.getAuthHeader() : {}),
            ...options.headers
        };

        // Prepare request config
        const requestConfig = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method) && options.body) {
            requestConfig.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        }

        const response = await fetch(url.toString(), requestConfig);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // Batch multiple API requests for better performance
    batchRequests(requests) {
        const batchId = this.generateBatchId();
        const batchPromise = new Promise((resolve, reject) => {
            this.batchQueue.set(batchId, { requests, resolve, reject, results: [] });
        });

        // Process batch immediately if it's full
        if (requests.length >= this.maxBatchSize) {
            this.processBatch(batchId);
        }

        return batchPromise;
    }

    // Process batch queue
    processBatchQueue() {
        for (const [batchId, batch] of this.batchQueue) {
            if (batch.results.length === 0) { // Only process unprocessed batches
                this.processBatch(batchId);
            }
        }
    }

    // Process a specific batch
    async processBatch(batchId) {
        const batch = this.batchQueue.get(batchId);
        if (!batch) return;

        try {
            console.log(`🔄 Processing batch ${batchId} with ${batch.requests.length} requests`);
            
            // Execute all requests in parallel
            const promises = batch.requests.map(async (request, index) => {
                try {
                    const result = await this.request(request.endpoint, request.options);
                    return { index, success: true, data: result };
                } catch (error) {
                    return { index, success: false, error: error.message };
                }
            });

            const results = await Promise.allSettled(promises);
            
            // Process results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    batch.results[result.value.index] = result.value;
                } else {
                    batch.results[index] = { index, success: false, error: result.reason };
                }
            });

            // Resolve batch
            batch.resolve(batch.results);
            this.batchQueue.delete(batchId);
            
            this.requestStats.batched += batch.requests.length;
            console.log(`✅ Batch ${batchId} completed successfully`);
            
        } catch (error) {
            console.error(`❌ Batch ${batchId} failed:`, error);
            batch.reject(error);
            this.batchQueue.delete(batchId);
        }
    }

    // Preload data for better user experience
    async preloadData(endpoints) {
        console.log('🚀 Preloading data for better performance...');
        
        const requests = endpoints.map(endpoint => ({
            endpoint: endpoint.url,
            options: { skipCache: false, cacheTTL: endpoint.ttl || 5 * 60 * 1000 }
        }));

        try {
            const results = await this.batchRequests(requests);
            console.log(`✅ Preloaded ${results.length} data endpoints`);
            return results;
        } catch (error) {
            console.error('❌ Data preloading failed:', error);
            return [];
        }
    }

    // Optimize API calls based on usage patterns
    optimizeRequests() {
        // Analyze request patterns
        const patterns = this.analyzeRequestPatterns();
        
        // Adjust batch timeout based on patterns
        if (patterns.highFrequency) {
            this.batchTimeout = Math.max(50, this.batchTimeout * 0.8);
            console.log(`⏱️ Reduced batch timeout to ${this.batchTimeout}ms for high frequency`);
        } else if (patterns.lowFrequency) {
            this.batchTimeout = Math.min(200, this.batchTimeout * 1.2);
            console.log(`⏱️ Increased batch timeout to ${this.batchTimeout}ms for low frequency`);
        }

        // Adjust retry configuration based on failure rate
        const failureRate = this.requestStats.failed / this.requestStats.total;
        if (failureRate > 0.1) { // More than 10% failure rate
            this.retryConfig.maxRetries = Math.min(5, this.retryConfig.maxRetries + 1);
            console.log(`🔄 Increased max retries to ${this.retryConfig.maxRetries} due to high failure rate`);
        } else if (failureRate < 0.01) { // Less than 1% failure rate
            this.retryConfig.maxRetries = Math.max(1, this.retryConfig.maxRetries - 1);
            console.log(`🔄 Decreased max retries to ${this.retryConfig.maxRetries} due to low failure rate`);
        }
    }

    // Analyze request patterns
    analyzeRequestPatterns() {
        const totalRequests = this.requestStats.total;
        const batchedRequests = this.requestStats.batched;
        const cachedRequests = this.requestStats.cached;
        
        const batchRate = totalRequests > 0 ? batchedRequests / totalRequests : 0;
        const cacheRate = totalRequests > 0 ? cachedRequests / totalRequests : 0;
        
        return {
            highFrequency: batchRate > 0.3,
            lowFrequency: batchRate < 0.1,
            highCacheHit: cacheRate > 0.5,
            lowCacheHit: cacheRate < 0.2
        };
    }

    // Generate unique request ID
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Generate unique batch ID
    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Generate cache key
    generateCacheKey(endpoint, options) {
        const params = options.params ? JSON.stringify(options.params) : '';
        const method = options.method || 'GET';
        return `${method}:${endpoint}:${params}`;
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Log successful request
    logRequestSuccess(endpoint, duration, attempt) {
        if (attempt > 0) {
            console.log(`✅ Request to ${endpoint} succeeded after ${attempt + 1} attempts (${duration.toFixed(2)}ms)`);
        } else {
            console.log(`✅ Request to ${endpoint} succeeded (${duration.toFixed(2)}ms)`);
        }
    }

    // Log failed request
    logRequestFailure(endpoint, error, attempt) {
        console.error(`❌ Request to ${endpoint} failed after ${attempt + 1} attempts:`, error.message);
    }

    // Log performance statistics
    logPerformanceStats() {
        const total = this.requestStats.total;
        const cached = this.requestStats.cached;
        const batched = this.requestStats.batched;
        const failed = this.requestStats.failed;
        
        if (total > 0) {
            const cacheHitRate = ((cached / total) * 100).toFixed(2);
            const batchRate = ((batched / total) * 100).toFixed(2);
            const failureRate = ((failed / total) * 100).toFixed(2);
            
            console.log(`📊 API Performance Stats:`);
            console.log(`   Total Requests: ${total}`);
            console.log(`   Cache Hit Rate: ${cacheHitRate}%`);
            console.log(`   Batch Rate: ${batchRate}%`);
            console.log(`   Failure Rate: ${failureRate}%`);
        }
    }

    // Get request statistics
    getRequestStats() {
        return { ...this.requestStats };
    }

    // Reset statistics
    resetStats() {
        this.requestStats = {
            total: 0,
            cached: 0,
            batched: 0,
            failed: 0
        };
        console.log('🔄 API statistics reset');
    }

    // Clear all queues
    clearQueues() {
        this.requestQueue.clear();
        this.batchQueue.clear();
        console.log('🧹 API queues cleared');
    }

    // Cleanup
    cleanup() {
        this.clearQueues();
        console.log('🧹 Optimized API cleaned up');
    }
}

// Create global instance
const optimizedAPI = new OptimizedAPI();

// Export for use in other modules
window.optimizedAPI = optimizedAPI;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = optimizedAPI;
}

console.log('🚀 Optimized API Module loaded and ready');
