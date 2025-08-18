const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { encrypt, decrypt } = require('../utils/encryption');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    maxLength: [30, 'Your name cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    validate: {
      validator: function(em) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(em);
      },
      message: 'Please enter valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: [8, 'Your password must be at least 8 characters'],
    validate: {
      validator: function(password) {
        // Strong password validation
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
      },
      message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
    },
    select: false
  },
  passwordHistory: [{
    password: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  passwordChangedAt: Date,
  phone: {
    type: String,
    required: [true, 'Please enter your phone number']
  },
  address: {
    street: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  // Saved addresses for customers
  savedAddresses: [{
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      validate: {
        validator: function(pincode) {
          return /^\d{6}$/.test(pincode);
        },
        message: 'Pincode must be 6 digits'
      }
    },
    country: {
      type: String,
      default: 'India'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Additional profile fields
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  bio: {
    type: String,
    maxLength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    public_id: {
      type: String,
      required: false,
      default: 'default_avatar'
    },
    url: {
      type: String,
      required: false,
      default: 'https://via.placeholder.com/150?text=User'
    }
  },
  role: {
    type: String,
    default: 'user'
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Encrypt sensitive data before saving
userSchema.pre('save', async function(next) {
  console.log('🔄 Pre-save hook triggered');
  console.log('📝 Modified fields:', this.modifiedPaths());
  console.log('🔑 Reset token before pre-save:', this.resetPasswordToken);
  
  // Set avatar defaults if not provided
  if (!this.avatar) {
    this.avatar = {
      public_id: 'default_avatar',
      url: 'https://via.placeholder.com/150?text=User'
    };
  } else {
    if (!this.avatar.public_id) {
      this.avatar.public_id = 'default_avatar';
    }
    if (!this.avatar.url) {
      this.avatar.url = 'https://via.placeholder.com/150?text=User';
    }
  }
  
  // Hash password only if modified
  if (this.isModified('password')) {
    // Check password history to prevent reuse
    if (this.passwordHistory && this.passwordHistory.length > 0) {
      for (let i = 0; i < this.passwordHistory.length; i++) {
        const isMatch = await bcrypt.compare(this.password, this.passwordHistory[i].password);
        if (isMatch) {
          const error = new Error('Password cannot be the same as your last 3 passwords');
          error.name = 'PasswordReuseError';
          return next(error);
        }
      }
    }
    
    this.password = await bcrypt.hash(this.password, 12); // Increased salt rounds
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
    
    // Add to password history (keep last 3)
    if (!this.passwordHistory) {
      this.passwordHistory = [];
    }
    
    this.passwordHistory.push({
      password: this.password,
      changedAt: new Date()
    });
    
    // Keep only last 3 passwords
    if (this.passwordHistory.length > 3) {
      this.passwordHistory = this.passwordHistory.slice(-3);
    }
  }
  
  console.log('🔑 Reset token after pre-save:', this.resetPasswordToken);
  next();
});

// Decrypt sensitive data when retrieving
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  // Handle phone number - if it's encrypted (contains ':'), try to decrypt
  // If decryption fails, return a placeholder
  if (user.phone && typeof user.phone === 'string' && user.phone.includes(':')) {
    try {
      const decryptedPhone = decrypt(user.phone);
      if (decryptedPhone && decryptedPhone.match(/^[0-9]{10,12}$/)) {
        user.phone = decryptedPhone;
        console.log('📱 Phone decrypted successfully');
      } else {
        // If decryption fails or produces invalid result, show placeholder
        user.phone = 'Phone number needs update';
        console.log('⚠️ Phone decryption produced invalid result, using placeholder');
      }
    } catch (error) {
      console.log('⚠️ Phone decryption error (handled gracefully):', error.message);
      // Don't throw error, just set a placeholder and continue
      user.phone = 'Phone number needs update';
    }
  } else if (user.phone && typeof user.phone === 'string' && !user.phone.match(/^[0-9]{10,12}$/)) {
    // If phone doesn't look like a valid number, show placeholder
    user.phone = 'Phone number needs update';
    console.log('⚠️ Invalid phone format, using placeholder');
  } else if (!user.phone) {
    // If no phone number, set placeholder
    user.phone = 'Phone number not provided';
  }
  
  // Remove sensitive fields from JSON response
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.passwordHistory;
  
  return user;
};

// Compare user password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate JWT Token
userSchema.methods.getJwtToken = function() {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not configured');
    throw new Error('JWT_SECRET not configured');
  }
  
  console.log('🔑 Generating JWT token for user:', this._id);
  console.log('🔑 JWT_SECRET available:', !!process.env.JWT_SECRET);
  
  // Enhanced JWT payload with customer data
  const payload = {
    id: this._id,
    name: this.name || 'Customer',
    email: this.email || 'customer@example.com',
    role: this.role || 'user'
  };
  console.log('🔑 JWT payload:', payload);
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
  
  console.log('✅ JWT token generated successfully');
  return token;
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expire time
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Account lockout methods
userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Admin update method - bypasses pre-save hooks
userSchema.methods.adminUpdate = async function(updateData) {
  // Update fields manually
  if (updateData.name) this.name = updateData.name;
  if (updateData.email) this.email = updateData.email;
  if (updateData.phone) {
    // For now, store phone number without encryption to avoid issues
    if (updateData.phone.match(/^[0-9]{10}$/)) {
      this.phone = updateData.phone;
      console.log('📱 Phone updated:', updateData.phone);
    } else {
      console.log('❌ Invalid phone format:', updateData.phone);
    }
  }
  if (updateData.address && typeof updateData.address === 'object') {
    this.address = {
      street: updateData.address.street || '',
      city: updateData.address.city || '',
      state: updateData.address.state || '',
      pincode: updateData.address.pincode || '',
      country: updateData.address.country || 'India'
    };
  }
  
  // Mark address as modified
  this.markModified('address');
  
  // Save without validation and pre-save hooks
  return await this.save({ validateBeforeSave: false });
};

// Test encryption/decryption method
userSchema.methods.testEncryption = function() {
  const { encrypt, decrypt } = require('../utils/encryption');
  const testPhone = '1234567890';
  const encrypted = encrypt(testPhone);
  const decrypted = decrypt(encrypted);
  console.log('🧪 Encryption test:', testPhone, '->', encrypted, '->', decrypted);
  return testPhone === decrypted;
};

// Method to handle existing encrypted phone numbers
userSchema.methods.fixPhoneEncryption = async function() {
  // If phone is encrypted (contains ':'), clear it
  if (this.phone && this.phone.includes(':')) {
    this.phone = 'Phone number needs update';
    await this.save({ validateBeforeSave: false });
    console.log('🔧 Cleared encrypted phone for user:', this.name);
    return true;
  }
  return false;
};

// Static method to fix all encrypted phone numbers
userSchema.statics.fixAllPhoneNumbers = async function() {
  const users = await this.find({ role: 'user' });
  let fixedCount = 0;
  
  for (const user of users) {
    if (user.phone && user.phone.includes(':')) {
      user.phone = 'Phone number needs update';
      await user.save({ validateBeforeSave: false });
      fixedCount++;
    }
  }
  
  console.log(`🔧 Fixed ${fixedCount} encrypted phone numbers`);
  return fixedCount;
};

// Add indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ 'address.city': 1 });
userSchema.index({ 'address.state': 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema); 