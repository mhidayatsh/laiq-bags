# Official Razorpay Integration Guide

## 🎯 Overview

This document outlines the official Razorpay integration implemented in the Laiq Bags checkout system, following Razorpay's recommended best practices and standard patterns.

## 📋 Integration Steps

### Step 1: Create Razorpay Order (Server-Side)
```javascript
// Create Razorpay order on server
const razorpayResponse = await api.createRazorpayOrder(orderData.totalAmount);

if (!razorpayResponse.success) {
    throw new Error(razorpayResponse.message || 'Failed to create Razorpay order');
}
```

### Step 2: Configure Razorpay Options
```javascript
const options = {
    key: razorpayKey,                    // Public key from server
    amount: orderData.totalAmount * 100, // Amount in paise
    currency: 'INR',
    name: 'Laiq Bags',
    description: `Order Payment - ${orderData.orderItems.length} items`,
    order_id: razorpayResponse.order.id,
    prefill: {
        name: customerInfo.name || '',
        email: customerInfo.email || '',
        contact: customerPhone
    },
    theme: {
        color: '#D4AF37'
    }
};
```

### Step 3: Payment Method Configuration
```javascript
config: {
    display: {
        blocks: {
            cards: {
                name: "Pay using Card",
                instruments: [{ method: "card" }]
            },
            upi: {
                name: "Pay using UPI",
                instruments: [{ method: "upi", flow: "collect" }]
            },
            netbanking: {
                name: "Pay using Netbanking",
                instruments: [{ method: "netbanking" }]
            },
            wallet: {
                name: "Pay using Wallets",
                instruments: [{ method: "wallet" }]
            }
        },
        sequence: ["block.cards", "block.upi", "block.netbanking", "block.wallet"],
        preferences: {
            show_default_blocks: false
        }
    }
}
```

### Step 4: Success Handler
```javascript
handler: async function(response) {
    // Step 1: Verify payment signature
    const verificationResponse = await api.verifyRazorpayPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        expectedAmount: orderData.totalAmount
    });
    
    // Step 2: Create order with payment details
    const orderResponse = await api.createCustomerOrder({
        ...orderData,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
    });
    
    // Step 3: Clear cart and redirect
    clearCartAfterOrder();
    localStorage.removeItem('pendingOrderData');
    
    // Redirect to order confirmation
    setTimeout(() => {
        window.location.href = `/order-confirmation.html?id=${orderResponse.order._id}`;
    }, 2000);
}
```

### Step 5: Error Handling
```javascript
// Payment failed handler
rzp.on('payment.failed', function (resp) {
    const err = (resp && resp.error) || {};
    const friendly = err.description || (err.reason ? `Payment failed: ${err.reason}` : 'Payment failed. Please try a different payment method.');
    
    console.error('❌ Payment failed:', {
        code: err.code,
        description: err.description,
        source: err.source,
        step: err.step,
        reason: err.reason
    });
    
    showToast(friendly, 'error');
    resetPaymentState();
});

// Payment cancelled handler
rzp.on('payment.cancelled', function (resp) {
    console.log('❌ Payment cancelled by user');
    showToast('Payment cancelled', 'warning');
    resetPaymentState();
});
```

### Step 6: Modal Configuration
```javascript
modal: {
    ondismiss: function() {
        console.log('❌ Payment modal dismissed');
        showToast('Payment cancelled', 'warning');
        resetPaymentState();
    },
    escape: false,
    handleback: true
},

retry: {
    enabled: true,
    max_count: 3
}
```

## 🔧 Helper Functions

### Clear Cart After Order
```javascript
function clearCartAfterOrder() {
    const token = localStorage.getItem('customerToken');
    if (token) {
        localStorage.removeItem('userCart');
        console.log('🧹 User cart cleared');
    } else {
        localStorage.removeItem('guestCart');
        console.log('🧹 Guest cart cleared');
    }
}
```

### Reset Payment State
```javascript
function resetPaymentState() {
    showLoadingState(false);
    resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
    isProcessing = false;
    localStorage.removeItem('pendingOrderData');
}
```

## 🎨 Brand Logo Handling

### Professional Logo Management
```javascript
// Only use logo if successfully prefetched as data URL
...(brandLogoDataUrl && { image: brandLogoDataUrl })
```

### Logo Prefetching
```javascript
async function prefetchBrandLogo() {
    try {
        const logoUrl = `${window.location.origin}${brandLogoCanonicalUrl}`;
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const resp = await fetch(logoUrl, { 
            signal: controller.signal,
            cache: 'force-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!resp.ok) return;
        
        const blob = await resp.blob();
        
        // Validate blob size
        if (blob.size > 1024 * 1024) return;
        
        // Convert to data URL
        const reader = new FileReader();
        brandLogoDataUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        
    } catch (e) {
        brandLogoDataUrl = null;
    }
}
```

## 📊 Official Razorpay Features Used

### ✅ Payment Methods
- **Cards**: Credit/Debit cards
- **UPI**: Unified Payments Interface
- **Netbanking**: Internet banking
- **Wallets**: Digital wallets

### ✅ Security Features
- **Signature Verification**: Server-side payment verification
- **Order Validation**: Amount and order ID validation
- **Secure Communication**: HTTPS and proper authentication

### ✅ User Experience
- **Prefill Information**: Auto-fill customer details
- **Retry Mechanism**: Automatic retry on failures
- **Modal Controls**: Proper modal behavior
- **Error Handling**: User-friendly error messages

### ✅ Configuration Options
- **Theme Customization**: Brand colors and styling
- **Payment Method Display**: Customizable payment options
- **Modal Behavior**: Escape and back button handling
- **Notes**: Additional order information

## 🔒 Security Best Practices

1. **Server-Side Order Creation**: Orders are created on the server
2. **Signature Verification**: All payments are verified server-side
3. **Amount Validation**: Payment amounts are validated
4. **Secure Storage**: Sensitive data is properly handled
5. **Error Logging**: Comprehensive error tracking

## 🚀 Performance Optimizations

1. **Logo Prefetching**: Brand logos are prefetched and cached
2. **Data URL Conversion**: Images are converted to data URLs
3. **Timeout Handling**: Requests have proper timeouts
4. **Error Recovery**: Graceful fallbacks for failures
5. **State Management**: Proper cleanup and state reset

## 📱 Mobile Optimization

1. **Responsive Design**: Works on all device sizes
2. **Touch-Friendly**: Optimized for mobile interactions
3. **Fast Loading**: Optimized for mobile networks
4. **Error Handling**: Mobile-specific error messages

## 🎯 Benefits of Official Integration

1. **Reliability**: Uses Razorpay's tested and proven methods
2. **Security**: Follows Razorpay's security recommendations
3. **Maintainability**: Standard patterns are easy to maintain
4. **Scalability**: Can handle high transaction volumes
5. **Support**: Full Razorpay support and documentation
6. **Updates**: Easy to update with Razorpay improvements

## 🔄 Integration Flow

```
1. User clicks "Pay with Razorpay"
2. Create order on server
3. Configure Razorpay options
4. Open Razorpay modal
5. User completes payment
6. Verify payment signature
7. Create order in database
8. Clear cart and redirect
```

This official integration ensures maximum compatibility, security, and user experience while following Razorpay's recommended best practices.
