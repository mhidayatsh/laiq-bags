require('dotenv').config({ path: './config.env' });
const { sendEmail } = require('./utils/emailService');

const testEmail = async () => {
  try {
    console.log('🧪 Testing email functionality...');
    console.log('📧 Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? '***' : 'NOT_SET'
    });

    const result = await sendEmail({
      email: 'test@example.com',
      subject: 'Test Email from Laiq Bags',
      text: 'This is a test email to verify email functionality.',
      html: '<h1>Test Email</h1><p>This is a test email to verify email functionality.</p>'
    });

    console.log('📧 Email test result:', result);
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
};

testEmail(); 