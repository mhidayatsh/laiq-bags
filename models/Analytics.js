const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Page View Analytics
  pageViews: [{
    page: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userAgent: String,
    ipAddress: String,
    referrer: String,
    sessionId: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    duration: Number, // Time spent on page in seconds
    isNewSession: {
      type: Boolean,
      default: true
    }
  }],

  // User Sessions
  sessions: [{
    sessionId: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    ipAddress: String,
    userAgent: String,
    pages: [{
      page: String,
      timestamp: Date,
      duration: Number
    }],
    totalDuration: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Daily Statistics
  dailyStats: [{
    date: {
      type: Date,
      required: true
    },
    totalVisitors: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    totalPageViews: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    topPages: [{
      page: String,
      views: Number
    }],
    topReferrers: [{
      referrer: String,
      count: Number
    }],
    deviceTypes: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    browsers: [{
      browser: String,
      count: Number
    }],
    countries: [{
      country: String,
      count: Number
    }]
  }],

  // Real-time Analytics
  realTime: {
    activeUsers: {
      type: Number,
      default: 0
    },
    activeSessions: [{
      sessionId: String,
      userId: mongoose.Schema.Types.ObjectId,
      lastActivity: Date,
      currentPage: String
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Conversion Tracking
  conversions: [{
    type: {
      type: String,
      enum: ['purchase', 'signup', 'newsletter', 'contact', 'download'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    sessionId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    value: Number, // For purchases
    details: mongoose.Schema.Types.Mixed
  }],

  // User Behavior
  userBehavior: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sessionId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['page_view', 'click', 'scroll', 'form_submit', 'search', 'add_to_cart', 'remove_from_cart', 'wishlist_add', 'wishlist_remove'],
      required: true
    },
    page: String,
    element: String, // Element clicked/interacted with
    data: mongoose.Schema.Types.Mixed // Additional data
  }]
}, {
  timestamps: true
});

// Indexes for better performance
analyticsSchema.index({ 'pageViews.timestamp': -1 });
analyticsSchema.index({ 'sessions.startTime': -1 });
analyticsSchema.index({ 'dailyStats.date': -1 });
analyticsSchema.index({ 'userBehavior.timestamp': -1 });
analyticsSchema.index({ 'conversions.timestamp': -1 });

// Methods for analytics
analyticsSchema.methods.addPageView = function(pageViewData) {
  this.pageViews.push(pageViewData);
  // Don't return save() since it's awaited in routes
};

analyticsSchema.methods.addSession = function(sessionData) {
  this.sessions.push(sessionData);
  // Don't return save() since it's awaited in routes
};

analyticsSchema.methods.updateDailyStats = function(date, stats) {
  const existingStats = this.dailyStats.find(stat => 
    stat.date.toDateString() === date.toDateString()
  );
  
  if (existingStats) {
    Object.assign(existingStats, stats);
  } else {
    this.dailyStats.push({ date, ...stats });
  }
  
  // Don't return save() since it's awaited in routes
};

analyticsSchema.methods.addConversion = function(conversionData) {
  this.conversions.push(conversionData);
  // Don't return save() since it's awaited in routes
};

analyticsSchema.methods.addUserBehavior = function(behaviorData) {
  this.userBehavior.push(behaviorData);
  // Don't return save() since it's awaited in routes
};

// Static methods
analyticsSchema.statics.getDailyStats = function(date) {
  return this.findOne({
    'dailyStats.date': {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    }
  });
};

analyticsSchema.statics.getWeeklyStats = function(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  
  return this.find({
    'dailyStats.date': {
      $gte: startDate,
      $lt: endDate
    }
  });
};

analyticsSchema.statics.getMonthlyStats = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.find({
    'dailyStats.date': {
      $gte: startDate,
      $lte: endDate
    }
  });
};

analyticsSchema.statics.getTopPages = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        'pageViews.timestamp': { $gte: startDate }
      }
    },
    {
      $unwind: '$pageViews'
    },
    {
      $group: {
        _id: '$pageViews.page',
        views: { $sum: 1 }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: 10
    }
  ]);
};

analyticsSchema.statics.getUserJourney = function(userId) {
  return this.findOne({
    'userBehavior.userId': userId
  }).sort({ 'userBehavior.timestamp': 1 });
};

module.exports = mongoose.model('Analytics', analyticsSchema); 