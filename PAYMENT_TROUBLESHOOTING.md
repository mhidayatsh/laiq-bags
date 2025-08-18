# 🔧 Payment Troubleshooting Guide

## 🚨 **Common Payment Issues & Solutions**

### 1. **Netbanking Blank Page Issue**

**Problem:** Netbanking page blank dikhta hai ya redirect nahi hota

**Causes:**
- Browser popup blocker
- JavaScript errors
- Network connectivity issues
- Razorpay configuration problems

**Solutions:**
```javascript
// ✅ Fixed Configuration
const options = {
    key: razorpayKey,
    amount: orderData.totalAmount * 100,
    currency: 'INR',
    name: 'Laiq Bags',
    description: 'Order Payment',
    order_id: razorpayResponse.order.id,
    config: {
        display: {
            blocks: {
                other: {
                    name: "Other Payment methods",
                    instruments: [
                        {
                            method: "netbanking",
                            banks: ["ICICI", "AXIS", "HDFC", "SBI", "PNB", "KOTAK", "YES", "IDBI", "UNION", "CANARA", "BOB", "IOB", "UCO", "CENTRAL", "VIJAYA", "ANDHRA", "CORPORATION", "INDIAN", "SYNDICATE", "PUNJAB", "ORIENTAL", "ALLAHABAD", "DENA", "BANKOFBARODA", "BANKOFINDIA", "CANARABANK", "CORPORATIONBANK", "DENABANK", "INDIANBANK", "ORIENTALBANK", "PUNJABNATIONALBANK", "SYNDICATEBANK", "UNIONBANKOFINDIA", "VIJAYABANK", "ANDHRABANK", "CENTRALBANKOFINDIA", "INDIANOVERSEASBANK", "UCOBANK"]
                        }
                    ]
                }
            }
        }
    },
    modal: {
        escape: false,
        handleback: true
    },
    retry: {
        enabled: true,
        max_count: 3
    }
};
```

**User Instructions:**
1. Popup blocker disable karein
2. Different browser try karein (Chrome, Firefox, Safari)
3. Incognito/Private mode mein try karein
4. Network connection check karein

### 2. **Payment Fails After Few Seconds**

**Problem:** Payment initiate hota hai lekin kuch seconds baad fail ho jata hai

**Causes:**
- Insufficient balance
- Bank server issues
- Invalid card details
- 3D Secure authentication failure
- Network timeout

**Solutions:**
```javascript
// ✅ Better Error Handling
rzp.on('payment.failed', function (resp) {
    console.error('❌ Payment failed:', resp.error);
    showToast('Payment failed: ' + (resp.error.description || 'Unknown error'), 'error');
    // Show specific error message based on error code
    handlePaymentError(resp.error);
});

function handlePaymentError(error) {
    switch(error.code) {
        case 'PAYMENT_DECLINED':
            showToast('Payment declined by bank. Please check your balance.', 'error');
            break;
        case 'INVALID_CARD':
            showToast('Invalid card details. Please check and try again.', 'error');
            break;
        case 'AUTHENTICATION_FAILED':
            showToast('3D Secure authentication failed. Please try again.', 'error');
            break;
        default:
            showToast('Payment failed: ' + error.description, 'error');
    }
}
```

### 3. **UPI Payment Issues**

**Problem:** UPI payment work nahi karta

**Solutions:**
```javascript
// ✅ UPI Configuration
{
    method: "upi",
    flow: "collect",
    prefill: {
        name: customerInfo.name,
        email: customerInfo.email,
        contact: customerInfo.phone
    }
}
```

### 4. **Card Payment Issues**

**Problem:** Card payment decline hota hai

**Solutions:**
- Test cards use karein development mein
- Valid expiry date check karein
- CVV correct hai ya nahi
- Card international transactions enabled hai ya nahi

### 5. **Wallet Payment Issues**

**Problem:** Wallet payment work nahi karta

**Solutions:**
```javascript
// ✅ Wallet Configuration
{
    method: "wallet",
    wallets: ["paytm", "freecharge", "mobikwik", "olamoney", "amazonpay", "phonepe", "bhimupi"]
}
```

## 🔍 **Debugging Steps**

### 1. **Browser Console Check**
```javascript
// Console mein ye logs check karein
console.log('💳 Processing Razorpay payment...');
console.log('✅ Razorpay order created:', orderId);
console.log('🔄 Opening Razorpay modal...');
console.log('❌ Payment failed:', error);
```

### 2. **Network Tab Check**
- Network tab mein Razorpay API calls check karein
- Response status codes check karein
- Request/Response data check karein

### 3. **Server Logs Check**
```bash
# Server logs mein ye check karein
✅ Razorpay initialized successfully
💳 Creating Razorpay order for amount: 1000
✅ Razorpay order created: order_123456
🔐 Verifying Razorpay payment
✅ Payment verification successful
```

## 🛠️ **Testing Checklist**

### Development Testing
- [ ] Test with Razorpay test cards
- [ ] Test with test UPI IDs
- [ ] Test with test netbanking credentials
- [ ] Test payment failure scenarios
- [ ] Test payment cancellation
- [ ] Test network timeout scenarios

### Production Testing
- [ ] Test with real payment methods
- [ ] Test with different browsers
- [ ] Test with mobile devices
- [ ] Test with slow network
- [ ] Test with popup blockers enabled

## 📞 **Support Information**

### Razorpay Support
- **Email:** support@razorpay.com
- **Phone:** 1800-123-4567
- **Documentation:** https://razorpay.com/docs/

### Common Error Codes
- `PAYMENT_DECLINED`: Bank ne payment decline kar di
- `INVALID_CARD`: Card details galat hain
- `AUTHENTICATION_FAILED`: 3D Secure authentication fail
- `NETWORK_ERROR`: Network connectivity issue
- `TIMEOUT`: Payment timeout ho gaya

### Environment Variables Check
```bash
# .env file mein ye variables check karein
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

## 🚀 **Quick Fixes**

### 1. **Immediate Fixes**
```bash
# Server restart
npm restart

# Clear browser cache
Ctrl + Shift + R

# Check environment variables
echo $RAZORPAY_KEY_ID
```

### 2. **Configuration Fixes**
```javascript
// Razorpay options mein ye add karein
modal: {
    escape: false,
    handleback: true
},
retry: {
    enabled: true,
    max_count: 3
}
```

### 3. **Error Handling Fixes**
```javascript
// Better error messages
function showPaymentError(error) {
    const errorMessages = {
        'PAYMENT_DECLINED': 'आपका बैंक पेमेंट को अस्वीकार कर रहा है। कृपया अपना बैलेंस चेक करें।',
        'INVALID_CARD': 'कार्ड की जानकारी गलत है। कृपया दोबारा जांच करें।',
        'AUTHENTICATION_FAILED': '3D Secure प्रमाणीकरण विफल। कृपया दोबारा प्रयास करें।'
    };
    
    const message = errorMessages[error.code] || error.description || 'पेमेंट में त्रुटि हुई।';
    showToast(message, 'error');
}
```

---

**Last Updated:** $(date)
**Version:** 1.0
**Status:** ✅ Active 