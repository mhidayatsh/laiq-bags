const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Check if email configuration is available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') {
    console.warn('⚠️ Email configuration not set up. Skipping email send.');
    console.log('📧 Email would have been sent to:', options.email);
    console.log('📧 Subject:', options.subject);
    console.log('📧 Content:', options.html || options.message || options.text || '');
    return;
  }

  // Create transporter with Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // App password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.log('📧 Email would have been sent to:', options.email);
    console.log('📧 Subject:', options.subject);
    console.log('📧 Content:', options.html || options.message || options.text || '');
    return; // Don't throw error, just log and continue
  }

  const message = {
    from: `Laiq Bags <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.text || options.message || '',
    html: options.html || options.message || ''
  };

  try {
    await transporter.sendMail(message);
    console.log('✅ Email sent successfully to:', options.email);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('📧 Email would have been sent to:', options.email);
    console.log('📧 Subject:', options.subject);
    console.log('📧 Content:', options.html || options.message || options.text || '');
  }
};

module.exports = sendEmail; 