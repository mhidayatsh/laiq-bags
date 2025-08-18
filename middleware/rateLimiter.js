const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client for rate limiting (optional)
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  redisClient.connect().catch(console.error);
}

// Store configuration
const store = redisClient ? new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(args)
}) : undefined;

// General API rate limiter - EXTREMELY HIGH LIMITS
const generalLimiter = rateLimit({
  store,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000000, // Increased to 1 million requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and analytics
    return req.path === '/api/health' || req.path.includes('/analytics');
  }
});

// Analytics rate limiter - VERY HIGH LIMITS
const analyticsLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100000, // 100,000 analytics requests per minute
  message: {
    success: false,
    message: 'Analytics rate limit exceeded, using fallback data',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available for more specific rate limiting
    return req.user ? `${req.ip}-${req.user.id}` : req.ip;
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased to 10,000 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email + IP for more specific rate limiting
    return req.body.email ? `${req.ip}-${req.body.email}` : req.ip;
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Increased to 1,000 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email ? `${req.ip}-${req.body.email}` : req.ip;
  }
});

// Admin endpoints rate limiter
const adminLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // Increased to 100,000 requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Increased to 10,000 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Order creation rate limiter (more lenient for checkout)
const orderLimiter = rateLimit({
  store,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10000, // Increased to 10,000 order creation attempts per 5 minutes
  message: {
    success: false,
    message: 'Too many order creation attempts, please try again later.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available for more specific rate limiting
    return req.user ? `${req.ip}-${req.user.id}` : req.ip;
  }
});

// Cart operations rate limiter (new)
const cartLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50000, // Increased to 50,000 cart operations per minute
  message: {
    success: false,
    message: 'Too many cart operations, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `${req.ip}-${req.user.id}` : req.ip;
  }
});

// Development mode rate limiter (very lenient)
const devLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000000, // Increased to 1 million for development
  message: {
    success: false,
    message: 'Development rate limit exceeded.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  analyticsLimiter,
  authLimiter,
  passwordResetLimiter,
  adminLimiter,
  uploadLimiter,
  orderLimiter,
  cartLimiter,
  devLimiter
}; 