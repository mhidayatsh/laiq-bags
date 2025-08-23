// Shared Caching Strategy Module
// Implements intelligent caching for better performance across all management systems

class CacheModule {
    constructor() {
        this.cache = new Map();
        this.cacheConfig = {
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 100, // Maximum cache entries
            cleanupInterval: 60 * 1000, // Cleanup every minute
            persistent: true // Use localStorage for persistence
        };
        this.requestQueue = new Map();
        this.batchRequests = new Map();
        this.batchTimeout = 100; // Batch requests within 100ms
        
        this.initialize();
    }

    // Initialize the cache module
    initialize() {
        console.log('💾 Initializing Shared Cache Module...');
        
        // Load persistent cache from localStorage
        if (this.cacheConfig.persistent) {
            this.loadPersistentCache();
        }
        
        // Start cleanup interval
        this.startCleanupInterval();
        
        // Setup storage event listener for cross-tab sync
        this.setupStorageSync();
        
        console.log('✅ Shared Cache Module initialized');
    }

    // Set cache entry with TTL
    set(key, value, ttl = this.cacheConfig.defaultTTL) {
        const entry = {
            value: value,
            timestamp: Date.now(),
            ttl: ttl,
            accessCount: 0,
            lastAccessed: Date.now()
        };

        // Check cache size limit
        if (this.cache.size >= this.cacheConfig.maxSize) {
            this.evictLeastUsed();
        }

        this.cache.set(key, entry);
        
        // Persist to localStorage if enabled
        if (this.cacheConfig.persistent) {
            this.persistToStorage(key, entry);
        }

        return true;
    }

    // Get cache entry
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (this.isExpired(entry)) {
            this.delete(key);
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        
        // Update in cache
        this.cache.set(key, entry);
        
        // Persist to localStorage if enabled
        if (this.cacheConfig.persistent) {
            this.persistToStorage(key, entry);
        }

        return entry.value;
    }

    // Check if cache entry is expired
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    // Delete cache entry
    delete(key) {
        this.cache.delete(key);
        
        // Remove from localStorage if enabled
        if (this.cacheConfig.persistent) {
            this.removeFromStorage(key);
        }
        
        return true;
    }

    // Clear all cache
    clear() {
        this.cache.clear();
        
        // Clear localStorage cache if enabled
        if (this.cacheConfig.persistent) {
            this.clearStorageCache();
        }
        
        console.log('🧹 Cache cleared');
    }

    // Get cache statistics
    getStats() {
        const totalEntries = this.cache.size;
        let expiredEntries = 0;
        let totalAccessCount = 0;
        let oldestEntry = null;
        let newestEntry = null;

        for (const [key, entry] of this.cache) {
            if (this.isExpired(entry)) {
                expiredEntries++;
            }
            totalAccessCount += entry.accessCount;
            
            if (!oldestEntry || entry.timestamp < oldestEntry.timestamp) {
                oldestEntry = { key, timestamp: entry.timestamp };
            }
            if (!newestEntry || entry.timestamp > newestEntry.timestamp) {
                newestEntry = { key, timestamp: entry.timestamp };
            }
        }

        return {
            totalEntries,
            expiredEntries,
            totalAccessCount,
            averageAccessCount: totalEntries > 0 ? totalAccessCount / totalEntries : 0,
            oldestEntry,
            newestEntry,
            cacheSize: this.cache.size,
            maxSize: this.cacheConfig.maxSize
        };
    }

    // Evict least used entries
    evictLeastUsed() {
        const entries = Array.from(this.cache.entries());
        
        // Sort by access count and last accessed time
        entries.sort((a, b) => {
            if (a[1].accessCount !== b[1].accessCount) {
                return a[1].accessCount - b[1].accessCount;
            }
            return a[1].lastAccessed - b[1].lastAccessed;
        });

        // Remove 20% of least used entries
        const removeCount = Math.ceil(entries.length * 0.2);
        for (let i = 0; i < removeCount; i++) {
            this.delete(entries[i][0]);
        }

        console.log(`🗑️ Evicted ${removeCount} least used cache entries`);
    }

    // Start cleanup interval
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, this.cacheConfig.cleanupInterval);
    }

    // Cleanup expired entries
    cleanup() {
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache) {
            if (this.isExpired(entry)) {
                this.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
        }
    }

    // Batch API requests for better performance
    batchRequest(endpoint, params, ttl = this.cacheConfig.defaultTTL) {
        const cacheKey = this.generateCacheKey(endpoint, params);
        
        // Check if request is already in progress
        if (this.requestQueue.has(cacheKey)) {
            return this.requestQueue.get(cacheKey);
        }

        // Check cache first
        const cached = this.get(cacheKey);
        if (cached) {
            return Promise.resolve(cached);
        }

        // Create new request promise
        const requestPromise = this.executeRequest(endpoint, params).then(response => {
            // Cache the response
            this.set(cacheKey, response, ttl);
            
            // Remove from request queue
            this.requestQueue.delete(cacheKey);
            
            return response;
        }).catch(error => {
            // Remove from request queue on error
            this.requestQueue.delete(cacheKey);
            throw error;
        });

        // Add to request queue
        this.requestQueue.set(cacheKey, requestPromise);
        
        return requestPromise;
    }

    // Execute actual API request
    async executeRequest(endpoint, params) {
        try {
            const url = new URL(endpoint, window.location.origin);
            
            // Add params to URL
            if (params) {
                Object.keys(params).forEach(key => {
                    if (params[key] !== undefined && params[key] !== null) {
                        url.searchParams.append(key, params[key]);
                    }
                });
            }

            // Get auth headers
            const headers = {
                'Content-Type': 'application/json',
                ...(window.authModule ? window.authModule.getAuthHeader() : {})
            };

            const response = await fetch(url.toString(), { headers });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API request error:', error);
            throw error;
        }
    }

    // Generate cache key from endpoint and params
    generateCacheKey(endpoint, params) {
        const paramString = params ? JSON.stringify(params) : '';
        return `${endpoint}:${paramString}`;
    }

    // Preload frequently accessed data
    preloadData(endpoints) {
        console.log('🚀 Preloading frequently accessed data...');
        
        endpoints.forEach(({ endpoint, params, ttl }) => {
            this.batchRequest(endpoint, params, ttl);
        });
    }

    // Warm up cache with common requests
    warmupCache() {
        const commonEndpoints = [
            { endpoint: '/api/admin/dashboard', params: {}, ttl: 2 * 60 * 1000 }, // 2 minutes
            { endpoint: '/api/admin/orders', params: { page: 1, limit: 10 }, ttl: 1 * 60 * 1000 }, // 1 minute
            { endpoint: '/api/admin/products', params: { page: 1, limit: 20 }, ttl: 5 * 60 * 1000 }, // 5 minutes
        ];

        this.preloadData(commonEndpoints);
    }

    // Invalidate cache by pattern
    invalidatePattern(pattern) {
        let invalidatedCount = 0;
        
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.delete(key);
                invalidatedCount++;
            }
        }

        if (invalidatedCount > 0) {
            console.log(`🗑️ Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`);
        }

        return invalidatedCount;
    }

    // Invalidate cache by endpoint
    invalidateEndpoint(endpoint) {
        return this.invalidatePattern(endpoint);
    }

    // Invalidate all cache
    invalidateAll() {
        const count = this.cache.size;
        this.clear();
        console.log(`🗑️ Invalidated all ${count} cache entries`);
        return count;
    }

    // Persist cache to localStorage
    persistToStorage(key, entry) {
        try {
            const storageKey = `cache_${key}`;
            const storageData = {
                ...entry,
                value: JSON.stringify(entry.value) // Serialize value
            };
            localStorage.setItem(storageKey, JSON.stringify(storageData));
        } catch (error) {
            console.warn('⚠️ Could not persist cache to localStorage:', error);
        }
    }

    // Load cache from localStorage
    loadPersistentCache() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cache_')) {
                    try {
                        const storageData = JSON.parse(localStorage.getItem(key));
                        const cacheKey = key.replace('cache_', '');
                        
                        // Deserialize value
                        storageData.value = JSON.parse(storageData.value);
                        
                        // Check if still valid
                        if (!this.isExpired(storageData)) {
                            this.cache.set(cacheKey, storageData);
                        } else {
                            localStorage.removeItem(key);
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not load cache entry:', key, error);
                        localStorage.removeItem(key);
                    }
                }
            }
            
            console.log(`📥 Loaded ${this.cache.size} persistent cache entries`);
        } catch (error) {
            console.warn('⚠️ Could not load persistent cache:', error);
        }
    }

    // Remove from localStorage
    removeFromStorage(key) {
        try {
            localStorage.removeItem(`cache_${key}`);
        } catch (error) {
            console.warn('⚠️ Could not remove cache from localStorage:', error);
        }
    }

    // Clear localStorage cache
    clearStorageCache() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('cache_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ Cleared ${keysToRemove.length} persistent cache entries`);
        } catch (error) {
            console.warn('⚠️ Could not clear persistent cache:', error);
        }
    }

    // Setup cross-tab storage sync
    setupStorageSync() {
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('cache_')) {
                const cacheKey = event.key.replace('cache_', '');
                
                if (event.newValue) {
                    try {
                        const storageData = JSON.parse(event.newValue);
                        storageData.value = JSON.parse(storageData.value);
                        
                        if (!this.isExpired(storageData)) {
                            this.cache.set(cacheKey, storageData);
                        }
                    } catch (error) {
                        console.warn('⚠️ Could not sync cache entry:', error);
                    }
                } else {
                    this.cache.delete(cacheKey);
                }
            }
        });
    }

    // Get cache hit rate
    getHitRate() {
        const stats = this.getStats();
        const totalRequests = stats.totalAccessCount;
        const cacheHits = stats.totalAccessCount - this.requestQueue.size;
        
        return totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    }

    // Optimize cache based on usage patterns
    optimizeCache() {
        const stats = this.getStats();
        const hitRate = this.getHitRate();
        
        console.log(`📊 Cache optimization - Hit rate: ${hitRate.toFixed(2)}%`);
        
        // Adjust TTL based on hit rate
        if (hitRate < 50) {
            this.cacheConfig.defaultTTL = Math.min(this.cacheConfig.defaultTTL * 1.5, 30 * 60 * 1000);
            console.log(`⏰ Increased default TTL to ${this.cacheConfig.defaultTTL / 1000}s`);
        } else if (hitRate > 80) {
            this.cacheConfig.defaultTTL = Math.max(this.cacheConfig.defaultTTL * 0.8, 1 * 60 * 1000);
            console.log(`⏰ Decreased default TTL to ${this.cacheConfig.defaultTTL / 1000}s`);
        }
        
        // Adjust cache size based on usage
        if (stats.totalEntries > stats.maxSize * 0.8) {
            this.cacheConfig.maxSize = Math.min(stats.maxSize * 1.5, 500);
            console.log(`📦 Increased max cache size to ${this.cacheConfig.maxSize}`);
        }
    }
}

// Create global instance
const cacheModule = new CacheModule();

// Auto-initialize when module loads
cacheModule.initialize();

// Export for use in other modules
window.cacheModule = cacheModule;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cacheModule;
}

console.log('💾 Shared Cache Module loaded and ready');
