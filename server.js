const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
// Load environment variables based on NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
  ? './config.env.production' 
  : './config.env';
require('dotenv').config({ path: envPath });

// Server Configuration
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Import security middleware
const { 
  sanitizeQuery, 
  validateObjectId, 
  dbOperationLimiter, 
  validateInput,
  logDbOperation 
} = require('./middleware/databaseSecurity');

// Import enhanced rate limiters
const { 
  generalLimiter, 
  analyticsLimiter,
  authLimiter, 
  passwordResetLimiter, 
  adminLimiter, 
  uploadLimiter,
  devLimiter 
} = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const cartRoutes = require('./routes/cart');
const newsletterRoutes = require('./routes/newsletter');
const analyticsRoutes = require('./routes/analytics');
const contactRoutes = require('./routes/contact');
const sitemapRoutes = require('./routes/sitemap');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://checkout.razorpay.com",
        "https://cdn.razorpay.com",
        "https://js.razorpay.com",
        "https://js.stripe.com",
        "https://code.jquery.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "https://images.unsplash.com", "https://randomuser.me", "https://via.placeholder.com"],
      frameSrc: [
        "'self'",
        "https://checkout.razorpay.com",
        "https://cdn.razorpay.com",
        "https://api.razorpay.com",
        "https://razorpay.com"
      ],
      connectSrc: [
        "'self'", 
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://localhost:3443",
        "https://127.0.0.1:3443",
        "https://api.razorpay.com",
        "https://lumberjack.razorpay.com"
      ],
      formAction: [
        "'self'",
        "https://checkout.razorpay.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:5501', 
    'http://127.0.0.1:5501', 
    'http://localhost:8000', 
    'http://127.0.0.1:8000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://localhost:3443',
    'https://127.0.0.1:3443',
    'null'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle CORS preflight requests
app.options('*', cors());

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Domain redirect logic - Redirect non-www to www for SEO
app.use((req, res, next) => {
  const host = req.get('host');
  const protocol = req.protocol;
  
  // Check if it's a production environment and the request is for the non-www domain
  if (process.env.NODE_ENV === 'production' && 
      host === 'laiq.shop' && 
      !host.startsWith('www.')) {
    
    // Redirect to www version
    const redirectUrl = `${protocol}://www.${host}${req.url}`;
    console.log(`🔄 Redirecting ${host} to www.${host}`);
    return res.redirect(301, redirectUrl);
  }
  
  // Prevent reverse redirect (www to non-www)
  if (process.env.NODE_ENV === 'production' && 
      host.startsWith('www.') && 
      host === 'www.laiq.shop') {
    
    // This is the correct domain, don't redirect
    console.log(`✅ Correct domain: ${host}`);
  }
  
  next();
});

// Performance optimizations
app.use(compression()); // Enable gzip compression
app.use(express.static('public', {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
}));

// Base rate limiter (disabled by default to avoid double-limiting; using enhanced limiters from middleware/rateLimiter)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.BASE_RATE_LIMIT_MAX || '100'),
    message: 'Too many requests from this IP, please try again later.'
});
const enableBaseLimiter = process.env.ENABLE_BASE_LIMITER === 'true';
if (enableBaseLimiter) {
  app.use('/api/', limiter);
}

// Database security middleware
app.use(sanitizeQuery);
app.use(dbOperationLimiter); // Now bypasses GET in dev
app.use(logDbOperation);

// Enhanced rate limiting based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // More lenient rate limiting for development
  app.use('/api/', devLimiter);
} else {
  // Stricter rate limiting for production
  app.use('/api/', generalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/password/forgot', passwordResetLimiter);
  app.use('/api/auth/admin/forgot-password', passwordResetLimiter);
  app.use('/api/admin', adminLimiter);
  app.use('/api/upload', uploadLimiter);
}

// Body parser middleware with increased limits for product data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Analytics routes with special rate limiter (excluded from general limiter)
app.use('/api/analytics', analyticsLimiter, analyticsRoutes);

// Static files with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
  }
}));

// Serve static files in development
if (process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(__dirname)));
  
  // Explicitly serve assets folder with proper MIME types
  app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      // Set proper MIME types for different file types
      if (path.endsWith('.mp4')) {
        res.set('Content-Type', 'video/mp4');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.set('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.set('Content-Type', 'image/png');
      } else if (path.endsWith('.gif')) {
        res.set('Content-Type', 'image/gif');
      } else if (path.endsWith('.webp')) {
        res.set('Content-Type', 'image/webp');
      } else if (path.endsWith('.svg')) {
        res.set('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.ico')) {
        res.set('Content-Type', 'image/x-icon');
      }
    }
  }));

  // Serve CSS files with proper MIME type
  app.use('/css', express.static(path.join(__dirname, 'css'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      res.set('Content-Type', 'text/css');
    }
  }));

  // Serve JavaScript files with proper MIME type
  app.use('/js', express.static(path.join(__dirname, 'js'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      res.set('Content-Type', 'application/javascript');
    }
  }));

  // Serve favicon to avoid 404s
app.get('/favicon.ico', (req, res) => {
  const iconPath = path.join(__dirname, 'favicon.ico');
  if (fs.existsSync(iconPath)) {
    res.type('image/x-icon');
    res.sendFile(iconPath);
  } else {
    // Fallback to logo if favicon doesn't exist
    const logoPath = path.join(__dirname, 'assets', 'laiq-logo.png');
    if (fs.existsSync(logoPath)) {
      res.type('image/png');
      res.sendFile(logoPath);
    } else {
      // Send a simple 1x1 transparent PNG as last resort
      res.type('image/png');
      res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
    }
  }
});

  // Serve video files with proper streaming support
  app.get('/assets/*.mp4', (req, res) => {
    const videoPath = path.join(__dirname, req.path);
    console.log('🎥 Serving video file:', videoPath);
    
    if (fs.existsSync(videoPath)) {
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
      }
    } else {
      console.log('❌ Video file not found:', videoPath);
      res.status(404).json({ error: 'Video file not found' });
    }
  });

  // Serve web manifest with proper MIME type
  app.get('/site.webmanifest', (req, res) => {
    const manifestPath = path.join(__dirname, 'site.webmanifest');
    console.log('📱 Serving web manifest:', manifestPath);
    
    if (fs.existsSync(manifestPath)) {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.sendFile(manifestPath);
    } else {
      console.log('❌ Web manifest not found:', manifestPath);
      res.status(404).json({ error: 'Web manifest not found' });
    }
  });
  
  // Serve HTML files properly
  app.get('*.html', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    console.log('📄 Serving HTML file:', filePath);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.log('❌ File not found:', filePath);
      res.status(404).send('File not found');
    }
  });
  
  // Serve checkout.html specifically
  app.get('/checkout', (req, res) => {
    const filePath = path.join(__dirname, 'checkout.html');
    console.log('🛒 Serving checkout.html:', filePath);
    res.sendFile(filePath);
  });
  
  // Serve index.html for root path (only in development)
  app.get('/home', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    console.log('🏠 Serving index.html:', indexPath);
    res.sendFile(indexPath);
  });
  
  // Catch-all route for HTML files in development
  app.get('*', (req, res, next) => {
    // Check if it's an HTML file request
    if (req.path.endsWith('.html') || req.path === '/checkout') {
      let filePath;
      if (req.path === '/checkout') {
        filePath = path.join(__dirname, 'checkout.html');
      } else {
        filePath = path.join(__dirname, req.path);
      }
      
      console.log('📄 Serving HTML file:', filePath);
      
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        console.log('❌ File not found:', filePath);
        res.status(404).send('File not found');
      }
    } else {
      // For non-HTML requests, continue to next middleware
      next();
    }
  });
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Root route - serve the main website
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  console.log('🏠 Serving main website:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback to JSON if index.html doesn't exist
    res.json({
      status: 'OK',
      message: 'Laiq Bags E-commerce API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 'not set'
    });
  }
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // Check uptime
    const uptime = process.uptime();
    const uptimeFormatted = {
      seconds: Math.floor(uptime),
      minutes: Math.floor(uptime / 60),
      hours: Math.floor(uptime / 3600),
      days: Math.floor(uptime / 86400)
    };
    
    res.json({
      status: 'OK',
      message: 'Laiq Bags API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        connection: mongoose.connection.readyState
      },
      system: {
        uptime: uptimeFormatted,
        memory: memUsageMB,
        platform: process.platform,
        nodeVersion: process.version
      },
      security: {
        rateLimiting: 'enabled',
        cors: 'enabled',
        helmet: 'enabled',
        inputValidation: 'enabled'
      },
      render: {
        environment: process.env.RENDER ? 'detected' : 'not detected',
        keepAlive: process.env.RENDER ? 'enabled' : 'not needed'
      }
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with security middleware
app.use('/api/auth', validateInput, authRoutes);
// Important: More specific routes must come BEFORE general ones to avoid conflicts
app.use('/api/admin', validateObjectId, adminRoutes);
// Important: do NOT validate ObjectId on list route query params. We'll validate per-route inside products router.
app.use('/api/products', productRoutes);
app.use('/api/orders', validateObjectId, orderRoutes);
app.use('/api/user', validateObjectId, userRoutes);
app.use('/api/wishlist', validateObjectId, wishlistRoutes);
app.use('/api/review', validateObjectId, reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/cart', validateObjectId, cartRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/', sitemapRoutes);
// Analytics routes are handled separately above

// Newsletter subscription endpoint (placeholder)
app.post('/api/newsletter/subscribe', validateInput, (req, res) => {
  const { email } = req.body;
  console.log('Newsletter subscription:', email);
  res.json({ success: true, message: 'Subscribed successfully' });
});

// Public settings endpoint
app.get('/api/settings', async (req, res) => {
  try {
    console.log('🔍 Public settings request received');
    
    // Add cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    const Settings = require('./models/Settings');
    
    // Get settings from database or return defaults
    let settings = await Settings.findOne();
    if (!settings) {
      // Return default settings without creating in database
      settings = {
        websiteName: 'Laiq Bags',
        websiteDescription: 'Premium bags and accessories',
        contactEmail: 'info@laiqbags.com',
        contactPhone: '+91 98765 43210',
        whatsappNumber: '+91 99999 99999',
        instagramHandle: '@laiq_bags_',
        address: 'Mumbai, Maharashtra, India',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        },
        theme: {
          primaryColor: '#d4af37',
          secondaryColor: '#f5f5dc'
        }
      };
    } else {
      // Ensure the settings object has the required fields
      const settingsObj = settings.toObject ? settings.toObject() : settings;
      settings = {
        ...settingsObj,
        whatsappNumber: settingsObj.whatsappNumber || '+91 99999 99999',
        instagramHandle: settingsObj.instagramHandle || '@laiq_bags_'
      };
    }
    
    // Always ensure these fields are present in the response
    const responseSettings = {
      websiteName: settings.websiteName || 'Laiq Bags',
      websiteDescription: settings.websiteDescription || 'Premium bags and accessories',
      contactEmail: settings.contactEmail || 'info@laiqbags.com',
      contactPhone: settings.contactPhone || '+91 98765 43210',
      whatsappNumber: settings.whatsappNumber || '+91 99999 99999',
      instagramHandle: settings.instagramHandle || '@laiq_bags_',
      address: settings.address || 'Mumbai, Maharashtra, India',
      socialMedia: settings.socialMedia || {},
      theme: settings.theme || {
        primaryColor: '#d4af37',
        secondaryColor: '#f5f5dc'
      }
    };
    
    console.log('📤 Sending settings response');
    
    res.status(200).json({
      success: true,
      settings: responseSettings
    });
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Serve web manifest with proper MIME type (before static files)
  app.get('/site.webmanifest', (req, res) => {
    const manifestPath = path.join(__dirname, 'site.webmanifest');
    console.log('📱 Serving web manifest (production):', manifestPath);
    
    if (fs.existsSync(manifestPath)) {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.sendFile(manifestPath);
    } else {
      console.log('❌ Web manifest not found (production):', manifestPath);
      res.status(404).json({ error: 'Web manifest not found' });
    }
  });
  
  // Serve static files with proper MIME types in production
  app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      // Set proper MIME types for different file types
      if (path.endsWith('.mp4')) {
        res.set('Content-Type', 'video/mp4');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.set('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.set('Content-Type', 'image/png');
      } else if (path.endsWith('.gif')) {
        res.set('Content-Type', 'image/gif');
      } else if (path.endsWith('.webp')) {
        res.set('Content-Type', 'image/webp');
      } else if (path.endsWith('.svg')) {
        res.set('Content-Type', 'image/svg+xml');
      } else if (path.endsWith('.ico')) {
        res.set('Content-Type', 'image/x-icon');
      }
    }
  }));

  // Serve CSS files with proper MIME type
  app.use('/css', express.static(path.join(__dirname, 'css'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      res.set('Content-Type', 'text/css');
    }
  }));

  // Serve JavaScript files with proper MIME type
  app.use('/js', express.static(path.join(__dirname, 'js'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      res.set('Content-Type', 'application/javascript');
    }
  }));

  // Serve favicon
  app.get('/favicon.ico', (req, res) => {
    const iconPath = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(iconPath)) {
      res.type('image/x-icon');
      res.sendFile(iconPath);
    } else {
      const logoPath = path.join(__dirname, 'assets', 'laiq-logo.png');
      if (fs.existsSync(logoPath)) {
        res.type('image/png');
        res.sendFile(logoPath);
      } else {
        res.type('image/png');
        res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
      }
    }
  });
  
  app.use(express.static(path.join(__dirname)));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

// Payment callback route for Razorpay
app.post('/payment-callback.html', (req, res) => {
  console.log('🔄 Payment callback received:', req.body);
  
  // Redirect to payment callback page with query parameters
  const queryParams = new URLSearchParams(req.body).toString();
  res.redirect(`/payment-callback.html?${queryParams}`);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start HTTP server
const startServer = (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 HTTP Server running on port ${port}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${port}/api`);
    console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
    console.log(`🔒 Security: Enhanced with XSS, NoSQL injection, and parameter pollution protection`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Please stop the existing server or use a different port.`);
      console.log('💡 Try: pkill -f "node server.js" && npm start');
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
      process.exit(0);
    });
  });

  return server;
};

// Start HTTPS server (for development)
const startHttpsServer = (port) => {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
    };

    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(port, () => {
      console.log(`🔐 HTTPS Server running on port ${port}`);
      console.log(`🔗 Secure API URL: https://localhost:${port}/api`);
      console.log(`💳 Razorpay will work with automatic card filling!`);
    });

    return httpsServer;
  } catch (error) {
    console.log('⚠️ HTTPS server not started (SSL certificates not found)');
    return null;
  }
};

// Start HTTP server only (for development)
const startHttpServer = () => {
  startServer(PORT);
  console.log(`🚀 Development HTTP server running on port ${PORT}`);
};

// Start servers function (for production)
function startServers() {
  if (process.env.NODE_ENV === 'production') {
    startServer(PORT);
    console.log(`🚀 Production server running on port ${PORT}`);
    
    // Keep-alive mechanism for Render free tier
    if (process.env.RENDER) {
      console.log('🔧 Render environment detected - enabling keep-alive mechanism');
      
      // Ping the server every 14 minutes to keep it alive
      setInterval(() => {
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: PORT,
          path: '/api/health',
          method: 'GET',
          timeout: 5000
        };
        
        const req = http.request(options, (res) => {
          console.log(`💓 Keep-alive ping successful: ${res.statusCode}`);
        });
        
        req.on('error', (err) => {
          console.log(`⚠️ Keep-alive ping failed: ${err.message}`);
        });
        
        req.on('timeout', () => {
          console.log('⚠️ Keep-alive ping timeout');
          req.destroy();
        });
        
        req.end();
      }, 14 * 60 * 1000); // 14 minutes
      
      // Also ping external service to prevent sleep
      setInterval(() => {
        const https = require('https');
        const options = {
          hostname: 'laiq.shop',
          port: 443,
          path: '/api/health',
          method: 'GET',
          timeout: 10000
        };
        
        const req = https.request(options, (res) => {
          console.log(`🌐 External keep-alive ping successful: ${res.statusCode}`);
        });
        
        req.on('error', (err) => {
          console.log(`⚠️ External keep-alive ping failed: ${err.message}`);
        });
        
        req.on('timeout', () => {
          console.log('⚠️ External keep-alive ping timeout');
          req.destroy();
        });
        
        req.end();
      }, 10 * 60 * 1000); // 10 minutes
    }
  } else {
    startServer(PORT);
    const sslCertPath = path.join(__dirname, 'ssl', 'cert.pem');
    const sslKeyPath = path.join(__dirname, 'ssl', 'key.pem');
    if (fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath)) {
      startHttpsServer(HTTPS_PORT);
    } else {
      console.log('⚠️  SSL certificates not found, HTTPS server not started');
    }
  }
}

// MongoDB connection with retry mechanism
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

function connectWithRetry() {
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increased to 30s
    socketTimeoutMS: 120000, // Increased to 120s
    connectTimeoutMS: 30000, // Increased to 30s
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
    w: 'majority',
    heartbeatFrequencyMS: 10000,
    // Connection-level timeouts
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    },
    // Better connection management
    bufferCommands: true,
    // DNS resolution settings
    family: 4, // Force IPv4
    // Additional connection options
    keepAlive: true,
    keepAliveInitialDelay: 300000 // 5 minutes
  };

  console.log('🔗 Attempting to connect to MongoDB...');
  console.log('📡 Connection string:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'NOT SET');
  
  mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    retryCount = 0;
    
    // Enhanced connection event handling
    mongoose.connection.on('connected', () => { 
      console.log('🔗 MongoDB connection established'); 
    });
    
    mongoose.connection.on('error', (err) => { 
      console.error('❌ MongoDB connection error:', err);
      // Force reconnection on critical errors
      if (err.name === 'MongoNetworkTimeoutError' || err.name === 'MongoServerSelectionError') {
        console.log('🔄 Critical connection error, forcing reconnection...');
        mongoose.disconnect();
        setTimeout(connectWithRetry, 1000);
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection disconnected');
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`🔄 Attempting to reconnect (${retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`);
        setTimeout(connectWithRetry, RETRY_DELAY);
      } else {
        console.error('❌ Max retry attempts reached. Please check your MongoDB connection.');
        // Force restart after max retries
        console.log('🔄 Force restarting server...');
        process.exit(1);
      }
    });
    
    mongoose.connection.on('reconnected', () => { 
      console.log('🔄 MongoDB connection reestablished'); 
      retryCount = 0;
    });
    
    // MongoDB connection established successfully
    console.log('✅ MongoDB ready for database operations');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`🔄 Retrying connection (${retryCount}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`);
      setTimeout(connectWithRetry, RETRY_DELAY);
    } else {
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify MongoDB Atlas is accessible');
      console.log('   3. Check if your IP is whitelisted');
      console.log('   4. Verify connection string is correct');
      console.log('   5. Try using a different network');
      process.exit(1);
    }
  });
}

// Start the connection process
if (process.env.NODE_ENV === 'production') {
  // In production, start server immediately and connect to MongoDB in background
  startServers();
  connectWithRetry();
} else {
  // In development, start HTTP server immediately and connect to MongoDB in background
  startHttpServer();
  connectWithRetry();
}