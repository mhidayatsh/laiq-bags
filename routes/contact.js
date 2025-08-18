const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Settings = require('../models/Settings');
const sendEmail = require('../utils/sendEmail');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { validateInput } = require('../middleware/databaseSecurity');
const { generalLimiter } = require('../middleware/rateLimiter');

// Submit contact form (public)
router.post('/submit', 
  generalLimiter,
  validateInput,
  catchAsyncErrors(async (req, res) => {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Create contact message
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    // Get settings for admin email
    const settings = await Settings.getSettings();

    // Send email notification to admin
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">New Contact Message</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${contact.formattedDate}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
              ${(contact.message || '').replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">
            This message was sent from the contact form on your website.
          </p>
        </div>
      `;

      await sendEmail({
        email: settings.contactEmail,
        subject: `New Contact Message from ${name}`,
        html: emailContent
      });

      console.log(`✅ Contact message notification sent to admin: ${settings.contactEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send contact notification email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      contactId: contact._id
    });
  })
);

// Get all contact messages (admin only)
router.get('/messages', 
  isAuthenticatedUser, 
  authorizeRoles('admin'),
  catchAsyncErrors(async (req, res) => {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};
    
    // Filter by status
    if (status && ['unread', 'read', 'replied'].includes(status)) {
      query.status = status;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: 'name email message status createdAt formattedDate'
    };

    const contacts = await Contact.paginate(query, options);

    res.status(200).json({
      success: true,
      contacts: contacts.docs,
      pagination: {
        page: contacts.page,
        limit: contacts.limit,
        totalPages: contacts.totalPages,
        totalDocs: contacts.totalDocs,
        hasNextPage: contacts.hasNextPage,
        hasPrevPage: contacts.hasPrevPage
      }
    });
  })
);

// Get single contact message (admin only)
router.get('/messages/:id', 
  isAuthenticatedUser, 
  authorizeRoles('admin'),
  catchAsyncErrors(async (req, res) => {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      contact
    });
  })
);

// Mark message as read (admin only)
router.patch('/messages/:id/read', 
  isAuthenticatedUser, 
  authorizeRoles('admin'),
  catchAsyncErrors(async (req, res) => {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      contact
    });
  })
);

// Reply to contact message (admin only)
router.post('/messages/:id/reply', 
  isAuthenticatedUser, 
  authorizeRoles('admin'),
  validateInput,
  catchAsyncErrors(async (req, res) => {
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reply message'
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Update contact with reply
    contact.adminReply = reply.trim();
    contact.status = 'replied';
    contact.repliedAt = new Date();
    await contact.save();

    // Send reply email to customer
    try {
      const settings = await Settings.getSettings();
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4af37;">Reply from Laiq Bags</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear ${contact.name},</p>
            <p>Thank you for contacting us. Here is our reply to your message:</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${(reply || '').replace(/\n/g, '<br>')}
            </div>
            <p>Best regards,<br>Laiq Bags Team</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            This is a reply to your contact form submission on our website.
          </p>
        </div>
      `;

      await sendEmail({
        email: contact.email,
        subject: 'Reply from Laiq Bags - Contact Form',
        html: emailContent
      });

      console.log(`✅ Reply sent to customer: ${contact.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send reply email:', emailError.message);
      // Don't fail the request if email fails, just log the error
      console.log('📧 Email would have been sent to:', contact.email);
      console.log('📧 Subject: Reply from Laiq Bags - Contact Form');
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      contact
    });
  })
);

// Delete contact message (admin only)
router.delete('/messages/:id', 
  isAuthenticatedUser, 
  authorizeRoles('admin'),
  catchAsyncErrors(async (req, res) => {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  })
);

// Get contact statistics (admin only)
router.get('/stats', 
  isAuthenticatedUser, 
  authorizeRoles('admin'),
  catchAsyncErrors(async (req, res) => {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMessages = await Contact.countDocuments();
    const unreadMessages = await Contact.countDocuments({ status: 'unread' });
    const todayMessages = await Contact.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    const statsObject = {
      total: totalMessages,
      unread: unreadMessages,
      today: todayMessages,
      byStatus: {}
    };

    stats.forEach(stat => {
      statsObject.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: statsObject
    });
  })
);

module.exports = router;
