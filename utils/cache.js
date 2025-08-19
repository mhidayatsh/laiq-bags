const redis = require('redis');

// Redis client configuration
let redisClient = null;

// Initialize Redis client
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });
    } else {
      // Fallback to local Redis for development
      redisClient = redis.createClient({
        host: 'localhost',
        port: 6379
      });
    }

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    
    // Test connection
    await redisClient.ping();
    console.log('✅ Redis ping successful');
    
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis connection failed, using in-memory cache:', error.message);
    return null;
  }
};

// Cache wrapper with fallback to in-memory
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
  }

  async init() {
    this.redisClient = await initRedis();
  }

  async get(key) {
    try {
      if (this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.warn('Redis get error, falling back to memory:', error.message);
    }
    
    // Fallback to memory cache
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }
    return null;
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.redisClient) {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return;
      }
    } catch (error) {
      console.warn('Redis set error, falling back to memory:', error.message);
    }
    
    // Fallback to memory cache
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  async del(key) {
    try {
      if (this.redisClient) {
        await this.redisClient.del(key);
        return;
      }
    } catch (error) {
      console.warn('Redis del error, falling back to memory:', error.message);
    }
    
    // Fallback to memory cache
    this.memoryCache.delete(key);
  }

  async flush() {
    try {
      if (this.redisClient) {
        await this.redisClient.flushAll();
        return;
      }
    } catch (error) {
      console.warn('Redis flush error, falling back to memory:', error.message);
    }
    
    // Fallback to memory cache
    this.memoryCache.clear();
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Initialize cache on module load
cacheManager.init().catch(console.error);

module.exports = cacheManager;
