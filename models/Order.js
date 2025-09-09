const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Color information for the ordered item
  color: {
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    }
  }
});

const shippingInfoSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'India'
  }
}, { _id: false });

// Contact info for the order (snapshot at time of purchase)
const contactInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  }
}, { _id: false });

const paymentInfoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  // Razorpay specific fields
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  // Stripe specific fields
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  stripeChargeId: {
    type: String,
    default: null
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  contactInfo: contactInfoSchema,
  shippingInfo: shippingInfoSchema,
  orderItems: [orderItemSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'razorpay', 'stripe'],
    default: 'cod'
  },
  paymentInfo: paymentInfoSchema,
  paidAt: {
    type: Date,
    default: null
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0.0
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: {
      values: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
        'returned'
      ],
      message: 'Please select correct order status'
    }
  },
  // Order cancellation details
  cancellationDetails: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', null],
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed', 'failed', 'not_applicable'],
      default: 'pending'
    },
    refundMethod: {
      type: String,
      enum: ['original_payment', 'wallet', 'bank_transfer'],
      default: 'original_payment'
    },
    refundedAt: {
      type: Date,
      default: null
    }
  },
  // Order tracking
  trackingInfo: {
    trackingNumber: {
      type: String,
      default: null
    },
    courierName: {
      type: String,
      default: null
    },
    shippedAt: {
      type: Date,
      default: null
    },
    estimatedDelivery: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    }
  },
  // Order notes
  notes: {
    customerNotes: {
      type: String,
      default: null
    },
    adminNotes: {
      type: String,
      default: null
    }
  },
  // After-sales: return/replacement requests
  afterSales: {
    requested: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: [null, 'return', 'replacement'],
      default: null
    },
    reason: {
      type: String,
      default: null
    },
    requestedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: [null, 'pending', 'approved', 'rejected', 'completed'],
      default: null
    },
    adminNotes: {
      type: String,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    },
    // For replacements: which items/variants
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 },
      color: {
        name: String,
        code: String
      }
    }],
    // For returns: refund info snapshot
    refund: {
      method: {
        type: String,
        enum: [null, 'original_payment', 'wallet', 'bank_transfer'],
        default: null
      },
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: [null, 'pending', 'completed', 'failed'],
        default: null
      },
      processedAt: { type: Date, default: null }
    }
  },
  // Status change history
  statusNotes: [{
    status: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      required: true
    },
    changedBy: {
      type: String,
      enum: ['customer', 'admin'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better performance
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ totalAmount: 1 });
orderSchema.index({ 'orderItems.product': 1 });

// Calculate total price
orderSchema.methods.calculateTotalPrice = function() {
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice - this.discountAmount;
};

module.exports = mongoose.model('Order', orderSchema); 