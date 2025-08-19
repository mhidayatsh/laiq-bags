const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { isAuthenticatedUser } = require('../middleware/auth');
const { cartLimiter } = require('../middleware/rateLimiter');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const mongoose = require('mongoose');

// Helper to sanitize potentially large/base64 image URLs
function getSafeImageUrl(rawUrl) {
    try {
        if (!rawUrl || typeof rawUrl !== 'string') return '/assets/thumbnail.jpg';
        const prefix = rawUrl.substring(0, 10);
        if (rawUrl.startsWith('data:image') || rawUrl.startsWith('H4sI')) {
            return '/assets/thumbnail.jpg';
        }
        return rawUrl;
    } catch (_) {
        return '/assets/thumbnail.jpg';
    }
}

// Get user cart
router.get('/me', isAuthenticatedUser, cartLimiter, catchAsyncErrors(async (req, res) => {
    const startedAt = Date.now();
    const TIMEOUT_MS = 6000; // Keep server timeout below client (8s) to avoid client aborts

    try {
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ MongoDB not connected, readyState:', mongoose.connection.readyState);
            return res.status(503).json({
                success: false,
                message: 'Database temporarily unavailable. Please try again in a moment.'
            });
        }
        
        // Use simple find with projection for faster response
        const cart = await Cart.findOne({ user: req.user.id })
            .select('items updatedAt')
            .lean()
            .maxTimeMS(TIMEOUT_MS);

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                cart: { items: [], totalAmount: 0, itemCount: 0 }
            });
        }
        
        const validatedItems = cart.items.map(item => ({
            ...item,
            productId: item.product,
            name: item.name || 'Product',
            price: parseFloat(item.price) || 0,
            image: getSafeImageUrl(item.image),
            quantity: parseInt(item.quantity) || 1,
            color: item.color || null
        }));

        const totalAmount = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validatedItems.reduce((sum, item) => sum + item.quantity, 0);

        const duration = Date.now() - startedAt;
        console.log(`🛒 Cart loaded in ${duration}ms with ${validatedItems.length} items`);
        
        res.status(200).json({
            success: true,
            cart: {
                items: validatedItems,
                totalAmount,
                itemCount
            }
        });
    } catch (error) {
        const duration = Date.now() - startedAt;
        console.error('Get cart error:', error, `after ${duration}ms`);
        
        let errorMessage = 'Error fetching cart';
        let statusCode = 500;
        
        if (error.name === 'MongoTimeoutError' || error.code === 50) {
            errorMessage = 'Cart request timed out';
            statusCode = 504;
        }
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

// Add item to cart
router.post('/add', isAuthenticatedUser, cartLimiter, catchAsyncErrors(async (req, res) => {
    try {
        const { productId, quantity = 1, color } = req.body;
        
        console.log('🛒 Add to cart request:', { productId, quantity, color, userId: req.user.id });
        
        if (!productId) {
            console.log('❌ No product ID provided');
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        if (quantity <= 0) {
            console.log('❌ Invalid quantity:', quantity);
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }
        
        // Validate productId
        if (!productId || productId === 'unknown' || productId === 'undefined' || productId === 'null') {
            console.log('❌ Invalid productId:', productId);
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID. Please refresh the page and try again.'
            });
        }
        
        // Check if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log('❌ Invalid ObjectId format:', productId);
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format. Please refresh the page and try again.'
            });
        }
        
        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            console.log('❌ Product not found:', productId);
            return res.status(404).json({
                success: false,
                message: 'Product not found. It may have been removed.'
            });
        }
        
        console.log('✅ Product found:', product.name);
        console.log('🎨 Product color variants:', product.colorVariants);
        
        // Validate color if provided
        let selectedColor = null;
        if (color) {
            console.log('🎨 Validating color:', color);
            const colorVariant = product.colorVariants?.find(c => 
                c.name === color.name || c.code === color.code
            );
            if (!colorVariant) {
                console.log('⚠️ Color not found in product variants, using default');
                // Instead of failing, use default color
                if (product.colorVariants && product.colorVariants.length > 0) {
                    selectedColor = {
                        name: product.colorVariants[0].name,
                        code: product.colorVariants[0].code
                    };
                    console.log('🎨 Using default color instead:', selectedColor);
                } else {
                    selectedColor = { name: 'Default', code: '#000000' };
                    console.log('🎨 Using fallback color:', selectedColor);
                }
            } else {
                selectedColor = {
                    name: colorVariant.name,
                    code: colorVariant.code
                };
                console.log('✅ Color validated:', selectedColor);
            }
        } else {
            // Always use first available color if none specified
            if (product.colorVariants && product.colorVariants.length > 0) {
                selectedColor = {
                    name: product.colorVariants[0].name,
                    code: product.colorVariants[0].code
                };
                console.log('🎨 Using default color:', selectedColor);
            } else {
                selectedColor = { name: 'Default', code: '#000000' };
                console.log('🎨 Using fallback color:', selectedColor);
            }
        }
        
        // Calculate final price with discount (real-time validation)
        let finalPrice = product.price;
        if (product.discount > 0) {
          const now = new Date();
          let isActive = true;
          
          // Check start date
          if (product.discountStartDate && now < new Date(product.discountStartDate)) {
            isActive = false;
          }
          // Check end date
          else if (product.discountEndDate && now > new Date(product.discountEndDate)) {
            isActive = false;
          }
          
          if (isActive) {
            finalPrice = product.price * (1 - product.discount / 100);
          }
        }
        
        console.log('💰 Price calculation:', {
            originalPrice: product.price,
            discount: product.discount,
            isDiscountActive: product.isDiscountActive,
            finalPrice: finalPrice
        });
        
        // Use atomic operation to add item to cart
        const cartItem = {
            product: productId,
            quantity,
            price: finalPrice,
            name: product.name,
            image: getSafeImageUrl((product.images && product.images.length > 0 ? product.images[0].url : product.image)),
            color: selectedColor || { name: 'Default', code: '#000000' }
        };
        
        // Try atomic update first - check for existing item with same productId AND color
        let cart = await Cart.findOneAndUpdate(
            { 
                user: req.user.id,
                'items': {
                    $elemMatch: {
                        'product': productId,
                        'color.name': selectedColor?.name || 'Default'
                    }
                }
            },
            { 
                $inc: { 'items.$.quantity': quantity },
                $set: { updatedAt: Date.now() }
            },
            { new: true, upsert: false }
        );
        
        if (!cart) {
            // If no existing item found, add new item
            cart = await Cart.findOneAndUpdate(
                { user: req.user.id },
                { 
                    $push: { items: cartItem },
                    $set: { updatedAt: Date.now() }
                },
                { new: true, upsert: true }
            );
        }
        
        console.log('✅ Item added to cart successfully');
        
        // Re-fetch cart with minimal payload (no populate) and return validated response
        const freshCart = await Cart.findById(cart._id).select('items').lean();
        
        // Ensure all cart items have proper data (use stored snapshot values)
        const validatedItems = (freshCart.items || []).map(item => {
            const itemPrice = parseFloat(item.price) || 0;
            console.log('🛒 Cart item price:', {
                itemName: item.name,
                storedPrice: item.price,
                parsedPrice: itemPrice,
                productOriginalPrice: undefined
            });
            return {
                product: item.product,
                productId: item.product,
                name: item.name || 'Unknown Product',
                price: itemPrice,
                quantity: parseInt(item.quantity) || 1,
                image: getSafeImageUrl(item.image),
                color: item.color || null
            };
        });
        
        const totalAmount = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cart: {
                items: validatedItems,
                totalAmount,
                itemCount
            }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart'
        });
    }
}));

// Update cart item quantity
router.put('/update/:productId', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const { color } = req.query;
        
        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required'
            });
        }
        
        let updatedCart;
        
        if (quantity === 0) {
            // Remove item if quantity is 0, respect color when provided
            const pullFilter = color ? { product: productId, 'color.name': color } : { product: productId };
            updatedCart = await Cart.findOneAndUpdate(
                { user: req.user.id },
                { 
                    $pull: { items: pullFilter },
                    $set: { updatedAt: Date.now() }
                },
                { new: true }
            );
        } else if (color) {
            // Update specific color variant using arrayFilters
            updatedCart = await Cart.findOneAndUpdate(
                { user: req.user.id },
                { 
                    $set: { 'items.$[elem].quantity': quantity, updatedAt: Date.now() }
                },
                { 
                    new: true,
                    arrayFilters: [ { 'elem.product': new mongoose.Types.ObjectId(productId), 'elem.color.name': color } ]
                }
            );
        } else {
            // Fallback: update by product only (single-variant items)
            updatedCart = await Cart.findOneAndUpdate(
                { 
                    user: req.user.id,
                    'items.product': productId 
                },
                { 
                    $set: { 
                        'items.$.quantity': quantity,
                        updatedAt: Date.now()
                    }
                },
                { new: true }
            );
        }
        
        if (!updatedCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart or item not found'
            });
        }
        
        // Re-fetch minimal cart (no populate) for response
        const freshCart = await Cart.findById(updatedCart._id).select('items').lean();
        const items = (freshCart.items || []).map(item => ({
            product: item.product,
            productId: item.product,
            name: item.name || 'Unknown Product',
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            image: getSafeImageUrl(item.image),
            color: item.color || null
        }));
        const totalAmount = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
        
        res.status(200).json({ success: true, message: 'Cart updated', cart: { items, totalAmount, itemCount } });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart'
        });
    }
}));

// Remove item from cart
router.delete('/remove/:productId', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    try {
        const { productId } = req.params;
        const { color } = req.query; // Get color from query parameters
        
        console.log('🗑️ Removing item from cart:', { productId, color });
        
        let updateQuery = { 
            user: req.user.id,
            'items.product': productId 
        };
        
        // If color is specified, also match the color
        if (color) {
            updateQuery['items.color.name'] = color;
        }
        
        const updatedCart = await Cart.findOneAndUpdate(
            updateQuery,
            { 
                $pull: { 
                    items: color ? 
                        { product: productId, 'color.name': color } : 
                        { product: productId }
                },
                $set: { updatedAt: Date.now() }
            },
            { new: true }
        );
        
        if (!updatedCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart or item not found'
            });
        }
        
        // Re-fetch minimal cart (no populate) for response
        const freshCart = await Cart.findById(updatedCart._id).select('items').lean();
        const items = (freshCart.items || []).map(item => ({
            product: item.product,
            productId: item.product,
            name: item.name || 'Unknown Product',
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            image: getSafeImageUrl(item.image),
            color: item.color || null
        }));
        const totalAmount = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
        
        res.status(200).json({ success: true, message: 'Item removed from cart', cart: { items, totalAmount, itemCount } });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart'
        });
    }
}));

// Clear cart
router.delete('/clear', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { user: req.user.id },
            { 
                $set: { 
                    items: [],
                    updatedAt: Date.now()
                }
            },
            { new: true }
        );
        
        if (!updatedCart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            cart: {
                items: [],
                totalAmount: 0,
                itemCount: 0
            }
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart'
        });
    }
}));

module.exports = router; 