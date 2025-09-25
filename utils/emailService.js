const nodemailer = require('nodemailer');
const axios = require('axios');

// Helper to build absolute asset URLs for emails
const getBaseUrl = () => process.env.FRONTEND_URL || 'https://www.laiq.shop';
const getLogoUrl = () => `${getBaseUrl()}/assets/laiq-logo-512x512.png`;

// Create email transporter with fallback
const createTransporter = () => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email configuration not available, skipping email setup');
      return null;
    }

    console.log('📧 Creating email transporter with:', process.env.EMAIL_USER);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true // Log to console
    });

    return transporter;
  } catch (error) {
    console.error('❌ Email transporter creation failed:', error.message);
    return null;
  }
};

// Send email with Resend first, SMTP fallback
const sendEmail = async (options) => {
  try {
    // Prefer Resend API if available
    if (process.env.RESEND_API_KEY) {
      const fromEmail = options.from || process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@laiq.shop';
      const payload = {
        from: `${process.env.BUSINESS_NAME || 'Laiq Bags'} <${fromEmail}>`,
        to: Array.isArray(options.email) ? options.email : [options.email],
        subject: options.subject,
        text: options.text,
        html: options.html,
        reply_to: options.replyTo || process.env.SUPPORT_EMAIL
      };
      try {
        const res = await axios.post('https://api.resend.com/emails', payload, {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        console.log('✅ Resend email queued:', res.data?.id || 'unknown');
        return { success: true, messageId: res.data?.id };
      } catch (apiError) {
        console.error('❌ Resend API error, falling back to SMTP:', apiError.response?.data || apiError.message);
        // continue to SMTP fallback
      }
    }

    // SMTP fallback
    const transporter = createTransporter();
    if (!transporter) {
      console.log('⚠️  Email service not available, skipping email send');
      return { success: false, message: 'Email service not configured' };
    }
    try {
      console.log('🔍 Verifying email transporter...');
      await transporter.verify();
    } catch (verifyError) {
      return { success: false, message: 'Email service verification failed: ' + verifyError.message };
    }
    const info = await transporter.sendMail({
      from: options.from || process.env.EMAIL_FROM || `"${process.env.BUSINESS_NAME || 'Laiq Bags'}" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || process.env.SUPPORT_EMAIL
    });
    console.log('✅ SMTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('❌ Error details:', error);
    return { success: false, message: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = 'Password Reset Request - Laiq Bags';
  const text = `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`;
  const html = `
    <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header with Logo -->
      <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center;">
        <div style="display: inline-block; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <img src="${getLogoUrl()}" alt="Laiq Bags" style="height: 48px; width: auto; display: block;" />
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #36454f; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">You requested a password reset for your Laiq Bags account.</p>
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">Please click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-bottom: 15px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #d4af37; font-size: 14px; background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #d4af37;">${resetUrl}</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;"><strong>⚠️ Security Notice:</strong> This link will expire in 10 minutes.</p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this password reset, please ignore this email.</p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; margin: 0; font-size: 14px;">© 2024 <strong style="color: #d4af37;">Laiq Bags</strong>. All rights reserved.</p>
        <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">Carry Style with Confidence</p>
      </div>
    </div>
  `;

  return await sendEmail({ email, subject, text, html, from: process.env.FROM_EMAIL, replyTo: process.env.SUPPORT_EMAIL });
};

// Send newsletter email
const sendNewsletterEmail = async (email, newsletterData) => {
  const subject = newsletterData.subject;
  const text = newsletterData.content;
  const html = `
    <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header with Logo -->
      <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center;">
        <div style="display: inline-block; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <img src="${getLogoUrl()}" alt="Laiq Bags" style="height: 48px; width: auto; display: block;" />
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #36454f; font-size: 24px; margin-bottom: 20px; font-weight: 600;">${newsletterData.subject}</h2>
        <div style="line-height: 1.6; color: #666; margin-bottom: 30px;">
          ${newsletterData.content.replace(/\n/g, '<br>')}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://www.laiq.shop'}" style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">Shop Now</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; margin: 0; font-size: 14px;">© 2024 <strong style="color: #d4af37;">Laiq Bags</strong>. All rights reserved.</p>
        <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">Carry Style with Confidence</p>
        <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
          <a href="${process.env.FRONTEND_URL || 'https://www.laiq.shop'}/unsubscribe?email=${email}" style="color: #d4af37; text-decoration: none;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;

  return await sendEmail({ email, subject, text, html, from: process.env.NEWSLETTER_FROM || process.env.FROM_EMAIL, replyTo: process.env.SUPPORT_EMAIL });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  const subject = 'Order Confirmation - Laiq Bags';
  const text = `Your order #${orderDetails.orderId} has been confirmed. Total amount: ₹${orderDetails.totalAmount}`;
  const html = `
    <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header with Logo -->
      <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 30px; text-align: center;">
        <div style="display: inline-block; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <img src="${getLogoUrl()}" alt="Laiq Bags" style="height: 48px; width: auto; display: block;" />
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 50%; width: 80px; height: 80px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 40px; color: #155724;">✓</span>
          </div>
          <h2 style="color: #36454f; font-size: 24px; margin-bottom: 10px; font-weight: 600;">Order Confirmed!</h2>
          <p style="color: #666; font-size: 16px;">Thank you for your order!</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #36454f; font-size: 18px; margin-bottom: 20px; font-weight: 600;">Order Details</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #666; font-weight: 500;">Order ID:</span>
            <span style="color: #36454f; font-weight: 600;">${orderDetails.orderId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #666; font-weight: 500;">Total Amount:</span>
            <span style="color: #d4af37; font-weight: 600; font-size: 18px;">₹${orderDetails.totalAmount}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-weight: 500;">Payment Method:</span>
            <span style="color: #36454f; font-weight: 600;">${orderDetails.paymentMethod}</span>
          </div>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">We'll send you updates about your order status. You can also track your order through your account dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://www.laiq.shop'}/order-management.html" style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(212, 175, 55, 0.3);">Track Order</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; margin: 0; font-size: 14px;">© 2024 <strong style="color: #d4af37;">Laiq Bags</strong>. All rights reserved.</p>
        <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">Carry Style with Confidence</p>
      </div>
    </div>
  `;

  return await sendEmail({ email, subject, text, html, from: process.env.FROM_EMAIL, replyTo: process.env.SUPPORT_EMAIL });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendNewsletterEmail,
  sendOrderConfirmationEmail
}; 