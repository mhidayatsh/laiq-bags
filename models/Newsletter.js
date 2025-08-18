const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced'],
    default: 'active'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },
  lastEmailSent: {
    type: Date,
    default: null
  },
  emailCount: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    enum: ['website', 'admin', 'api'],
    default: 'website'
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Index for better performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ subscribedAt: -1 });

// Method to unsubscribe
newsletterSchema.methods.unsubscribe = function() {
  this.status = 'unsubscribed';
  this.unsubscribedAt = Date.now();
  return this.save();
};

// Method to resubscribe
newsletterSchema.methods.resubscribe = function() {
  this.status = 'active';
  this.unsubscribedAt = null;
  return this.save();
};

// Method to mark email as sent
newsletterSchema.methods.markEmailSent = function() {
  this.lastEmailSent = Date.now();
  this.emailCount += 1;
  return this.save();
};

// Static method to get active subscribers
newsletterSchema.statics.getActiveSubscribers = function() {
  return this.find({ status: 'active' }).sort({ subscribedAt: -1 });
};

// Static method to get subscriber stats
newsletterSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Newsletter', newsletterSchema); 