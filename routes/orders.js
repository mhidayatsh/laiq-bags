const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const Cart = require('../models/Cart');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const mongoose = require('mongoose');

const router = express.Router();

// Create new order => /api/orders/new
router.post('/new', isAuthenticatedUser, orderLimiter, async (req, res) => {
  try {
    console.log('📦 Creating new order for user:', req.user._id);
    console.log('📋 Order summary:', {
      itemCount: req.body.orderItems?.length || 0,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod
    });
    
    const {
      orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      saveAddress = false
    } = req.body;

    // SECURITY: Validate order amount
    if (!totalAmount || totalAmount <= 0) {
      console.error('❌ Invalid order amount:', totalAmount);
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount'
      });
    }

    // SECURITY: Validate order items
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.error('❌ Invalid order items:', orderItems);
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // SECURITY: Calculate expected total and validate
    const expectedTotal = orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    if (Math.abs(expectedTotal - totalAmount) > 0.01) { // Allow small floating point differences
      console.error('❌ Order amount mismatch:', { expected: expectedTotal, received: totalAmount });
      return res.status(400).json({
        success: false,
        message: 'Order amount validation failed'
      });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      console.error('❌ Invalid shipping address:', shippingAddress);
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping address. Please provide street, city, state, and pincode.'
      });
    }

    // Ensure shipping address has all required fields
    const validatedShippingAddress = {
      street: shippingAddress.street || 'N/A',
      city: shippingAddress.city || 'N/A',
      state: shippingAddress.state || 'N/A',
      pincode: shippingAddress.pincode || 'N/A',
      country: shippingAddress.country || 'India'
    };

    // Ensure every orderItem has a color object
    const safeOrderItems = orderItems.map(item => ({
      ...item,
      color: item.color && item.color.name && item.color.code
        ? item.color
        : { name: "N/A", code: "#000000" }
    }));

    console.log('🎨 Processed order items with colors:', safeOrderItems.length);

    // Prepare payment info based on payment method
    let paymentInfo = {
      id: paymentMethod === 'cod' ? 'COD' : 'Online',
      status: paymentMethod === 'cod' ? 'Pending' : 'Completed'
    };

    // SECURITY: Verify payment for online orders
    if (paymentMethod === 'razorpay') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        console.error('❌ Missing Razorpay payment details for online order');
        return res.status(400).json({
          success: false,
          message: 'Payment verification required for online orders'
        });
      }
      
      // Verify payment signature
      const crypto = require('crypto');
      const sign = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      if (razorpaySignature !== expectedSign) {
        console.error('❌ Invalid payment signature for order');
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      paymentInfo = {
        ...paymentInfo,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      };
      console.log('✅ Payment verified for online order');
    }

    // For COD orders, ensure user is authenticated and has valid address
    if (paymentMethod === 'cod') {
      if (!req.user || !req.user._id) {
        console.error('❌ Unauthenticated user trying to place COD order');
        return res.status(401).json({
          success: false,
          message: 'Authentication required for COD orders'
        });
      }
      console.log('✅ COD order validated for authenticated user');
    }

    // Validate stock availability before creating order (variant-aware)
    try {
      console.log('📦 Validating stock availability...');
      for (const item of safeOrderItems) {
        if (item.product && item.quantity) {
          const product = await Product.findById(item.product);
          if (!product) {
            console.error(`❌ Product not found: ${item.product}`);
            return res.status(400).json({
              success: false,
              message: `Product not found: ${item.name}`
            });
          }

          const hasVariants = Array.isArray(product.colorVariants) && product.colorVariants.length > 0;
          const colorName = item && item.color && item.color.name ? String(item.color.name).trim() : null;

          if (hasVariants) {
            if (!colorName || colorName.toLowerCase() === 'n/a') {
              console.error(`❌ Color selection required for product with variants: ${product._id}`);
              return res.status(400).json({
                success: false,
                message: `Please select a valid color for ${item.name}`
              });
            }

            const variant = product.colorVariants.find(v => (v && v.name ? v.name.toLowerCase() : '') === colorName.toLowerCase());
            if (!variant) {
              console.error(`❌ Selected color not found for product ${product._id}: ${colorName}`);
              return res.status(400).json({
                success: false,
                message: `Selected color "${colorName}" is not available for ${item.name}`
              });
            }
            if ((parseInt(variant.stock) || 0) < item.quantity) {
              console.error(`❌ Insufficient stock for ${item.name} [${colorName}] - requested ${item.quantity}, available ${variant.stock}`);
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${item.name} (${colorName}). Available: ${variant.stock}, Requested: ${item.quantity}`
              });
            }
            console.log(`✅ Stock validated for ${item.name} [${colorName}]: ${variant.stock} available, ${item.quantity} requested`);
          } else {
            if ((parseInt(product.stock) || 0) < item.quantity) {
              console.error(`❌ Insufficient stock for product ${item.product}: requested ${item.quantity}, available ${product.stock}`);
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}`
              });
            }
            console.log(`✅ Stock validated for ${item.name}: ${product.stock} available, ${item.quantity} requested`);
          }
        }
      }
      console.log('✅ All products have sufficient stock');
    } catch (stockValidationError) {
      console.error('❌ Error validating stock:', stockValidationError);
      return res.status(500).json({
        success: false,
        message: 'Error validating product stock'
      });
    }

    const order = await Order.create({
      orderItems: safeOrderItems,
      shippingInfo: validatedShippingAddress,
      paymentMethod,
      totalAmount,
      paymentInfo,
      paidAt: paymentMethod === 'cod' ? null : Date.now(),
      user: req.user._id
    });

    console.log('✅ Order created successfully:', order._id);

    // Update product stock quantities
    try {
      console.log('📦 Updating product stock quantities...');
      let stockUpdateSuccess = true;
      
      for (const item of safeOrderItems) {
        if (item.product && item.quantity) {
          try {
            await updateStock(item.product, item.quantity, (item && item.color && item.color.name) ? item.color.name : null);
            const colorLog = (item && item.color && item.color.name) ? ` [${item.color.name}]` : '';
            console.log(`✅ Stock updated for product ${item.product}${colorLog}: -${item.quantity}`);
          } catch (itemStockError) {
            console.error(`❌ Failed to update stock for product ${item.product}:`, itemStockError);
            stockUpdateSuccess = false;
            // Continue with other items but mark overall success as false
          }
        }
      }
      
      if (stockUpdateSuccess) {
        console.log('✅ All product stock quantities updated successfully');
      } else {
        console.error('⚠️ Some stock updates failed - check logs above');
        // In production, you might want to send an alert or create a retry job
      }
    } catch (stockError) {
      console.error('❌ Critical error updating product stock:', stockError);
      console.error('❌ Stock update error details:', {
        error: stockError.message,
        stack: stockError.stack,
        orderId: order._id,
        items: safeOrderItems.map(item => ({ product: item.product, quantity: item.quantity }))
      });
      // Don't fail the order if stock update fails, but log the error
      // In production, you might want to implement a retry mechanism or alert system
    }

    // Save address if requested
    if (saveAddress && req.user.role === 'user') {
      try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        
        if (user) {
          const newAddress = {
            street: validatedShippingAddress.street,
            city: validatedShippingAddress.city,
            state: validatedShippingAddress.state,
            pincode: validatedShippingAddress.pincode,
            country: validatedShippingAddress.country,
            isDefault: !user.savedAddresses || user.savedAddresses.length === 0,
            createdAt: new Date()
          };
          
          // Remove default from other addresses if this is default
          if (newAddress.isDefault && user.savedAddresses) {
            user.savedAddresses.forEach(addr => addr.isDefault = false);
          }
          
          if (!user.savedAddresses) {
            user.savedAddresses = [];
          }
          user.savedAddresses.push(newAddress);
          
          await user.save();
          console.log('📍 Address saved for user:', req.user._id);
        }
      } catch (addressError) {
        console.error('⚠️ Error saving address:', addressError);
        // Don't fail the order if address saving fails
      }
    }

    // Clear user's cart after successful order creation
    try {
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $set: { items: [] } },
        { new: true }
      );
      console.log('🧹 User cart cleared after order creation');
    } catch (cartError) {
      console.error('⚠️ Error clearing cart:', cartError);
      // Don't fail the order if cart clearing fails
    }

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
});

// Get logged in user orders => /api/orders/me
router.get('/me', isAuthenticatedUser, async (req, res) => {
  const startedAt = Date.now();
  try {
    console.log('👤 Getting orders for user:', req.user._id);
    
    if (!req.user._id) {
      console.error('❌ No user ID found in request');
      return res.status(400).json({ success: false, message: 'User ID not found' });
    }
    
    const QUERY_TIMEOUT_MS = 6000;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    console.log(`📄 Orders list params page=${page} limit=${limit}`);

    const [totalOrders, ordersRaw] = await Promise.all([
      Order.countDocuments({ user: req.user._id }),
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .select('orderItems.name orderItems.quantity orderItems.price orderItems.image totalAmount status createdAt paymentMethod shippingInfo.street shippingInfo.city shippingInfo.state shippingInfo.pincode shippingInfo.country paymentInfo.id paymentInfo.status')
        .skip(skip)
        .limit(limit)
        .maxTimeMS(QUERY_TIMEOUT_MS)
        .lean()
    ]);

    const orders = ordersRaw.map(o => ({
      ...o,
      orderItems: Array.isArray(o.orderItems)
        ? o.orderItems.slice(0, 5).map(it => ({
            name: it.name,
            quantity: it.quantity,
            price: it.price,
            image: it.image
          }))
        : []
    }));

    const totalPages = Math.max(1, Math.ceil(totalOrders / limit));

    console.log('📦 Found orders (page):', orders.length, 'of', totalOrders, 'total', `in ${Date.now() - startedAt}ms`);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      totalOrders,
      currentPage: page,
      totalPages,
      orders
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    console.error('❌ Get user orders error:', error, `after ${duration}ms`);
    const isTimeout = String(error && error.message).toLowerCase().includes('timed out') || String(error).includes('maxTimeMS');
    res.status(isTimeout ? 504 : 500).json({ success: false, message: isTimeout ? 'Orders request timed out' : 'Error getting user orders' });
  }
});

// Get all orders - Admin => /api/orders/admin/all
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach(order => {
      totalAmount += order.totalPrice;
    });

    res.status(200).json({
      success: true,
      totalAmount,
      orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting all orders'
    });
  }
});

// Get single order => /api/orders/:id
router.get('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting order'
    });
  }
});

// Update order status - Admin => /api/orders/admin/:id/status
router.put('/admin/:id/status', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('🔄 Admin updating order status:', req.params.id, 'to', req.body.status);
    console.log('📋 Request body:', req.body);
    console.log('📋 Request headers:', req.headers);
    console.log('👤 Admin user:', req.user._id);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    
    // Validate order ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('❌ Invalid order ID:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }
    
    console.log('🔍 Looking for order with ID:', req.params.id);
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.error('❌ Order not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('📦 Found order:', {
      id: order._id,
      currentStatus: order.status,
      user: order.user
    });

    const { status, notes } = req.body;
    console.log('🎯 Requested status:', status);
    console.log('🎯 Status type:', typeof status);
    console.log('📝 Notes:', notes);
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    console.log('✅ Valid statuses:', validStatuses);
    console.log('🔍 Status in valid list:', validStatuses.includes(status));
    
    if (!status) {
      console.error('❌ No status provided in request body');
      return res.status(400).json({
        success: false,
        message: 'Status is required in request body'
      });
    }
    
    if (!validStatuses.includes(status)) {
      console.error('❌ Invalid status:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid order status. Valid statuses are: ' + validStatuses.join(', ')
      });
    }

    // Check if order can be updated to delivered
    if (status === 'delivered' && order.status === 'delivered') {
      console.log('⚠️ Order already delivered');
      return res.status(400).json({
        success: false,
        message: 'Order is already delivered'
      });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;
    
    // Add status change notes if provided
    if (notes && notes.trim()) {
      if (!order.statusNotes) {
        order.statusNotes = [];
      }
      order.statusNotes.push({
        status: status,
        notes: notes.trim(),
        changedBy: 'admin',
        changedAt: Date.now()
      });
      console.log('📝 Added status notes:', notes);
    }
    
    // Initialize trackingInfo if it doesn't exist
    if (!order.trackingInfo) {
      order.trackingInfo = {};
    }
    
    // Update timestamps based on status
    if (status === 'shipped' && !order.trackingInfo.shippedAt) {
      order.trackingInfo.shippedAt = Date.now();
      console.log('📦 Order shipped at:', new Date(order.trackingInfo.shippedAt));
    }
    
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
      order.trackingInfo.deliveredAt = Date.now();
      console.log('✅ Order delivered at:', new Date(order.deliveredAt));

      // If COD, mark payment as completed on delivery
      try {
        if (order.paymentMethod === 'cod') {
          if (!order.paymentInfo) {
            order.paymentInfo = { id: 'COD', status: 'Completed' };
          } else {
            order.paymentInfo.id = order.paymentInfo.id || 'COD';
            order.paymentInfo.status = 'Completed';
          }
          if (!order.paidAt) {
            order.paidAt = Date.now();
          }
          console.log('💰 COD payment marked as Completed on delivery (orders route)');
        }
      } catch (_) {}
    }

    console.log('💾 Saving order with new status:', status);
    await order.save();

    console.log('✅ Order status updated successfully:', req.params.id, `${previousStatus} → ${status}`);

    res.status(200).json({
      success: true,
      message: `Order status updated from ${previousStatus} to ${status}`,
      order: {
        id: order._id,
        status: order.status,
        previousStatus: previousStatus
      }
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating order status'
    });
  }
});

// Delete order => /api/orders/admin/:id
router.delete('/admin/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.remove();

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
});

// Cancel order by customer => /api/orders/:id/cancel
router.post('/:id/cancel', isAuthenticatedUser, async (req, res) => {
  try {
    console.log('❌ Customer cancelling order:', req.params.id);
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders'
      });
    }
    
    // Check if order can be cancelled - Updated to include shipped status
    if (['delivered', 'cancelled', 'refunded', 'shipped'].includes(order.status)) {
      let message = `Order cannot be cancelled in ${order.status} status`;
      
      if (order.status === 'shipped') {
        message = 'Order cannot be cancelled as it has already been shipped. Please contact customer support for assistance.';
      }
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    const { reason } = req.body;
    
    // Update order status
    order.status = 'cancelled';
    order.cancellationDetails = {
      cancelledBy: 'customer',
      cancelledAt: Date.now(),
      cancellationReason: reason || 'Cancelled by customer',
      refundAmount: order.totalAmount,
      refundStatus: order.paymentMethod === 'cod' ? 'not_applicable' : 'pending',
      refundMethod: 'original_payment'
    };
    
    await order.save();
    
    // Restore product stock quantities (variant-aware)
    try {
      console.log('📦 Restoring product stock quantities...');
      for (const item of order.orderItems) {
        if (item.product && item.quantity) {
          await restoreStock(item.product, item.quantity, (item && item.color && item.color.name) ? item.color.name : null);
          const colorLog = (item && item.color && item.color.name) ? ` [${item.color.name}]` : '';
          console.log(`✅ Stock restored for product ${item.product}${colorLog}: +${item.quantity}`);
        }
      }
      console.log('✅ All product stock quantities restored successfully');
    } catch (stockError) {
      console.error('❌ Error restoring product stock:', stockError);
      // Don't fail the cancellation if stock restoration fails, but log the error
    }
    
    console.log('✅ Order cancelled by customer:', order._id);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('❌ Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
});

// Cancel order by admin => /api/orders/admin/:id/cancel
router.post('/admin/:id/cancel', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('❌ Admin cancelling order:', req.params.id);
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order can be cancelled - Admin can cancel shipped orders with special reason
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in ${order.status} status`
      });
    }
    
    const { reason, refundAmount, forceCancel } = req.body;
    
    // For shipped orders, require forceCancel flag and special reason
    if (order.status === 'shipped' && !forceCancel) {
      return res.status(400).json({
        success: false,
        message: 'Shipped orders require special authorization. Set forceCancel to true with a valid reason.'
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    order.cancellationDetails = {
      cancelledBy: 'admin',
      cancelledAt: Date.now(),
      cancellationReason: reason || 'Cancelled by admin',
      refundAmount: refundAmount || order.totalAmount,
      refundStatus: order.paymentMethod === 'cod' ? 'not_applicable' : 'pending',
      refundMethod: 'original_payment',
      forceCancelled: order.status === 'shipped' && forceCancel
    };
    
    await order.save();
    
    // Restore product stock quantities (variant-aware)
    try {
      console.log('📦 Restoring product stock quantities...');
      for (const item of order.orderItems) {
        if (item.product && item.quantity) {
          await restoreStock(item.product, item.quantity, (item && item.color && item.color.name) ? item.color.name : null);
          const colorLog = (item && item.color && item.color.name) ? ` [${item.color.name}]` : '';
          console.log(`✅ Stock restored for product ${item.product}${colorLog}: +${item.quantity}`);
        }
      }
      console.log('✅ All product stock quantities restored successfully');
    } catch (stockError) {
      console.error('❌ Error restoring product stock:', stockError);
      // Don't fail the cancellation if stock restoration fails, but log the error
    }
    
    console.log('✅ Order cancelled by admin:', order._id);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('❌ Admin cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
});

// Process refund => /api/orders/admin/:id/refund
router.post('/admin/:id/refund', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('💰 Processing refund for order:', req.params.id);
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (!['cancelled', 'returned'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled or returned orders can be refunded'
      });
    }
    
    const { refundMethod, refundAmount } = req.body;
    
    // Update refund details
    order.cancellationDetails.refundStatus = 'completed';
    order.cancellationDetails.refundMethod = refundMethod || 'original_payment';
    order.cancellationDetails.refundAmount = refundAmount || order.totalAmount;
    order.cancellationDetails.refundedAt = Date.now();
    order.status = 'refunded';
    
    await order.save();
    
    console.log('✅ Refund processed for order:', order._id);
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      order
    });
  } catch (error) {
    console.error('❌ Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund'
    });
  }
});

// Helper: evaluate after-sales eligibility for an order
async function evaluateAfterSalesEligibility(order, type) {
  try {
    // Must be delivered
    if (!order || order.status !== 'delivered' || !order.deliveredAt) {
      return { eligible: false, reason: 'Order is not delivered yet' };
    }

    const settings = await Settings.getSettings().catch(() => null);
    const defaultReturnable = settings?.returnPolicy?.returnableByDefault ?? true;
    const defaultReplaceable = settings?.returnPolicy?.replaceableByDefault ?? true;
    const defaultReturnDays = settings?.returnPolicy?.merchantReturnDays ?? 7;
    const defaultReplacementDays = settings?.returnPolicy?.merchantReplacementDays ?? 7;

    const now = Date.now();
    const daysSinceDelivery = Math.floor((now - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24));

    // Gather product policies across order items
    let overallReturnable = true;
    let overallReplaceable = true;
    let windowDaysReturn = Infinity;
    let windowDaysReplacement = Infinity;

    for (const item of order.orderItems) {
      const product = await Product.findById(item.product).lean();
      if (!product) continue;
      const policy = product.returnPolicy || {};
      const itemReturnable = (typeof policy.returnable === 'boolean') ? policy.returnable : defaultReturnable;
      const itemReplaceable = (typeof policy.replaceable === 'boolean') ? policy.replaceable : defaultReplaceable;
      const itemReturnDays = (typeof policy.returnWindowDays === 'number') ? policy.returnWindowDays : defaultReturnDays;
      const itemReplacementDays = (typeof policy.replacementWindowDays === 'number') ? policy.replacementWindowDays : defaultReplacementDays;

      overallReturnable = overallReturnable && itemReturnable;
      overallReplaceable = overallReplaceable && itemReplaceable;
      windowDaysReturn = Math.min(windowDaysReturn, itemReturnDays);
      windowDaysReplacement = Math.min(windowDaysReplacement, itemReplacementDays);
    }

    if (windowDaysReturn === Infinity) windowDaysReturn = defaultReturnDays;
    if (windowDaysReplacement === Infinity) windowDaysReplacement = defaultReplacementDays;

    const eligibleForReturn = overallReturnable && daysSinceDelivery <= windowDaysReturn;
    const eligibleForReplacement = overallReplaceable && daysSinceDelivery <= windowDaysReplacement;

    return {
      eligible: type === 'return' ? eligibleForReturn : eligibleForReplacement,
      eligibleForReturn,
      eligibleForReplacement,
      daysSinceDelivery,
      windowDaysReturn,
      windowDaysReplacement,
      remainingDaysReturn: Math.max(0, windowDaysReturn - daysSinceDelivery),
      remainingDaysReplacement: Math.max(0, windowDaysReplacement - daysSinceDelivery)
    };
  } catch (err) {
    return { eligible: false, reason: 'Eligibility check failed' };
  }
}

// Public: check after-sales eligibility => /api/orders/:id/after-sales/eligibility
router.get('/:id/after-sales/eligibility', isAuthenticatedUser, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    const resultForReturn = await evaluateAfterSalesEligibility(order, 'return');
    const resultForReplacement = await evaluateAfterSalesEligibility(order, 'replacement');

    return res.status(200).json({
      success: true,
      eligibility: {
        eligibleForReturn: resultForReturn.eligibleForReturn,
        eligibleForReplacement: resultForReplacement.eligibleForReplacement,
        daysSinceDelivery: resultForReturn.daysSinceDelivery,
        windowDaysReturn: resultForReturn.windowDaysReturn,
        windowDaysReplacement: resultForReplacement.windowDaysReplacement,
        remainingDaysReturn: resultForReturn.remainingDaysReturn,
        remainingDaysReplacement: resultForReplacement.remainingDaysReplacement
      },
      afterSales: order.afterSales || null
    });
  } catch (error) {
    console.error('Eligibility error:', error);
    res.status(500).json({ success: false, message: 'Error checking eligibility' });
  }
});

// Customer: request return or replacement => /api/orders/:id/after-sales/request
router.post('/:id/after-sales/request', isAuthenticatedUser, async (req, res) => {
  try {
    const { type, reason, items } = req.body; // items optional: [{ product, quantity, color: {name, code} }]
    if (!['return', 'replacement'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only request for your own order' });
    }
    if (order.afterSales?.requested && ['pending', 'approved'].includes(order.afterSales.status)) {
      return res.status(400).json({ success: false, message: 'After-sales request already in progress' });
    }

    const eligibility = await evaluateAfterSalesEligibility(order, type);
    if (!eligibility.eligible) {
      return res.status(400).json({ success: false, message: 'Order not eligible for this request' });
    }

    // Build items list (default to all order items)
    let requestItems = [];
    if (Array.isArray(items) && items.length > 0) {
      requestItems = items.map(i => ({
        product: i.product,
        quantity: parseInt(i.quantity) || 1,
        color: i.color && i.color.name && i.color.code ? i.color : undefined
      }));
    } else {
      requestItems = order.orderItems.map(i => ({
        product: i.product,
        quantity: i.quantity,
        color: i.color
      }));
    }

    order.afterSales = {
      requested: true,
      type,
      reason: reason || null,
      requestedAt: Date.now(),
      status: 'pending',
      adminNotes: null,
      processedAt: null,
      items: requestItems,
      refund: { method: null, amount: 0, status: null, processedAt: null }
    };

    await order.save();
    res.status(200).json({ success: true, message: 'Request submitted', order });
  } catch (error) {
    console.error('After-sales request error:', error);
    res.status(500).json({ success: false, message: 'Error submitting request' });
  }
});

// Admin: approve after-sales => /api/orders/admin/:id/after-sales/approve
router.put('/admin/:id/after-sales/approve', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.afterSales?.requested || order.afterSales.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending request to approve' });
    }
    order.afterSales.status = 'approved';
    order.afterSales.adminNotes = adminNotes || null;
    await order.save();
    res.status(200).json({ success: true, message: 'After-sales request approved', order });
  } catch (error) {
    console.error('Approve after-sales error:', error);
    res.status(500).json({ success: false, message: 'Error approving request' });
  }
});

// Admin: reject after-sales => /api/orders/admin/:id/after-sales/reject
router.put('/admin/:id/after-sales/reject', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.afterSales?.requested || order.afterSales.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending request to reject' });
    }
    order.afterSales.status = 'rejected';
    order.afterSales.adminNotes = adminNotes || null;
    order.afterSales.processedAt = Date.now();
    await order.save();
    res.status(200).json({ success: true, message: 'After-sales request rejected', order });
  } catch (error) {
    console.error('Reject after-sales error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting request' });
  }
});

// Admin: complete after-sales => /api/orders/admin/:id/after-sales/complete
router.put('/admin/:id/after-sales/complete', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { replacementItems, refund } = req.body; // replacementItems optional for type 'replacement'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.afterSales?.requested || !['approved', 'pending'].includes(order.afterSales.status)) {
      return res.status(400).json({ success: false, message: 'No approved request to complete' });
    }

    if (order.afterSales.type === 'return') {
      // Restore stock for returned items
      for (const item of order.afterSales.items || []) {
        await restoreStock(item.product, item.quantity, item?.color?.name || null);
      }
      order.status = 'returned';
      // Optionally record refund snapshot
      if (refund && typeof refund === 'object') {
        order.afterSales.refund = {
          method: refund.method || 'original_payment',
          amount: typeof refund.amount === 'number' ? refund.amount : order.totalAmount,
          status: refund.status || 'pending',
          processedAt: refund.status === 'completed' ? Date.now() : null
        };
      }
    } else if (order.afterSales.type === 'replacement') {
      // Restore original items
      for (const item of order.afterSales.items || []) {
        await restoreStock(item.product, item.quantity, item?.color?.name || null);
      }
      // Reduce stock for replacement items (fallback to original items if not provided)
      const itemsToShip = Array.isArray(replacementItems) && replacementItems.length > 0
        ? replacementItems
        : (order.afterSales.items || []);
      for (const item of itemsToShip) {
        await updateStock(item.product, item.quantity, item?.color?.name || null);
      }
      // Keep status as delivered; replacement fulfilled
    }

    order.afterSales.status = 'completed';
    order.afterSales.processedAt = Date.now();
    await order.save();
    res.status(200).json({ success: true, message: 'After-sales request completed', order });
  } catch (error) {
    console.error('Complete after-sales error:', error);
    res.status(500).json({ success: false, message: 'Error completing request' });
  }
});

// Update order tracking => /api/orders/admin/:id/tracking
router.put('/admin/:id/tracking', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('📦 Updating tracking for order:', req.params.id);
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const { trackingNumber, courierName, estimatedDelivery } = req.body;
    
    // Update tracking info
    order.trackingInfo = {
      trackingNumber: trackingNumber || order.trackingInfo.trackingNumber,
      courierName: courierName || order.trackingInfo.courierName,
      shippedAt: order.trackingInfo.shippedAt || Date.now(),
      estimatedDelivery: estimatedDelivery || order.trackingInfo.estimatedDelivery,
      deliveredAt: order.trackingInfo.deliveredAt
    };
    
    // Update order status to shipped
    if (trackingNumber && order.status === 'processing') {
      order.status = 'shipped';
    }
    
    await order.save();
    
    console.log('✅ Tracking updated for order:', order._id);
    
    res.status(200).json({
      success: true,
      message: 'Tracking information updated',
      order
    });
  } catch (error) {
    console.error('❌ Update tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tracking information'
    });
  }
});

// Add order notes => /api/orders/:id/notes
router.post('/:id/notes', isAuthenticatedUser, async (req, res) => {
  try {
    console.log('📝 Adding notes to order:', req.params.id);
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const { customerNotes, adminNotes } = req.body;
    
    // Update notes based on user role
    if (req.user.role === 'admin') {
      order.notes.adminNotes = adminNotes;
    } else {
      // Check if order belongs to user
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only add notes to your own orders'
        });
      }
      order.notes.customerNotes = customerNotes;
    }
    
    await order.save();
    
    console.log('✅ Notes added to order:', order._id);
    
    res.status(200).json({
      success: true,
      message: 'Notes added successfully',
      order
    });
  } catch (error) {
    console.error('❌ Add notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding notes'
    });
  }
});

async function updateStock(id, quantity, colorName = null) {
  try {
    console.log(`🔄 Updating stock for product ${id} by -${quantity}${colorName ? ` (color: ${colorName})` : ''}`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new Error(`Product not found with ID: ${id}`);
    }
    
    const hasVariants = Array.isArray(product.colorVariants) && product.colorVariants.length > 0;

    if (hasVariants) {
      if (!colorName || String(colorName).toLowerCase() === 'n/a') {
        throw new Error('Color name required for variant product');
      }
      const idx = product.colorVariants.findIndex(v => (v && v.name ? v.name.toLowerCase() : '') === String(colorName).toLowerCase());
      if (idx === -1) {
        throw new Error(`Color variant not found: ${colorName}`);
      }
      const variant = product.colorVariants[idx];
      const oldVariantStock = parseInt(variant.stock) || 0;
      const newVariantStock = oldVariantStock - quantity;
      if (newVariantStock < 0) {
        throw new Error(`Variant stock would become negative for ${colorName}: ${oldVariantStock} - ${quantity} = ${newVariantStock}`);
      }
      product.colorVariants[idx].stock = newVariantStock;
      if (newVariantStock === 0) {
        product.colorVariants[idx].isAvailable = false;
      }
      await product.save({ validateBeforeSave: false });
      console.log(`✅ Variant stock updated successfully for ${colorName}: ${oldVariantStock} → ${newVariantStock} (-${quantity})`);
    } else {
      const oldStock = parseInt(product.stock) || 0;
      const newStock = oldStock - quantity;
      if (newStock < 0) {
        throw new Error(`Stock would become negative: ${oldStock} - ${quantity} = ${newStock}`);
      }
      product.stock = newStock;
      await product.save({ validateBeforeSave: false });
      console.log(`✅ Stock updated successfully: ${oldStock} → ${newStock} (-${quantity})`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Stock update failed for product ${id}:`, error.message);
    throw error; // Re-throw to be handled by caller
  }
}

async function restoreStock(id, quantity, colorName = null) {
  try {
    console.log(`🔄 Restoring stock for product ${id} by +${quantity}${colorName ? ` (color: ${colorName})` : ''}`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new Error(`Product not found with ID: ${id}`);
    }
    
    const hasVariants = Array.isArray(product.colorVariants) && product.colorVariants.length > 0;

    if (hasVariants) {
      if (!colorName || String(colorName).toLowerCase() === 'n/a') {
        // If color is unknown for a variant-based product, restore to the first variant to keep totals consistent
        const idx = 0;
        const oldVariantStock = parseInt(product.colorVariants[idx].stock) || 0;
        const newVariantStock = oldVariantStock + quantity;
        product.colorVariants[idx].stock = newVariantStock;
        if (newVariantStock > 0) {
          product.colorVariants[idx].isAvailable = true;
        }
        await product.save({ validateBeforeSave: false });
        console.log(`✅ Variant stock restored to first variant (${product.colorVariants[idx].name}): ${oldVariantStock} → ${newVariantStock} (+${quantity})`);
      } else {
        const idx = product.colorVariants.findIndex(v => (v && v.name ? v.name.toLowerCase() : '') === String(colorName).toLowerCase());
        if (idx === -1) {
          // If specified color not found, restore to first variant as fallback
          const oldVariantStock = parseInt(product.colorVariants[0].stock) || 0;
          const newVariantStock = oldVariantStock + quantity;
          product.colorVariants[0].stock = newVariantStock;
          if (newVariantStock > 0) {
            product.colorVariants[0].isAvailable = true;
          }
          await product.save({ validateBeforeSave: false });
          console.warn(`⚠️ Color variant not found (${colorName}). Restored stock to first variant (${product.colorVariants[0].name}).`);
        } else {
          const oldVariantStock = parseInt(product.colorVariants[idx].stock) || 0;
          const newVariantStock = oldVariantStock + quantity;
          product.colorVariants[idx].stock = newVariantStock;
          if (newVariantStock > 0) {
            product.colorVariants[idx].isAvailable = true;
          }
          await product.save({ validateBeforeSave: false });
          console.log(`✅ Variant stock restored successfully for ${product.colorVariants[idx].name}: ${oldVariantStock} → ${newVariantStock} (+${quantity})`);
        }
      }
    } else {
      const oldStock = parseInt(product.stock) || 0;
      const newStock = oldStock + quantity;
      product.stock = newStock;
      await product.save({ validateBeforeSave: false });
      console.log(`✅ Stock restored successfully: ${oldStock} → ${newStock} (+${quantity})`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Stock restoration failed for product ${id}:`, error.message);
    throw error; // Re-throw to be handled by caller
  }
}

module.exports = router; 