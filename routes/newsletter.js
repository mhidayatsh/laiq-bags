const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { sendNewsletterEmail } = require('../utils/emailService');

// Subscribe to newsletter (public)
router.post('/subscribe', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    
    // Check if already subscribed
    const existingSubscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        // Resubscribe
        await existingSubscriber.resubscribe();
        return res.status(200).json({
          success: true,
          message: 'Welcome back! You have been resubscribed to our newsletter.'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed to our newsletter.'
        });
      }
    }

    // Create new subscriber
    const subscriber = await Newsletter.create({
      email: email.toLowerCase(),
      source: 'website',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer')
      }
    });

    console.log('📧 New newsletter subscriber:', email);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    });
  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error subscribing to newsletter'
    });
  }
});

// Unsubscribe from newsletter (public)
router.post('/unsubscribe', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    
    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our subscriber list.'
      });
    }

    await subscriber.unsubscribe();
    
    console.log('📧 Newsletter unsubscribed:', email);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter.'
    });
  } catch (error) {
    console.error('❌ Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unsubscribing from newsletter'
    });
  }
});

// Get all subscribers (admin only)
router.get('/admin/subscribers', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Newsletter.countDocuments(query);

    res.status(200).json({
      success: true,
      subscribers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('❌ Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscribers'
    });
  }
});

// Get newsletter stats (admin only)
router.get('/admin/stats', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await Newsletter.getStats();
    
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ status: 'active' });
    const recentSubscribers = await Newsletter.countDocuments({
      subscribedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const unsubscribedCount = await Newsletter.countDocuments({ status: 'unsubscribed' });

    res.status(200).json({
      success: true,
      stats: {
        total: totalSubscribers,
        active: activeSubscribers,
        recent: recentSubscribers,
        unsubscribed: unsubscribedCount,
        breakdown: stats
      }
    });
  } catch (error) {
    console.error('❌ Get newsletter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching newsletter stats'
    });
  }
});

// Send newsletter (admin only)
router.post('/admin/send', isAuthenticatedUser, authorizeRoles('admin'), [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { subject, content, tags } = req.body;

    // Get active subscribers
    const subscribers = await Newsletter.getActiveSubscribers();
    
    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active subscribers found'
      });
    }

    console.log(`📧 Sending newsletter to ${subscribers.length} subscribers`);

    // Send emails to all subscribers
    const newsletterData = { subject, content, tags };
    let successCount = 0;
    let failureCount = 0;

    for (const subscriber of subscribers) {
      try {
        const emailResult = await sendNewsletterEmail(subscriber.email, newsletterData);
        
        if (emailResult.success) {
          // Mark email as sent in database
          await subscriber.markEmailSent();
          successCount++;
          console.log(`✅ Newsletter sent to: ${subscriber.email}`);
        } else {
          failureCount++;
          console.log(`❌ Failed to send to: ${subscriber.email} - ${emailResult.message}`);
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Error sending to ${subscriber.email}:`, error.message);
      }
    }

    console.log(`📧 Newsletter sending completed: ${successCount} success, ${failureCount} failed`);

    res.status(200).json({
      success: true,
      message: `Newsletter sent to ${successCount} subscribers${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      sentCount: successCount,
      failedCount: failureCount,
      totalSubscribers: subscribers.length
    });
  } catch (error) {
    console.error('❌ Send newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending newsletter'
    });
  }
});

// Delete subscriber (admin only)
router.delete('/admin/subscribers/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    console.log('📧 Subscriber deleted:', subscriber.email);

    res.status(200).json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete subscriber error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subscriber'
    });
  }
});

// Update subscriber status (admin only)
router.put('/admin/subscribers/:id/status', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'unsubscribed', 'bounced'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const subscriber = await Newsletter.findById(req.params.id);
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    subscriber.status = status;
    if (status === 'unsubscribed') {
      subscriber.unsubscribedAt = Date.now();
    } else {
      subscriber.unsubscribedAt = null;
    }

    await subscriber.save();

    console.log('📧 Subscriber status updated:', subscriber.email, '->', status);

    res.status(200).json({
      success: true,
      message: 'Subscriber status updated successfully',
      subscriber
    });
  } catch (error) {
    console.error('❌ Update subscriber status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscriber status'
    });
  }
});

module.exports = router; 