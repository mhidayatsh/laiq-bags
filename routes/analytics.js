const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const UAParser = require('ua-parser-js');
const analyticsConfig = require('../config/analytics');

// Check if analytics is enabled
function isAnalyticsEnabled() {
    return analyticsConfig.enabled;
}

// Track page view
router.post('/track/pageview', async (req, res) => {
  try {
    // Check if analytics is enabled
    if (!isAnalyticsEnabled()) {
      console.log('📊 Analytics disabled, skipping page view tracking');
      return res.status(200).json({ success: true, message: 'Analytics disabled' });
    }
    
    console.log('📊 Tracking page view:', req.body);
    const { page, sessionId, userId, duration, referrer } = req.body;
    
    // Basic validation
    if (!page) {
      return res.status(400).json({ success: false, message: 'Page is required' });
    }

    const pageViewData = {
      page,
      timestamp: new Date(),
      userAgent: req.get('User-Agent') || '',
      ipAddress: req.ip || '',
      referrer: referrer || req.get('Referrer') || '',
      sessionId: sessionId || '',
      userId: userId || null,
      duration: duration || 0,
      isNewSession: !sessionId
    };

    console.log('📊 Page view data:', pageViewData);

    // Get or create analytics document
    let analytics = await Analytics.findOne();
    if (!analytics) {
      console.log('📊 Creating new analytics document');
      analytics = new Analytics({
        pageViews: [],
        sessions: [],
        dailyStats: [],
        realTime: {
          activeUsers: 0,
          activeSessions: [],
          lastUpdated: new Date()
        },
        conversions: [],
        userBehavior: []
      });
    }

    console.log('📊 Adding page view to analytics');
    analytics.pageViews.push(pageViewData);

    console.log('📊 Saving analytics document');
    await analytics.save();

    console.log('✅ Page view tracked successfully');
    res.status(200).json({ success: true, message: 'Page view tracked' });
  } catch (error) {
    console.error('❌ Error tracking page view:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Error tracking page view' });
  }
});

// Track user behavior
router.post('/track/behavior', async (req, res) => {
  try {
    // Check if analytics is enabled
    if (!isAnalyticsEnabled()) {
      console.log('📊 Analytics disabled, skipping behavior tracking');
      return res.status(200).json({ success: true, message: 'Analytics disabled' });
    }
    
    console.log('📊 Tracking user behavior:', req.body);
    const { action, page, element, sessionId, userId, data } = req.body;

    // Basic validation
    if (!action) {
      return res.status(400).json({ success: false, message: 'Action is required' });
    }

    // Validate action against enum values
    const validActions = ['page_view', 'click', 'scroll', 'form_submit', 'search', 'add_to_cart', 'remove_from_cart', 'wishlist_add', 'wishlist_remove'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const behaviorData = {
      userId: userId || null,
      sessionId: sessionId || '',
      timestamp: new Date(),
      action,
      page: page || '',
      element: element || '',
      data: data || {}
    };

    console.log('📊 Behavior data:', behaviorData);

    let analytics = await Analytics.findOne();
    if (!analytics) {
      console.log('📊 Creating new analytics document for behavior');
      analytics = new Analytics({
        pageViews: [],
        sessions: [],
        dailyStats: [],
        realTime: {
          activeUsers: 0,
          activeSessions: [],
          lastUpdated: new Date()
        },
        conversions: [],
        userBehavior: []
      });
    }

    console.log('📊 Adding user behavior to analytics');
    analytics.userBehavior.push(behaviorData);
    
    console.log('📊 Saving analytics document');
    await analytics.save();

    console.log('✅ Behavior tracked successfully');
    res.status(200).json({ success: true, message: 'Behavior tracked' });
  } catch (error) {
    console.error('❌ Error tracking behavior:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Error tracking behavior' });
  }
});

// Track conversion
router.post('/track/conversion', async (req, res) => {
  try {
    // Check if analytics is enabled
    if (!isAnalyticsEnabled()) {
      console.log('📊 Analytics disabled, skipping conversion tracking');
      return res.status(200).json({ success: true, message: 'Analytics disabled' });
    }
    
    const { type, userId, sessionId, value, details } = req.body;

    const conversionData = {
      type,
      userId: userId || null,
      sessionId,
      timestamp: new Date(),
      value: value || 0,
      details
    };

    let analytics = await Analytics.findOne();
    if (!analytics) {
      analytics = new Analytics();
    }

    await analytics.addConversion(conversionData);
    await analytics.save();

    res.status(200).json({ success: true, message: 'Conversion tracked' });
  } catch (error) {
    console.error('❌ Error tracking conversion:', error);
    res.status(500).json({ success: false, message: 'Error tracking conversion' });
  }
});

// Get daily analytics (admin only)
router.get('/admin/daily', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: {
          totalVisitors: 0,
          uniqueVisitors: 0,
          totalPageViews: 0,
          totalSessions: 0,
          averageSessionDuration: 0,
          bounceRate: 0,
          topPages: [],
          topReferrers: [],
          deviceTypes: { desktop: 0, mobile: 0, tablet: 0 },
          browsers: [],
          countries: []
        }
      });
    }

    const dailyStats = analytics.dailyStats.find(stat => 
      stat.date.toDateString() === targetDate.toDateString()
    );

    if (!dailyStats) {
      return res.status(200).json({
        success: true,
        data: {
          totalVisitors: 0,
          uniqueVisitors: 0,
          totalPageViews: 0,
          totalSessions: 0,
          averageSessionDuration: 0,
          bounceRate: 0,
          topPages: [],
          topReferrers: [],
          deviceTypes: { desktop: 0, mobile: 0, tablet: 0 },
          browsers: [],
          countries: []
        }
      });
    }

    res.status(200).json({
      success: true,
      data: dailyStats
    });
  } catch (error) {
    console.error('❌ Error getting daily analytics:', error);
    res.status(500).json({ success: false, message: 'Error getting analytics' });
  }
});

// Get weekly analytics (admin only)
router.get('/admin/weekly', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { startDate } = req.query;
    const targetStartDate = startDate ? new Date(startDate) : new Date();

    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const endDate = new Date(targetStartDate);
    endDate.setDate(endDate.getDate() + 7);

    const weeklyStats = analytics.dailyStats.filter(stat => 
      stat.date >= targetStartDate && stat.date < endDate
    );

    res.status(200).json({
      success: true,
      data: weeklyStats
    });
  } catch (error) {
    console.error('❌ Error getting weekly analytics:', error);
    res.status(500).json({ success: false, message: 'Error getting analytics' });
  }
});

// Get real-time analytics (admin only)
router.get('/admin/realtime', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: {
          activeUsers: 0,
          activeSessions: [],
          lastUpdated: new Date()
        }
      });
    }

    // Clean up old sessions (inactive for more than 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    analytics.realTime.activeSessions = analytics.realTime.activeSessions.filter(
      session => session.lastActivity > thirtyMinutesAgo
    );
    analytics.realTime.activeUsers = analytics.realTime.activeSessions.length;
    analytics.realTime.lastUpdated = new Date();

    await analytics.save();

    res.status(200).json({
      success: true,
      data: analytics.realTime
    });
  } catch (error) {
    console.error('❌ Error getting real-time analytics:', error);
    res.status(500).json({ success: false, message: 'Error getting analytics' });
  }
});

// Get top pages (admin only)
router.get('/admin/top-pages', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const recentPageViews = analytics.pageViews.filter(
      view => view.timestamp >= startDate
    );

    const pageStats = {};
    recentPageViews.forEach(view => {
      if (pageStats[view.page]) {
        pageStats[view.page]++;
      } else {
        pageStats[view.page] = 1;
      }
    });

    const topPages = Object.entries(pageStats)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: topPages
    });
  } catch (error) {
    console.error('❌ Error getting top pages:', error);
    res.status(500).json({ success: false, message: 'Error getting analytics' });
  }
});

// Get user journey (admin only)
router.get('/admin/user-journey/:userId', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const userBehavior = analytics.userBehavior.filter(
      behavior => behavior.userId && behavior.userId.toString() === userId
    ).sort((a, b) => a.timestamp - b.timestamp);

    res.status(200).json({
      success: true,
      data: userBehavior
    });
  } catch (error) {
    console.error('❌ Error getting user journey:', error);
    res.status(500).json({ success: false, message: 'Error getting user journey' });
  }
});

// Get conversion analytics (admin only)
router.get('/admin/conversions', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const recentConversions = analytics.conversions.filter(
      conversion => conversion.timestamp >= startDate
    );

    const conversionStats = {};
    recentConversions.forEach(conversion => {
      if (conversionStats[conversion.type]) {
        conversionStats[conversion.type]++;
      } else {
        conversionStats[conversion.type] = 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        conversions: recentConversions,
        stats: conversionStats,
        total: recentConversions.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting conversions:', error);
    res.status(500).json({ success: false, message: 'Error getting conversions' });
  }
});

// Get overall analytics summary (admin only)
router.get('/admin/summary', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.status(200).json({
        success: true,
        data: {
          totalVisitors: 0,
          totalPageViews: 0,
          totalSessions: 0,
          averageSessionDuration: 0,
          bounceRate: 0,
          topPages: [],
          recentActivity: []
        }
      });
    }

    const recentPageViews = analytics.pageViews?.filter(
      view => view.timestamp >= startDate
    ) || [];

    const recentSessions = analytics.sessions?.filter(
      session => session.startTime >= startDate
    ) || [];

    const uniqueVisitors = new Set(
      recentPageViews.map(view => view.ipAddress)
    ).size;

    const totalPageViews = recentPageViews.length;
    const totalSessions = recentSessions.length;

    const averageSessionDuration = recentSessions.length > 0
      ? recentSessions.reduce((sum, session) => sum + (session.totalDuration || 0), 0) / recentSessions.length
      : 0;

    // Calculate bounce rate (sessions with only one page view)
    const bounceSessions = recentSessions.filter(session => 
      session.pages && session.pages.length <= 1
    ).length;
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

    // Get top pages
    const pageStats = {};
    recentPageViews.forEach(view => {
      if (pageStats[view.page]) {
        pageStats[view.page]++;
      } else {
        pageStats[view.page] = 1;
      }
    });

    const topPages = Object.entries(pageStats)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Get recent activity
    const recentActivity = analytics.userBehavior?.filter(behavior => behavior.timestamp >= startDate)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10) || [];

    res.status(200).json({
      success: true,
      data: {
        totalVisitors: uniqueVisitors,
        totalPageViews,
        totalSessions,
        averageSessionDuration: Math.round(averageSessionDuration),
        bounceRate: Math.round(bounceRate * 100) / 100,
        topPages,
        recentActivity
      }
    });
  } catch (error) {
    console.error('❌ Error getting analytics summary:', error);
    res.status(500).json({ success: false, message: 'Error getting analytics' });
  }
});

// Get analytics configuration
router.get('/config', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      enabled: analyticsConfig.enabled,
      tracking: analyticsConfig.tracking,
      rateLimiting: analyticsConfig.rateLimiting
    });
  } catch (error) {
    console.error('❌ Error getting analytics config:', error);
    res.status(500).json({ success: false, message: 'Error getting config' });
  }
});

// Database health check
router.get('/db-health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    
    // Connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const stateNames = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const isHealthy = connectionState === 1;
    const response = {
      success: true,
      database: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        connectionState: connectionState,
        connectionStateName: stateNames[connectionState] || 'unknown',
        isConnected: isHealthy,
        timestamp: new Date().toISOString()
      }
    };
    
    if (isHealthy) {
      // Test a simple query to verify database responsiveness
      const startTime = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        const pingTime = Date.now() - startTime;
        response.database.pingTime = `${pingTime}ms`;
        response.database.message = 'Database is responsive';
      } catch (pingError) {
        response.database.message = 'Database ping failed';
        response.database.pingError = pingError.message;
      }
    } else {
      response.database.message = 'Database connection is not ready';
    }
    
    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check database health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 