# Payment Gateway Setup Guide

## 🚀 Setting Up Payment Gateways

### 1. Razorpay Setup

#### Step 1: Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete KYC verification

#### Step 2: Get API Keys
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Generate new API key pair
4. Copy **Key ID** and **Key Secret**

#### Step 3: Update Configuration
```env
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

#### Step 4: Test Payment Flow
1. Use test card numbers:
   - **Card Number**: 4111 1111 1111 1111
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits
   - **Name**: Any name

### 2. Stripe Setup

#### Step 1: Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for a new account
3. Complete account verification

#### Step 2: Get API Keys
1. Login to Stripe Dashboard
2. Go to **Developers** → **API Keys**
3. Copy **Publishable Key** and **Secret Key**

#### Step 3: Update Configuration
```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_here
```

#### Step 4: Test Payment Flow
1. Use test card numbers:
   - **Card Number**: 4242 4242 4242 4242
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits

## 🔧 Implementation Status

### ✅ Completed
- [x] Payment method selection in checkout
- [x] Order creation with payment method
- [x] Backend payment routes
- [x] Frontend payment integration

### 🚧 In Progress
- [ ] Real API keys integration
- [ ] Payment verification
- [ ] Error handling
- [ ] Success/failure pages

### 📋 Next Steps
1. **Get real API keys** from Razorpay/Stripe
2. **Update config.env** with real keys
3. **Test payment flow** with real cards
4. **Deploy to production**

## 🧪 Testing

### Test Cards

#### Razorpay Test Cards
```
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
```

#### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Failure: 4000 0000 0000 0002
```

## 🔒 Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Test thoroughly** before going live
4. **Monitor transactions** regularly

## 📞 Support

For payment gateway issues:
- **Razorpay**: [Support Portal](https://razorpay.com/support/)
- **Stripe**: [Support Center](https://support.stripe.com/)

---

**Note**: This guide is for development setup. For production, ensure proper security measures and compliance with payment regulations. 

## 🚀 Setting Up Payment Gateways

### 1. Razorpay Setup

#### Step 1: Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete KYC verification

#### Step 2: Get API Keys
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Generate new API key pair
4. Copy **Key ID** and **Key Secret**

#### Step 3: Update Configuration
```env
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

#### Step 4: Test Payment Flow
1. Use test card numbers:
   - **Card Number**: 4111 1111 1111 1111
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits
   - **Name**: Any name

### 2. Stripe Setup

#### Step 1: Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for a new account
3. Complete account verification

#### Step 2: Get API Keys
1. Login to Stripe Dashboard
2. Go to **Developers** → **API Keys**
3. Copy **Publishable Key** and **Secret Key**

#### Step 3: Update Configuration
```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_here
```

#### Step 4: Test Payment Flow
1. Use test card numbers:
   - **Card Number**: 4242 4242 4242 4242
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits

## 🔧 Implementation Status

### ✅ Completed
- [x] Payment method selection in checkout
- [x] Order creation with payment method
- [x] Backend payment routes
- [x] Frontend payment integration

### 🚧 In Progress
- [ ] Real API keys integration
- [ ] Payment verification
- [ ] Error handling
- [ ] Success/failure pages

### 📋 Next Steps
1. **Get real API keys** from Razorpay/Stripe
2. **Update config.env** with real keys
3. **Test payment flow** with real cards
4. **Deploy to production**

## 🧪 Testing

### Test Cards

#### Razorpay Test Cards
```
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
```

#### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Failure: 4000 0000 0000 0002
```

## 🔒 Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Test thoroughly** before going live
4. **Monitor transactions** regularly

## 📞 Support

For payment gateway issues:
- **Razorpay**: [Support Portal](https://razorpay.com/support/)
- **Stripe**: [Support Center](https://support.stripe.com/)

---

**Note**: This guide is for development setup. For production, ensure proper security measures and compliance with payment regulations. 