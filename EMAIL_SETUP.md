# Email Notifications Setup Guide

## 📧 Setting Up Email Notifications

### 1. Gmail App Password Setup

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification**

#### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Select **Mail** and **Other (Custom name)**
4. Enter "Laiq Bags" as the name
5. Click **Generate**
6. Copy the 16-character password

#### Step 3: Update Configuration
```env
EMAIL_USER=mdhidayatulahsheikh786@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### 2. Email Templates

#### Order Confirmation Email
```html
Subject: Order Confirmed - Laiq Bags

Dear {{customerName}},

Thank you for your order! Your order has been successfully placed.

Order Details:
- Order ID: {{orderId}}
- Total Amount: ₹{{totalAmount}}
- Payment Method: {{paymentMethod}}

We'll notify you when your order ships.

Best regards,
Laiq Bags Team
```

#### Password Reset Email
```html
Subject: Password Reset - Laiq Bags

Dear {{customerName}},

You requested a password reset for your Laiq Bags account.

Click the link below to reset your password:
{{resetLink}}

This link will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Laiq Bags Team
```

### 3. Implementation Status

#### ✅ Completed
- [x] Email configuration
- [x] Password reset emails
- [x] Email templates

#### 🚧 In Progress
- [ ] Order confirmation emails
- [ ] Shipping update emails
- [ ] Welcome emails

#### 📋 Next Steps
1. **Test email functionality**
2. **Create email templates**
3. **Implement order notifications**
4. **Add shipping updates**

## 🔧 Testing Email

### Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter email address
4. Check email for reset link

### Test Order Confirmation
1. Place a test order
2. Check if confirmation email is sent
3. Verify email content

## 📱 Email Features

### Current Features
- **Password Reset** - Secure reset links
- **Order Confirmation** - Order details
- **Welcome Emails** - New customer onboarding

### Planned Features
- **Shipping Updates** - Order tracking
- **Abandoned Cart** - Recovery emails
- **Promotional** - Sales and offers

## 🔒 Security Notes

1. **Use App Passwords** - Never use regular passwords
2. **Secure Links** - Time-limited reset links
3. **Unsubscribe** - Include unsubscribe options
4. **GDPR Compliance** - Respect user preferences

## 📞 Support

For email issues:
- **Gmail Support**: [Help Center](https://support.google.com/mail/)
- **Technical Issues**: Contact development team

---

**Note**: Ensure email templates are professional and include all necessary legal disclaimers for production use. 

## 📧 Setting Up Email Notifications

### 1. Gmail App Password Setup

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification**

#### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Select **Mail** and **Other (Custom name)**
4. Enter "Laiq Bags" as the name
5. Click **Generate**
6. Copy the 16-character password

#### Step 3: Update Configuration
```env
EMAIL_USER=mdhidayatulahsheikh786@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### 2. Email Templates

#### Order Confirmation Email
```html
Subject: Order Confirmed - Laiq Bags

Dear {{customerName}},

Thank you for your order! Your order has been successfully placed.

Order Details:
- Order ID: {{orderId}}
- Total Amount: ₹{{totalAmount}}
- Payment Method: {{paymentMethod}}

We'll notify you when your order ships.

Best regards,
Laiq Bags Team
```

#### Password Reset Email
```html
Subject: Password Reset - Laiq Bags

Dear {{customerName}},

You requested a password reset for your Laiq Bags account.

Click the link below to reset your password:
{{resetLink}}

This link will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
Laiq Bags Team
```

### 3. Implementation Status

#### ✅ Completed
- [x] Email configuration
- [x] Password reset emails
- [x] Email templates

#### 🚧 In Progress
- [ ] Order confirmation emails
- [ ] Shipping update emails
- [ ] Welcome emails

#### 📋 Next Steps
1. **Test email functionality**
2. **Create email templates**
3. **Implement order notifications**
4. **Add shipping updates**

## 🔧 Testing Email

### Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter email address
4. Check email for reset link

### Test Order Confirmation
1. Place a test order
2. Check if confirmation email is sent
3. Verify email content

## 📱 Email Features

### Current Features
- **Password Reset** - Secure reset links
- **Order Confirmation** - Order details
- **Welcome Emails** - New customer onboarding

### Planned Features
- **Shipping Updates** - Order tracking
- **Abandoned Cart** - Recovery emails
- **Promotional** - Sales and offers

## 🔒 Security Notes

1. **Use App Passwords** - Never use regular passwords
2. **Secure Links** - Time-limited reset links
3. **Unsubscribe** - Include unsubscribe options
4. **GDPR Compliance** - Respect user preferences

## 📞 Support

For email issues:
- **Gmail Support**: [Help Center](https://support.google.com/mail/)
- **Technical Issues**: Contact development team

---

**Note**: Ensure email templates are professional and include all necessary legal disclaimers for production use. 