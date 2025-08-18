const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { isAuthenticatedUser } = require('../middleware/auth');

const router = express.Router();

// Get user profile => /api/users/profile
router.get('/profile', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting profile'
    });
  }
});

// Update user profile => /api/users/profile/update
router.put('/profile/update', isAuthenticatedUser, async (req, res) => {
  try {
    const newUserData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Get user wishlist => /api/users/wishlist
router.get('/wishlist', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');

    res.status(200).json({
      success: true,
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting wishlist'
    });
  }
});

// Add to wishlist => /api/users/wishlist/add
router.post('/wishlist/add', isAuthenticatedUser, async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if product already in wishlist
    const isInWishlist = user.wishlist.includes(productId);
    if (isInWishlist) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist'
    });
  }
});

// Remove from wishlist => /api/users/wishlist/remove
router.delete('/wishlist/remove', isAuthenticatedUser, async (req, res) => {
  try {
    const { productId } = req.query;

    const user = await User.findById(req.user.id);

    // Remove product from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist'
    });
  }
});

// Clear wishlist => /api/users/wishlist/clear
router.delete('/wishlist/clear', isAuthenticatedUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.wishlist = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared'
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing wishlist'
    });
  }
});

module.exports = router; 