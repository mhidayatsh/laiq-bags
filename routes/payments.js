const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const { orderLimiter } = require('../middleware/rateLimiter');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with proper error handling
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
} catch (error) {
    console.error('❌ Razorpay initialization failed:', error);
    razorpay = null;
}

// Create Stripe payment intent
router.post('/stripe/create-payment-intent', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    try {
        const { amount } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: 'inr',
            metadata: {
                integration_check: 'accept_a_payment'
            }
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment intent'
        });
    }
}));

// Create Razorpay order
router.post('/razorpay/create-order', isAuthenticatedUser, orderLimiter, catchAsyncErrors(async (req, res) => {
    try {
        // Check if Razorpay is initialized
        if (!razorpay) {
            console.error('❌ Razorpay not initialized');
            return res.status(500).json({
                success: false,
                message: 'Payment service not available'
            });
        }

        const { amount, currency = 'INR' } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Validate amount range (minimum 1 INR, maximum 100000 INR)
        if (amount < 1 || amount > 100000) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be between ₹1 and ₹1,00,000'
            });
        }

        console.log('💳 Creating Razorpay order for amount:', amount);

        // Generate a shorter receipt ID (max 40 characters)
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const userId = req.user._id.toString().slice(-6); // Last 6 characters
        const receipt = `ord_${timestamp}_${userId}`; // Format: ord_12345678_123456 (max 25 chars)

        const options = {
            amount: Math.round(amount * 100), // Convert to paise and ensure integer
            currency: currency,
            receipt: receipt
        };

        console.log('📋 Razorpay options:', options);

        const order = await razorpay.orders.create(options);

        console.log('✅ Razorpay order created:', order.id);

        res.status(200).json({
            success: true,
            order: order,
            razorpayKey: process.env.RAZORPAY_KEY_ID // Send public key to frontend
        });
    } catch (error) {
        console.error('❌ Razorpay order creation error:', error);
        
        // Handle specific Razorpay errors
        if (error.error) {
            console.error('❌ Razorpay API error:', error.error);
            return res.status(400).json({
                success: false,
                message: error.error.description || 'Payment service error'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating payment order'
        });
    }
}));

// Verify Razorpay payment
router.post('/razorpay/verify', isAuthenticatedUser, orderLimiter, catchAsyncErrors(async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error('❌ Missing payment verification data:', { 
                razorpay_order_id: razorpay_order_id ? 'present' : 'missing', 
                razorpay_payment_id: razorpay_payment_id ? 'present' : 'missing', 
                razorpay_signature: razorpay_signature ? 'present' : 'missing' 
            });
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification data'
            });
        }

        console.log('🔐 Verifying Razorpay payment:', { 
            order_id: razorpay_order_id, 
            payment_id: razorpay_payment_id 
        });

        // Verify with Razorpay API first
        try {
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
            console.log('📋 Payment details from Razorpay:', {
                id: payment.id,
                status: payment.status,
                method: payment.method,
                amount: payment.amount,
                currency: payment.currency
            });
            
            if (payment.status !== 'captured') {
                console.error('❌ Payment not captured:', payment.status);
                return res.status(400).json({
                    success: false,
                    message: 'Payment not completed'
                });
            }
        } catch (apiError) {
            console.error('❌ Razorpay API error:', apiError);
            return res.status(400).json({
                success: false,
                message: 'Invalid payment ID'
            });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        console.log('🔍 Signature comparison:', {
            received: razorpay_signature,
            expected: expectedSign,
            match: razorpay_signature === expectedSign
        });

        if (razorpay_signature === expectedSign) {
            console.log('✅ Payment verification successful');
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully'
            });
        } else {
            console.error('❌ Payment verification failed - signature mismatch');
            res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
    } catch (error) {
        console.error('❌ Razorpay verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment'
        });
    }
}));

module.exports = router; 