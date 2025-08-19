const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { isAuthenticatedUser } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Get user wishlist
router.get('/', isAuthenticatedUser, async (req, res) => {
    const startedAt = Date.now();
    const TIMEOUT_MS = 25000; // Increased to 25 seconds

    try {
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️ MongoDB not connected, returning error');
            return res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable',
            });
        }

        console.log(`🔍 Starting wishlist query for user: ${req.user.id}`);
        
        const userWithWishlist = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'wishlist',
                    foreignField: '_id',
                    as: 'wishlistDetails',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                price: 1,
                                discount: 1,
                                isDiscountActive: 1,
                                discountType: 1,
                                discountAmount: 1,
                                images: 1,
                                createdAt: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    wishlist: '$wishlistDetails',
                }
            }
        ]).option({ maxTimeMS: TIMEOUT_MS });

        if (!userWithWishlist || userWithWishlist.length === 0) {
            console.log(`✅ User found but has an empty wishlist or no wishlist document.`);
            return res.status(200).json({
                success: true,
                wishlist: [],
                count: 0,
                message: 'Wishlist is empty'
            });
        }
        
        const wishlist = userWithWishlist[0].wishlist;
        
        // Decompress H4sI URLs in wishlist images
        const decompressedWishlist = wishlist.map(product => {
            if (product.images && Array.isArray(product.images)) {
                const decompressedImages = product.images.map(image => {
                    if (image.url && image.url.startsWith('H4sI')) {
                        try {
                            const zlib = require('zlib');
                            const buffer = Buffer.from(image.url, 'base64');
                            const decompressed = zlib.gunzipSync(buffer);
                            return {
                                ...image,
                                url: `data:image/jpeg;base64,${decompressed.toString('base64')}`
                            };
                        } catch (error) {
                            console.error('Error decompressing image URL:', error);
                            return image;
                        }
                    }
                    return image;
                });
                return { ...product, images: decompressedImages };
            }
            return product;
        });
        
        const duration = Date.now() - startedAt;
        console.log(`✅ Wishlist loaded in ${duration}ms: ${wishlist.length} items`);

        res.status(200).json({
            success: true,
            wishlist: decompressedWishlist,
            count: wishlist.length,
            message: 'Wishlist retrieved successfully'
        });

    } catch (error) {
        const duration = Date.now() - startedAt;
        console.error('Get wishlist error:', error, `after ${duration}ms`);
        
        let errorMessage = 'Error fetching wishlist';
        let statusCode = 500;
        
        if (error.name === 'MongoTimeoutError' || error.code === 50) {
            errorMessage = 'Wishlist request timed out';
            statusCode = 504;
        }
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add to wishlist => /api/wishlist/add
router.post('/add', isAuthenticatedUser, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is already in wishlist
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (existingUser.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add to wishlist using findOneAndUpdate
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $addToSet: { wishlist: productId } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: updatedUser.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist'
    });
  }
});

// Remove from wishlist => /api/wishlist/remove
router.delete('/remove', isAuthenticatedUser, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Use findOneAndUpdate to avoid version conflicts
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $pull: { wishlist: productId } },
      { new: true, runValidators: false }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: updatedUser.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist'
    });
  }
});

// Merge guest wishlist
router.post('/merge', isAuthenticatedUser, async (req, res) => {
    try {
        const { guestWishlist } = req.body;

        if (!guestWishlist || !Array.isArray(guestWishlist) || guestWishlist.length === 0) {
            return res.status(200).json({ success: true, message: 'No guest wishlist to merge.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { wishlist: { $each: guestWishlist } } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Guest wishlist merged successfully.',
            wishlist: updatedUser.wishlist
        });

    } catch (error) {
        console.error('Error merging guest wishlist:', error);
        res.status(500).json({ success: false, message: 'Server error during wishlist merge.' });
    }
});

module.exports = router; 