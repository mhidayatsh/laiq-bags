const mongoose = require('mongoose');

// Prevent NoSQL injection by sanitizing query parameters
const sanitizeQuery = (req, res, next) => {
  try {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          // Remove any MongoDB operators
          req.query[key] = req.query[key].replace(/[$]/g, '');
        }
      });
    }

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Remove any MongoDB operators
          req.body[key] = req.body[key].replace(/[$]/g, '');
        }
      });
    }

    // Sanitize params
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          // Remove any MongoDB operators
          req.params[key] = req.params[key].replace(/[$]/g, '');
        }
      });
    }

    next();
  } catch (error) {
    console.error('❌ Query sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid request parameters'
    });
  }
};

// Validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ ObjectId validation error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
};

// Rate limiting for database operations
const dbOperationLimiter = (req, res, next) => {
  // In development, skip DB op limiter entirely
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Allow GET requests without limiter to avoid blocking listings/search
  if (req.method === 'GET') {
    return next();
  }

  // This would typically integrate with Redis or similar
  // For now, we'll use a simple in-memory store
  const clientIP = req.ip;
  const operationKey = `${clientIP}-${req.method}-${req.path}`;
  
  // Simple rate limiting logic
  if (!req.app.locals.dbOperations) {
    req.app.locals.dbOperations = {};
  }
  
  if (!req.app.locals.dbOperations[operationKey]) {
    req.app.locals.dbOperations[operationKey] = {
      count: 0,
      resetTime: Date.now() + 60000 // 1 minute
    };
  }
  
  const operation = req.app.locals.dbOperations[operationKey];
  
  // Reset counter if time has passed
  if (Date.now() > operation.resetTime) {
    operation.count = 0;
    operation.resetTime = Date.now() + 60000;
  }
  
  // Increment counter
  operation.count++;
  
  // Limit to 100 operations per minute per IP per endpoint (writes only)
  if (operation.count > 100) {
    return res.status(429).json({
      success: false,
      message: 'Too many database operations. Please try again later.'
    });
  }
  
  next();
};

// Input validation for common fields
const validateInput = (req, res, next) => {
  try {
    const { email, phone, name } = req.body;
    
    // Email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }
    
    // Phone validation
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format (10 digits required)'
        });
      }
    }
    
    // Name validation
    if (name) {
      if (name.length < 2 || name.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 30 characters'
        });
      }
      
      // Check for suspicious characters
      const suspiciousChars = /[<>{}]/;
      if (suspiciousChars.test(name)) {
        return res.status(400).json({
          success: false,
          message: 'Name contains invalid characters'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Input validation error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input data'
    });
  }
};

// Prevent mass assignment attacks
const preventMassAssignment = (allowedFields) => {
  return (req, res, next) => {
    try {
      if (req.body) {
        const filteredBody = {};
        
        allowedFields.forEach(field => {
          if (req.body.hasOwnProperty(field)) {
            filteredBody[field] = req.body[field];
          }
        });
        
        req.body = filteredBody;
      }
      
      next();
    } catch (error) {
      console.error('❌ Mass assignment prevention error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }
  };
};

// Log database operations for security monitoring
const logDbOperation = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the operation
    console.log(`🔍 DB Operation: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      responseSize: data ? data.length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  sanitizeQuery,
  validateObjectId,
  dbOperationLimiter,
  validateInput,
  preventMassAssignment,
  logDbOperation
}; 