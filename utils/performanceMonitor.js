// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.slowQueries = [];
  }

  // Start timing an operation
  startTimer(operation) {
    const timer = {
      start: Date.now(),
      operation
    };
    this.metrics.set(operation, timer);
    return timer;
  }

  // End timing an operation
  endTimer(operation) {
    const timer = this.metrics.get(operation);
    if (timer) {
      timer.duration = Date.now() - timer.start;
      timer.end = Date.now();
      
      // Track slow queries (> 1 second)
      if (timer.duration > 1000) {
        this.slowQueries.push({
          operation,
          duration: timer.duration,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 slow queries
        if (this.slowQueries.length > 100) {
          this.slowQueries.shift();
        }
      }
      
      return timer.duration;
    }
    return 0;
  }

  // Track API request
  trackRequest(method, path, duration, statusCode) {
    this.requestCount++;
    
    const key = `${method} ${path}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0
      });
    }
    
    const metric = this.metrics.get(key);
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    
    if (statusCode >= 400) {
      metric.errorCount++;
      this.errorCount++;
    }
  }

  // Track database query
  trackQuery(collection, operation, duration) {
    const key = `DB:${collection}:${operation}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      });
    }
    
    const metric = this.metrics.get(key);
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
  }

  // Track cache hit/miss
  trackCache(operation, hit) {
    const key = `CACHE:${operation}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        hits: 0,
        misses: 0,
        hitRate: 0
      });
    }
    
    const metric = this.metrics.get(key);
    if (hit) {
      metric.hits++;
    } else {
      metric.misses++;
    }
    metric.hitRate = metric.hits / (metric.hits + metric.misses);
  }

  // Get performance summary
  getSummary() {
    const uptime = Date.now() - this.startTime;
    const requestsPerSecond = this.requestCount / (uptime / 1000);
    const errorRate = this.errorCount / this.requestCount;
    
    return {
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000)
      },
      requests: {
        total: this.requestCount,
        perSecond: requestsPerSecond.toFixed(2),
        errorCount: this.errorCount,
        errorRate: (errorRate * 100).toFixed(2) + '%'
      },
      slowQueries: this.slowQueries.length,
      metrics: Object.fromEntries(this.metrics)
    };
  }

  // Get slow queries
  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Get top endpoints by request count
  getTopEndpoints(limit = 10) {
    const endpoints = Array.from(this.metrics.entries())
      .filter(([key]) => key.includes('GET ') || key.includes('POST ') || key.includes('PUT ') || key.includes('DELETE '))
      .map(([key, value]) => ({
        endpoint: key,
        count: value.count,
        avgDuration: value.avgDuration,
        errorCount: value.errorCount
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return endpoints;
  }

  // Get database performance
  getDatabasePerformance() {
    const dbMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('DB:'))
      .map(([key, value]) => ({
        operation: key,
        count: value.count,
        avgDuration: value.avgDuration,
        minDuration: value.minDuration,
        maxDuration: value.maxDuration
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
    
    return dbMetrics;
  }

  // Get cache performance
  getCachePerformance() {
    const cacheMetrics = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith('CACHE:'))
      .map(([key, value]) => ({
        operation: key.replace('CACHE:', ''),
        hits: value.hits,
        misses: value.misses,
        hitRate: (value.hitRate * 100).toFixed(2) + '%'
      }));
    
    return cacheMetrics;
  }

  // Reset metrics
  reset() {
    this.metrics.clear();
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.slowQueries = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Middleware for tracking requests
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMonitor.trackRequest(req.method, req.path, duration, res.statusCode);
  });
  
  next();
};

module.exports = {
  performanceMonitor,
  performanceMiddleware
};
