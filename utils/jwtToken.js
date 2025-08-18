const jwt = require('jsonwebtoken');

const sendToken = (user, statusCode, res) => {
  try {
    console.log('🔑 Starting JWT token generation...');
    console.log('👤 User object type:', typeof user);
    console.log('👤 User object keys:', Object.keys(user || {}));
    
    // Check if user object exists
    if (!user) {
      console.error('❌ User object is null or undefined');
      throw new Error('User object is required');
    }

    // Check if user has _id
    if (!user._id) {
      console.error('❌ User object missing _id');
      throw new Error('User object missing _id');
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not configured');
      throw new Error('JWT_SECRET not configured');
    }

    // Try to use user.getJwtToken method if available, otherwise generate directly
    let token;
    if (typeof user.getJwtToken === 'function') {
      console.log('🔑 Using user.getJwtToken method');
      token = user.getJwtToken();
    } else {
      console.log('🔑 Generating JWT token directly');
      // Enhanced JWT payload with customer data
      const payload = {
        id: user._id,
        name: user.name || 'Customer',
        email: user.email || 'customer@example.com',
        role: user.role || 'user'
      };
      console.log('🔑 JWT payload:', payload);
      token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        {
          expiresIn: process.env.JWT_EXPIRE || '7d'
        }
      );
    }

    console.log('✅ JWT token generated successfully');

    // Create response object
    const responseData = {
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    };

    // Add phone if available (handle encryption error)
    if (user.phone) {
      try {
        responseData.user.phone = user.phone;
      } catch (phoneError) {
        console.log('⚠️ Phone decryption failed, skipping phone in response');
      }
    }

    console.log('📤 Sending response with token');
    res.status(statusCode).json(responseData);

  } catch (error) {
    console.error('❌ JWT token generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed: ' + error.message
    });
  }
};

module.exports = sendToken; 