const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Review = require('../models/review');
const Product = require('../models/Product');

// Validate ObjectId middleware
const validateObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid review ID format'
        });
    }
    next();
};

// Create new review => /api/review/new
router.post('/new', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    console.log('➕ Create review request:', {
        body: req.body,
        user: req.user._id
    });

    const { rating, title, comment, productId } = req.body;

    // Validate required fields
    if (!rating || !title || !comment || !productId) {
        console.log('❌ Missing required fields:', { rating, title, comment, productId });
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: rating, title, comment, productId'
        });
    }

    // Validate rating range
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        console.log('❌ Invalid rating:', rating);
        return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
        });
    }

    // Validate title length
    if (title.trim().length < 3 || title.trim().length > 100) {
        console.log('❌ Invalid title length:', title.length);
        return res.status(400).json({
            success: false,
            message: 'Title must be between 3 and 100 characters'
        });
    }

    // Validate comment length
    if (comment.trim().length < 10 || comment.trim().length > 500) {
        console.log('❌ Invalid comment length:', comment.length);
        return res.status(400).json({
            success: false,
            message: 'Comment must be between 10 and 500 characters'
        });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.log('❌ Invalid product ID:', productId);
        return res.status(400).json({
            success: false,
            message: 'Invalid product ID format'
        });
    }

    const review = {
        user: req.user._id,
        product: productId,
        rating: ratingNum,
        title: title.trim(),
        comment: comment.trim()
    };

    console.log('🔍 Looking for product:', productId);
    const product = await Product.findById(productId);
    if (!product) {
        console.log('❌ Product not found:', productId);
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
        user: req.user._id,
        product: productId
    });

    if (existingReview) {
        console.log('❌ User already reviewed this product');
        return res.status(400).json({
            success: false,
            message: 'You have already reviewed this product'
        });
    }

    console.log('✅ Creating new review:', review);
    const newReview = await Review.create(review);

    res.status(201).json({
        success: true,
        review: newReview
    });
}));

// Get product reviews => /api/review/:productId
router.get('/:productId', catchAsyncErrors(async (req, res) => {
    const { productId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product ID format'
        });
    }

    const reviews = await Review.find({ product: productId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        reviews
    });
}));

// Get single review => /api/review/single/:id
router.get('/single/:id', validateObjectId, catchAsyncErrors(async (req, res) => {
    const review = await Review.findById(req.params.id)
        .populate('user', 'name avatar')
        .populate('product', 'name images');

    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    res.status(200).json({
        success: true,
        review
    });
}));

// Update review => /api/review/:id
router.put('/:id', validateObjectId, isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    console.log('🔄 Update review request:', {
        reviewId: req.params.id,
        body: req.body,
        user: req.user._id
    });

    const { rating, title, comment } = req.body;

    // Validate required fields
    if (!rating || !title || !comment) {
        console.log('❌ Missing required fields:', { rating, title, comment });
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: rating, title, comment'
        });
    }

    // Validate rating range
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        console.log('❌ Invalid rating:', rating);
        return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
        });
    }

    // Validate title length
    if (title.trim().length < 3 || title.trim().length > 100) {
        console.log('❌ Invalid title length:', title.length);
        return res.status(400).json({
            success: false,
            message: 'Title must be between 3 and 100 characters'
        });
    }

    // Validate comment length
    if (comment.trim().length < 10 || comment.trim().length > 500) {
        console.log('❌ Invalid comment length:', comment.length);
        return res.status(400).json({
            success: false,
            message: 'Comment must be between 10 and 500 characters'
        });
    }

    const review = await Review.findById(req.params.id);
    console.log('🔍 Found review:', review ? 'Yes' : 'No');

    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
        console.log('❌ User ownership check failed:', {
            reviewUser: review.user.toString(),
            currentUser: req.user._id.toString()
        });
        return res.status(403).json({
            success: false,
            message: 'You can only update your own reviews'
        });
    }

    review.rating = ratingNum;
    review.title = title.trim();
    review.comment = comment.trim();

    await review.save();
    console.log('✅ Review updated successfully');

    res.status(200).json({
        success: true,
        review
    });
}));

// Delete review => /api/review/:id
router.delete('/:id', validateObjectId, isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'You can only delete your own reviews'
        });
    }

    await review.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
    });
}));

// Mark review as helpful => /api/review/:id/helpful
router.post('/:id/helpful', validateObjectId, isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    const existingHelpful = review.helpful.find(
        h => h.user.toString() === req.user._id.toString()
    );

    if (existingHelpful) {
        // Remove helpful vote
        review.helpful = review.helpful.filter(
            h => h.user.toString() !== req.user._id.toString()
        );
    } else {
        // Add helpful vote
        review.helpful.push({
            user: req.user._id,
            helpful: true
        });
    }

    await review.save();

    res.status(200).json({
        success: true,
        helpfulCount: review.helpful.length,
        isHelpful: !existingHelpful
    });
}));

// Get all reviews (Admin) => /api/review/admin/all
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), catchAsyncErrors(async (req, res) => {
    const reviews = await Review.find()
        .populate('user', 'name email')
        .populate('product', 'name images')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        reviews
    });
}));

// Verify review (Admin) => /api/review/admin/:id/verify
router.put('/admin/:id/verify', validateObjectId, isAuthenticatedUser, authorizeRoles('admin'), catchAsyncErrors(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        });
    }

    review.verified = !review.verified;
    await review.save();

    res.status(200).json({
        success: true,
        review
    });
}));

module.exports = router; 