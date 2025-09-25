const nodemailer = require('nodemailer');
const axios = require('axios');

const sendEmail = async (options) => {
  const to = options.email;
  const subject = options.subject;
  const text = options.text || options.message || '';
  const html = options.html || options.message || '';
  const requestedFrom = options.from;
  const requestedReplyTo = options.replyTo || process.env.SUPPORT_EMAIL;

  // Prefer Resend HTTPS API if configured (works on Render free plan)
  if (process.env.RESEND_API_KEY) {
    const fromEmail = requestedFrom || process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@laiq.shop';
    try {
      const payload = {
        from: `${process.env.BUSINESS_NAME || 'Laiq Bags'} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: requestedReplyTo
      };

      const res = await axios.post('https://api.resend.com/emails', payload, {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Resend email queued id:', res.data?.id || 'unknown');
      return;
    } catch (error) {
      console.error('❌ Resend email failed, falling back to SMTP if available:', error.response?.data || error.message);
      // Fall through to SMTP fallback below
    }
  }

  // SMTP fallback (will not work on Render free due to blocked ports)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') {
    console.warn('⚠️ Email configuration not set or SMTP blocked. Skipping email send.');
    console.log('📧 Email would have been sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Content:', html || text);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.verify();
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return;
  }

  const message = {
    from: `${process.env.BUSINESS_NAME || 'Laiq Bags'} <${requestedFrom || process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    replyTo: requestedReplyTo
  };

  try {
    await transporter.sendMail(message);
    console.log('✅ SMTP email sent successfully to:', to);
  } catch (error) {
    console.error('❌ SMTP email sending failed:', error.message);
  }
};

module.exports = sendEmail; 