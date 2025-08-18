const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../utils/encryption');
const { sendPasswordResetEmail } = require('../utils/emailService');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

// Register user => /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 30 }).withMessage('Name must be between 2 and 30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number')
], async (req, res) => {
  try {
    console.log('📝 Registration attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    console.log('✅ User registered successfully:', email);
    sendToken(user, 201, res);
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle password reuse error
    if (error.name === 'PasswordReuseError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error in registration'
    });
  }
});

// Login user => /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if email and password is entered by user
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please enter email & password'
      });
    }

    // Finding user in database
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Email address not found. Please check your email or register a new account.'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      console.log('🔒 Account locked for:', email);
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        lockUntil: user.lockUntil
      });
    }

    // Check if password is correct or not
    console.log('🔍 Comparing passwords...');
    const isPasswordMatched = await user.comparePassword(password);
    console.log('🔍 Password match result:', isPasswordMatched);

    if (!isPasswordMatched) {
      console.log('❌ Password mismatch for user:', email);
      
      // Increment login attempts
      await user.incLoginAttempts();
      
      // Check if account should be locked
      const updatedUser = await User.findOne({ email });
      if (updatedUser.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed login attempts. Please try again later.',
          lockUntil: updatedUser.lockUntil
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please check your password and try again.',
        remainingAttempts: 5 - (updatedUser.loginAttempts || 0)
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    console.log('✅ Login successful for:', email);
    console.log('🔍 User object type:', typeof user);
    console.log('🔍 User object keys:', Object.keys(user));
    
    // Send token response
    sendToken(user, 200, res);
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login: ' + error.message
    });
  }
});

// Logout user => /api/auth/logout
router.get('/logout', async (req, res) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in logout'
    });
  }
});

// Also support POST logout to match older clients
router.post('/logout', async (req, res) => {
  try {
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in logout'
    });
  }
});

// Get currently logged in user details => /api/auth/me
router.get('/me', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user details'
    });
  }
});

// Update user profile => /api/auth/me/update
router.put('/me/update', isAuthenticatedUser, async (req, res) => {
  try {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Update user password => /api/auth/password/update
router.put('/password/update', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword);

    if (!isMatched) {
      return res.status(400).json({
        success: false,
        message: 'Old password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendToken(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
});

// Forgot password => /api/auth/password/forgot
router.post('/password/forgot', catchAsyncErrors(async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🔐 Password reset requested for:', email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found for password reset:', email);
      return res.status(404).json({
        success: false,
        message: 'Email address not found. Please check your email or register a new account.'
      });
    }

    console.log('✅ User found for password reset:', user.name);

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    console.log('🔑 Generated reset token:', resetToken);

    await user.save({ validateBeforeSave: false });

    // Create reset password url
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password.html?token=${resetToken}`;
    console.log('🔗 Reset URL created:', resetUrl);

    // Send email using new email service
    const emailResult = await sendPasswordResetEmail(email, resetUrl);
    
    if (emailResult.success) {
      console.log('✅ Password reset email sent successfully');
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully. Please check your email.'
      });
    } else {
      console.log('⚠️  Email sending failed, but reset token generated');
      res.status(200).json({
        success: true,
        message: 'Password reset token generated. Please check your email or contact support.',
        resetUrl: resetUrl // Include reset URL in response for development
      });
    }
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in password reset process'
    });
  }
}));

// Reset password => /api/auth/password/reset/:token
router.put('/password/reset/:token', async (req, res) => {
  try {
    console.log('🔐 Password reset attempt with token:', req.params.token);
    console.log('📝 Password provided:', !!req.body.password, 'Confirm password provided:', !!req.body.confirmPassword);

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('🔑 Hashed reset token:', resetPasswordToken);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log('❌ User not found with reset token or token expired');
      console.log('🔍 Searching for token:', resetPasswordToken);
      
      // Debug: Show all users and their reset tokens
      const allUsers = await User.find({});
      console.log('👥 Total users in database:', allUsers.length);
      allUsers.forEach((u, index) => {
        console.log(`👤 User ${index + 1}:`, {
          id: u._id,
          email: u.email,
          hasResetToken: !!u.resetPasswordToken,
          resetToken: u.resetPasswordToken,
          resetExpire: u.resetPasswordExpire,
          tokenMatches: u.resetPasswordToken === resetPasswordToken
        });
      });
      
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Validate new password
    if (!req.body.password || !req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and confirm password'
      });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password do not match'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(req.body.password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
      });
    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log('✅ Password updated successfully for user:', user.email);

    sendToken(user, 200, res);
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in reset password'
    });
  }
});

// Verify email => /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: verificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email verification token is invalid or has been expired'
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in email verification'
    });
  }
});

// Customer registration => /api/auth/customer/register
router.post('/customer/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create customer user (role: user)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'user' // Customer role
    });

    sendToken(user, 201, res);
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration'
    });
  }
});

// Customer login => /api/auth/customer/login
router.post('/customer/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('🔐 Customer login attempt for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if email and password is entered by user
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please enter email & password'
      });
    }

    // Finding user in database
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Email address not found. Please check your email or register a new account.'
      });
    }

    // Check if password is correct
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      console.log('❌ Incorrect password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please check your password and try again.'
      });
    }

    // Check if user is customer (not admin)
    if (user.role !== 'user') {
      console.log('❌ Admin trying to login as customer:', email);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin login required.'
      });
    }

    console.log('✅ Customer login successful for:', email);
    sendToken(user, 200, res);
  } catch (error) {
    console.error('❌ Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login'
    });
  }
});

// Get customer profile => /api/auth/customer/me
router.get('/customer/me', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting profile'
    });
  }
});

// Update customer profile => /api/auth/customer/me/update
router.put('/customer/me/update', isAuthenticatedUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update user data manually to avoid encryption issues
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) {
      // Store phone without encryption for now
      user.phone = req.body.phone;
    }
    if (req.body.address) {
      // Handle address update
      if (typeof req.body.address === 'string') {
        user.address = {
          street: req.body.address,
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        };
      } else if (typeof req.body.address === 'object') {
        user.address = {
          street: req.body.address.street || '',
          city: req.body.address.city || '',
          state: req.body.address.state || '',
          pincode: req.body.address.pincode || '',
          country: req.body.address.country || 'India'
        };
      }
    }

    // Mark address as modified
    user.markModified('address');
    
    // Save without triggering pre-save hooks
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Customer logout => /api/auth/customer/logout
router.get('/customer/logout', async (req, res) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Forgot password (customer)
router.post('/customer/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }
        
        console.log('🔐 Password reset requested for:', email);
        
        const user = await User.findOne({ email, role: 'user' });
        
        if (!user) {
            console.log('❌ User not found for password reset:', email);
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address'
            });
        }
        
        console.log('✅ User found for password reset:', user.name);
        
        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        console.log('🔑 Generated reset token:', resetToken);
        console.log('🔑 User resetPasswordToken before save:', user.resetPasswordToken);
        console.log('⏰ User resetPasswordExpire before save:', user.resetPasswordExpire);
        
        // Update user directly in database using updateOne (same approach as test)
        const updateResult = await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: user.resetPasswordToken,
                    resetPasswordExpire: user.resetPasswordExpire
                }
            }
        );
        
        console.log('💾 Update result:', updateResult);
        
        // Fetch updated user to confirm
        const updatedUser = await User.findById(user._id);
        console.log('🔑 Updated user resetPasswordToken:', updatedUser.resetPasswordToken);
        console.log('⏰ Updated user resetPasswordExpire:', updatedUser.resetPasswordExpire);
        
        // Verify the token was saved correctly
        const verificationUser = await User.findOne({ _id: user._id }).lean();
        console.log('🔍 Verification - User has reset token:', !!verificationUser.resetPasswordToken);
        console.log('🔍 Verification - Reset token matches:', verificationUser.resetPasswordToken === user.resetPasswordToken);
        
        // Create reset URL
        const resetUrl = process.env.NODE_ENV === 'development' 
            ? `http://localhost:3001/reset-password.html?token=${resetToken}`
            : `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
        
        console.log('🔗 Reset URL created:', resetUrl);
        
        // Email message
        const message = `Hello ${user.name},

You requested a password reset for your Laiq Bags account.

Please click on the link below to reset your password:

${resetUrl}

This link will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
Laiq Bags Team

---
This is an automated message. Please do not reply to this email.`;

        // Decide whether email is configured; if not, return resetUrl for development/testing
        const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password_here');

        if (!emailConfigured) {
            console.log('⚙️  Email not configured. Skipping email send but NOT exposing reset URL.');
            return res.status(200).json({
                success: true,
                message: 'Password reset link generated. Please check your email.'
            });
        }

        try {
            // Send email
            await sendEmail({
                email: user.email,
                subject: 'Laiq Bags - Password Reset Request',
                message
            });

            console.log('✅ Password reset email sent successfully');

            res.status(200).json({
                success: true,
                message: 'Password reset link sent to your email'
            });
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);

            // Clear reset token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500).json({
                success: false,
                message: 'Error sending email. Please try again later.'
            });
        }
        
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing forgot password request'
        });
    }
});

// Reset password (customer)
router.put('/customer/reset-password/:token', async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const resetToken = req.params.token;
        
        console.log('🔐 Password reset attempt with token:', resetToken);
        console.log('📝 Password provided:', !!password, 'Confirm password provided:', !!confirmPassword);
        
        if (!password || !confirmPassword) {
            console.log('❌ Missing password or confirm password');
            return res.status(400).json({
                success: false,
                message: 'Please provide password and confirm password'
            });
        }
        
        if (password !== confirmPassword) {
            console.log('❌ Passwords do not match');
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        
        // Enforce strong password policy to match schema
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            console.log('❌ Password does not meet complexity requirements');
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
            });
        }
        
        // Get user by reset token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        console.log('🔑 Hashed reset token:', resetPasswordToken);
        
        // First, let's check if any user has this token
        const allUsers = await User.find({}).lean();
        console.log('👥 Total users in database:', allUsers.length);
        
        allUsers.forEach((user, index) => {
            console.log(`👤 User ${index + 1}:`, {
                id: user._id,
                email: user.email,
                hasResetToken: !!user.resetPasswordToken,
                resetToken: user.resetPasswordToken,
                resetExpire: user.resetPasswordExpire,
                tokenMatches: user.resetPasswordToken === resetPasswordToken
            });
        });
        
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        
        if (!user) {
            console.log('❌ User not found with reset token or token expired');
            console.log('🔍 Searching for token:', resetPasswordToken);
            
            // Check if token exists but is expired
            const expiredUser = await User.findOne({ resetPasswordToken });
            if (expiredUser) {
                console.log('⚠️ Token found but expired for user:', expiredUser.email);
                console.log('⏰ Token expire time:', expiredUser.resetPasswordExpire);
                console.log('⏰ Current time:', Date.now());
                return res.status(400).json({
                    success: false,
                    message: 'Password reset token has expired. Please request a new one.'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Password reset token is invalid or has expired'
            });
        }
        
        console.log('✅ User found for password reset:', user.email);
        
        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        
        console.log('✅ Password updated successfully for user:', user.email);
        
        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password: ' + error.message
        });
    }
});

// Recover email by phone number (customer)
router.post('/customer/recover-email', async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide phone number'
            });
        }
        
        const user = await User.findOne({ phone, role: 'user' });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this phone number'
            });
        }
        
        // Return masked email for security
        const email = user.email;
        const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (match, p1, p2) => {
            return p1 + '*'.repeat(p2.length);
        });
        
        res.status(200).json({
            success: true,
            message: 'Email found',
            maskedEmail: maskedEmail,
            fullEmail: email // Remove this in production for security
        });
        
    } catch (error) {
        console.error('Recover email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recovering email'
        });
    }
});

// Verify account by phone and email (customer)
router.post('/customer/verify-account', async (req, res) => {
    try {
        const { phone, email } = req.body;
        
        if (!phone || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both phone number and email'
            });
        }
        
        const user = await User.findOne({ phone, email, role: 'user' });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with these details'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Account verified successfully',
            userId: user._id
        });
        
    } catch (error) {
        console.error('Verify account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying account'
        });
    }
});

// Admin forgot password => /api/auth/admin/forgot-password
router.post('/admin/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    console.log('🔐 Admin password reset requested for:', req.body.email);
    
    const user = await User.findOne({ 
      email: req.body.email,
      role: 'admin'
    });
    
    if (!user) {
      console.log('❌ Admin not found for password reset:', req.body.email);
      return res.status(404).json({
        success: false,
        message: 'Admin not found with this email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/admin-reset-password.html?token=${resetToken}`;
    console.log('🔗 Reset URL created:', resetUrl);

    const message = `Your admin password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

    // If email is not configured or in development, return resetUrl for testing
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password_here');
    if (!emailConfigured) {
      console.log('⚙️  Email not configured; not exposing resetUrl in response.');
      return res.status(200).json({
        success: true,
        message: 'Password reset link generated. Please check your email.'
      });
    }

    try {
      await sendEmail({
        email: user.email,
        subject: 'Laiq Bags Admin Password Recovery',
        message
      });

      res.status(200).json({
        success: true,
        message: `Password reset email sent to: ${user.email}`
      });
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
  } catch (error) {
    console.error('❌ Admin forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in admin forgot password'
    });
  }
});

// Admin reset password => /api/auth/admin/reset-password/:token
router.put('/admin/reset-password/:token', async (req, res) => {
  try {
    console.log('🔐 Admin password reset attempt with token:', req.params.token);
    console.log('📝 Password provided:', !!req.body.password, 'Confirm password provided:', !!req.body.confirmPassword);

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('🔑 Hashed reset token:', resetPasswordToken);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
      role: 'admin'
    });

    if (!user) {
      console.log('❌ Admin not found with reset token or token expired');
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Validate new password
    if (!req.body.password || !req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and confirm password'
      });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password do not match'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(req.body.password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
      });
    }

    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log('✅ Admin password updated successfully for user:', user.email);

    sendToken(user, 200, res);
  } catch (error) {
    console.error('❌ Admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in admin reset password'
    });
  }
});

// Update admin profile => /api/auth/profile
router.put('/profile', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { name, email, phone, address, dateOfBirth, city, state, pincode } = req.body;
        
        console.log('👤 Admin profile update requested for:', req.user.email);
        
        // Check if email is being changed and if it's already taken
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingUser) {
                // Special handling for admin - allow admin to take over customer email
                if (req.user.role === 'admin' && existingUser.role === 'user') {
                    console.log(`🔐 Admin ${req.user.email} taking over customer email: ${email}`);
                    // Update the customer's email to avoid conflict
                    const customerNewEmail = `old_${Date.now()}_${existingUser.email}`;
                    await User.findByIdAndUpdate(existingUser._id, { email: customerNewEmail });
                    console.log(`📧 Customer email updated to: ${customerNewEmail}`);
                } else if (existingUser.role === 'admin') {
                    return res.status(400).json({
                        success: false,
                        message: `Email '${email}' is already taken by another admin`
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Email '${email}' is already taken by another user (${existingUser.role === 'admin' ? 'Admin' : 'Customer'})`
                    });
                }
            }
        }
        
        // Update user profile
        const updatedFields = {};
        if (name) updatedFields.name = name;
        if (email) updatedFields.email = email;
        if (phone) updatedFields.phone = phone;
        if (address) updatedFields.address = address;
        if (dateOfBirth) updatedFields.dateOfBirth = dateOfBirth;
        if (city) updatedFields.city = city;
        if (state) updatedFields.state = state;
        if (pincode) updatedFields.pincode = pincode;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updatedFields,
            { new: true, runValidators: false }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log('✅ Admin profile updated successfully for:', user.email);
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                dateOfBirth: user.dateOfBirth,
                city: user.city,
                state: user.state,
                pincode: user.pincode,
                role: user.role,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        console.error('❌ Admin profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// Change admin password => /api/auth/change-password
router.put('/change-password', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        console.log('🔐 Admin password change requested for:', req.user.email);
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password, new password, and confirm password'
            });
        }
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        
        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check current password
        const isPasswordMatched = await user.comparePassword(currentPassword);
        if (!isPasswordMatched) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect. Please enter your current login password correctly.'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        console.log('✅ Admin password changed successfully for:', user.email);
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('❌ Admin password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
});

// Customer Address Management Routes

// Get customer addresses => /api/auth/customer/addresses
router.get('/customer/addresses', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      addresses: user.savedAddresses || []
    });
  } catch (error) {
    console.error('Get customer addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting addresses'
    });
  }
});

// Add customer address => /api/auth/customer/addresses
router.post('/customer/addresses', isAuthenticatedUser, async (req, res) => {
  try {
    const { street, city, state, pincode, country = 'India', isDefault = false } = req.body;
    
    // Validate required fields
    if (!street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required address fields'
      });
    }
    
    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit pincode'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Create new address
    const newAddress = {
      street,
      city,
      state,
      pincode,
      country,
      isDefault,
      createdAt: new Date()
    };
    
    // If this is the first address or isDefault is true, make it default
    if (!user.savedAddresses || user.savedAddresses.length === 0 || isDefault) {
      // Remove default from other addresses
      if (user.savedAddresses) {
        user.savedAddresses.forEach(addr => addr.isDefault = false);
      }
      newAddress.isDefault = true;
    }
    
    // Add address to user
    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }
    user.savedAddresses.push(newAddress);
    
    await user.save();
    
    // Get the added address (last one in array)
    const addedAddress = user.savedAddresses[user.savedAddresses.length - 1];
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address: addedAddress
    });
  } catch (error) {
    console.error('Add customer address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding address'
    });
  }
});

// Update customer address => /api/auth/customer/addresses/:id
router.put('/customer/addresses/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const { street, city, state, pincode, country = 'India', isDefault = false } = req.body;
    const addressId = req.params.id;
    
    // Validate required fields
    if (!street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required address fields'
      });
    }
    
    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit pincode'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find address index
    const addressIndex = user.savedAddresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Update address
    user.savedAddresses[addressIndex] = {
      ...user.savedAddresses[addressIndex],
      street,
      city,
      state,
      pincode,
      country,
      isDefault
    };
    
    // If making this address default, remove default from others
    if (isDefault) {
      user.savedAddresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: user.savedAddresses[addressIndex]
    });
  } catch (error) {
    console.error('Update customer address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating address'
    });
  }
});

// Delete customer address => /api/auth/customer/addresses/:id
router.delete('/customer/addresses/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const addressId = req.params.id;
    
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Find address index
    const addressIndex = user.savedAddresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Remove address
    user.savedAddresses.splice(addressIndex, 1);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting address'
    });
  }
});

// Get public settings => /api/settings
router.get('/settings', async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    
    res.status(200).json({
      success: true,
      settings: {
        websiteName: settings.websiteName,
        contactEmail: settings.contactEmail,
        instagramHandle: settings.instagramHandle,
        whatsappNumber: settings.whatsappNumber,
        address: settings.address
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

module.exports = router; 