# Practical Order Management Examples
## Step-by-Step Guide for Laiq Bags

This guide provides practical examples and step-by-step instructions for managing orders, billing, and shipping in your Laiq Bags e-commerce system.

---

## 🚀 Quick Start: Managing Your First Order

### Step 1: Access Admin Panel
1. **Login**: Go to `admin-login.html`
2. **Navigate**: Click "Orders" in the sidebar
3. **View Orders**: See all incoming orders

### Step 2: Review New Order
```
Order #: 65a1b2c3d4e5f6
Customer: John Doe (john@example.com)
Items: 2x Leather Backpack (Brown)
Total: ₹2,500
Status: Pending
Payment: Razorpay (Completed)
```

### Step 3: Process the Order
1. **Click "View Details"**
2. **Verify Payment**: Check payment status
3. **Update Status**: Change to "Processing"
4. **Add Tracking**: When ready to ship

---

## 💰 Billing Management Examples

### Example 1: Process COD Order Payment

**Scenario**: Customer ordered with Cash on Delivery, order delivered successfully.

```javascript
// Step 1: Mark order as delivered
PUT /api/orders/admin/65a1b2c3d4e5f6/status
{
  "status": "delivered"
}

// Step 2: Update payment status (if needed)
// The system automatically handles COD payment collection
// No additional API call needed for COD orders
```

**Admin Panel Steps**:
1. Go to Orders section
2. Find the COD order
3. Click "View Details"
4. Change status to "Delivered"
5. Payment is automatically marked as collected

### Example 2: Process Online Payment Refund

**Scenario**: Customer cancelled order, needs refund for online payment.

```javascript
// Step 1: Cancel the order
POST /api/orders/admin/65a1b2c3d4e5f6/cancel
{
  "reason": "Customer requested cancellation",
  "refundAmount": 2500.00
}

// Step 2: Process refund
POST /api/orders/admin/65a1b2c3d4e5f6/refund
{
  "refundMethod": "original_payment",
  "refundAmount": 2500.00
}
```

**Admin Panel Steps**:
1. Find the order in admin panel
2. Click "View Details"
3. Click "Cancel Order"
4. Enter cancellation reason
5. Process refund through payment gateway

### Example 3: Handle Payment Dispute

**Scenario**: Customer claims payment was made but order shows pending.

```javascript
// Step 1: Verify payment manually
GET /api/orders/65a1b2c3d4e5f6

// Step 2: Check payment gateway logs
// Contact Razorpay support if needed

// Step 3: Manually update payment status if verified
PUT /api/orders/admin/65a1b2c3d4e5f6/status
{
  "status": "processing"
}
```

---

## 📦 Shipping Management Examples

### Example 1: Ship Order with Tracking

**Scenario**: Order is ready to ship, need to add courier details.

```javascript
// Step 1: Update tracking information
PUT /api/orders/admin/65a1b2c3d4e5f6/tracking
{
  "trackingNumber": "DEL123456789",
  "courierName": "Delhivery",
  "estimatedDelivery": "2024-01-15"
}

// Step 2: Update order status to shipped
PUT /api/orders/admin/65a1b2c3d4e5f6/status
{
  "status": "shipped"
}
```

**Admin Panel Steps**:
1. Go to Orders section
2. Find the order to ship
3. Click "View Details"
4. In tracking section, enter:
   - Tracking Number: `DEL123456789`
   - Courier Name: `Delhivery`
   - Estimated Delivery: `2024-01-15`
5. Click "Update Tracking"
6. Change status to "Shipped"

### Example 2: Handle Delivery Confirmation

**Scenario**: Courier confirms delivery, need to mark order as delivered.

```javascript
// Update order status to delivered
PUT /api/orders/admin/65a1b2c3d4e5f6/status
{
  "status": "delivered"
}
```

**Admin Panel Steps**:
1. Find the shipped order
2. Click "View Details"
3. Change status to "Delivered"
4. System automatically:
   - Updates delivery timestamp
   - Sends confirmation email to customer
   - Marks payment as collected (for COD)

### Example 3: Handle Shipping Delay

**Scenario**: Courier reports delay, need to update customer.

```javascript
// Step 1: Update tracking with new delivery date
PUT /api/orders/admin/65a1b2c3d4e5f6/tracking
{
  "trackingNumber": "DEL123456789",
  "courierName": "Delhivery",
  "estimatedDelivery": "2024-01-18"  // Updated date
}

// Step 2: Add admin notes
POST /api/orders/65a1b2c3d4e5f6/notes
{
  "adminNotes": "Courier delay due to weather conditions. New delivery date: Jan 18, 2024"
}
```

---

## 🔄 Order Status Management Examples

### Example 1: Complete Order Workflow

```javascript
// 1. Order placed (automatic)
Status: "pending"

// 2. Payment confirmed (automatic for online payments)
Status: "processing"

// 3. Order shipped (manual)
PUT /api/orders/admin/65a1b2c3d4e5f6/status
{
  "status": "shipped"
}

// 4. Order delivered (manual)
PUT /api/orders/admin/65a1b2c3d4e5f6/status
{
  "status": "delivered"
}
```

### Example 2: Handle Order Cancellation

```javascript
// Customer cancels order
POST /api/orders/65a1b2c3d4e5f6/cancel
{
  "reason": "Changed mind"
}

// Admin processes refund (if online payment)
POST /api/orders/admin/65a1b2c3d4e5f6/refund
{
  "refundMethod": "original_payment",
  "refundAmount": 2500.00
}
```

### Example 3: Force Cancel Shipped Order

```javascript
// Admin force cancels shipped order (special case)
POST /api/orders/admin/65a1b2c3d4e5f6/cancel
{
  "reason": "Customer not available at address",
  "refundAmount": 2500.00,
  "forceCancel": true
}
```

---

## 📊 Bulk Operations Examples

### Example 1: Update Multiple Orders Status

```javascript
// Update all pending orders to processing
// (This would require custom implementation)

// Individual updates for each order
PUT /api/orders/admin/order1/status
{
  "status": "processing"
}

PUT /api/orders/admin/order2/status
{
  "status": "processing"
}
```

### Example 2: Export Orders for Accounting

```javascript
// Get all orders for date range
GET /api/orders/admin/all?startDate=2024-01-01&endDate=2024-01-31

// Response includes all order data for export
{
  "success": true,
  "orders": [
    {
      "_id": "65a1b2c3d4e5f6",
      "totalAmount": 2500,
      "paymentMethod": "razorpay",
      "status": "delivered",
      "createdAt": "2024-01-15T10:30:00Z",
      "deliveredAt": "2024-01-17T14:20:00Z"
    }
    // ... more orders
  ]
}
```

---

## 🛠️ API Integration Examples

### Example 1: Integrate with Accounting Software

```javascript
// Get orders for accounting export
const getOrdersForAccounting = async (startDate, endDate) => {
  const response = await fetch(`/api/orders/admin/all?startDate=${startDate}&endDate=${endDate}`);
  const data = await response.json();
  
  // Transform data for accounting software
  const accountingData = data.orders.map(order => ({
    invoiceNumber: order._id.slice(-8),
    customerName: order.user.name,
    amount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    date: order.createdAt
  }));
  
  return accountingData;
};
```

### Example 2: Integrate with Courier API

```javascript
// Create shipment with courier
const createShipment = async (orderId, courierData) => {
  // First update tracking in your system
  await fetch(`/api/orders/admin/${orderId}/tracking`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingNumber: courierData.trackingNumber,
      courierName: courierData.courierName,
      estimatedDelivery: courierData.estimatedDelivery
    })
  });
  
  // Then integrate with courier's API
  const courierResponse = await fetch('https://courier-api.com/shipments', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${COURIER_API_KEY}` },
    body: JSON.stringify(courierData)
  });
  
  return courierResponse.json();
};
```

---

## 📧 Customer Communication Examples

### Example 1: Send Order Status Update

```javascript
// When order status changes, automatically notify customer
const notifyCustomer = async (orderId, status) => {
  const order = await getOrder(orderId);
  
  const emailData = {
    to: order.user.email,
    subject: `Order #${order._id.slice(-8)} Status Update`,
    template: 'order-status-update',
    data: {
      orderNumber: order._id.slice(-8),
      status: status,
      trackingNumber: order.trackingInfo?.trackingNumber,
      estimatedDelivery: order.trackingInfo?.estimatedDelivery
    }
  };
  
  await sendEmail(emailData);
};
```

### Example 2: Send Delivery Confirmation

```javascript
// When order is marked as delivered
const sendDeliveryConfirmation = async (orderId) => {
  const order = await getOrder(orderId);
  
  const emailData = {
    to: order.user.email,
    subject: `Your Order #${order._id.slice(-8)} has been delivered!`,
    template: 'delivery-confirmation',
    data: {
      orderNumber: order._id.slice(-8),
      deliveredAt: new Date().toLocaleDateString(),
      items: order.orderItems.map(item => item.name)
    }
  };
  
  await sendEmail(emailData);
};
```

---

## 🔍 Troubleshooting Examples

### Example 1: Payment Not Confirmed

**Problem**: Order shows pending but customer says payment was made.

**Solution**:
```javascript
// 1. Check payment gateway logs
// 2. Verify payment signature
const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const crypto = require('crypto');
  const sign = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");
  
  return razorpaySignature === expectedSign;
};

// 3. Manually update if verified
if (verifyPayment(orderId, paymentId, signature)) {
  await updateOrderStatus(orderId, 'processing');
}
```

### Example 2: Tracking Not Working

**Problem**: Tracking number shows invalid in courier website.

**Solution**:
```javascript
// 1. Verify tracking number format
const validateTrackingNumber = (trackingNumber, courierName) => {
  const patterns = {
    'Delhivery': /^DEL\d{9}$/,
    'DTDC': /^DTDC\d{10}$/,
    'BlueDart': /^BLU\d{10}$/
  };
  
  return patterns[courierName]?.test(trackingNumber) || false;
};

// 2. Update with correct tracking number
if (!validateTrackingNumber(trackingNumber, courierName)) {
  // Contact courier for correct tracking number
  // Update in system
  await updateTracking(orderId, correctTrackingNumber, courierName);
}
```

---

## 📈 Performance Optimization Examples

### Example 1: Efficient Order Loading

```javascript
// Load orders with pagination and filtering
const loadOrdersEfficiently = async (page = 1, limit = 50, filters = {}) => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await fetch(`/api/orders/admin/all?${queryParams}`);
  return response.json();
};

// Usage
const orders = await loadOrdersEfficiently(1, 50, {
  status: 'pending',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Example 2: Batch Status Updates

```javascript
// Update multiple orders efficiently
const batchUpdateOrders = async (orderIds, status) => {
  const updates = orderIds.map(orderId => 
    fetch(`/api/orders/admin/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
  );
  
  await Promise.all(updates);
};
```

---

## 🎯 Best Practices Summary

### Daily Operations
1. **Check New Orders**: Review pending orders every morning
2. **Verify Payments**: Confirm all online payments
3. **Update Status**: Keep order status current
4. **Add Tracking**: Provide tracking numbers promptly
5. **Monitor Deliveries**: Track shipments daily

### Weekly Tasks
1. **Process Refunds**: Handle cancelled orders
2. **Reconcile Payments**: Match orders with payments
3. **Update Inventory**: Adjust stock levels
4. **Customer Support**: Address queries and issues
5. **Performance Review**: Check order processing metrics

### Monthly Reviews
1. **Analytics**: Review order performance
2. **Courier Performance**: Evaluate shipping partners
3. **Payment Issues**: Analyze payment problems
4. **Customer Feedback**: Review satisfaction scores
5. **System Optimization**: Identify improvement areas

---

This practical guide provides real-world examples for managing your Laiq Bags e-commerce orders effectively. Use these examples as templates and adapt them to your specific business needs.
