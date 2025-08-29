const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Settings = require('../models/Settings');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const jwt = require('jsonwebtoken');
const zlib = require('zlib');
const { normalizeImageUrlForProduct } = require('../utils/imageOptimizer');
const { uploadImage, configureCloudinary } = require('../utils/cloudinary');

// Verify Cart model is properly loaded
console.log('🔍 Cart model loaded:', typeof Cart);
console.log('🔍 Cart.findOne available:', typeof Cart.findOne);

// Custom admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Login first to access this resource'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token or authentication failed'
    });
  }
};

// Admin middleware - only admin can access
const adminOnly = authorizeRoles('admin');

// Get admin dashboard stats
router.get('/dashboard', adminAuth, catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔍 Dashboard request received');
        
        // Use Promise.all for parallel execution
        const [
            totalProducts,
            totalOrders,
            totalCustomers,
            recentOrders,
            revenueData
        ] = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            User.countDocuments({ role: 'user' }),
            Order.find()
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Order.aggregate([
                { $match: { status: { $in: ['delivered', 'shipped'] } } },
                { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
            ])
        ]);
        
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
        
        // Get top products with limit
        const topProducts = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.product',
                    totalSold: { $sum: '$orderItems.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        
        const response = {
            success: true,
            data: {
                totalProducts,
                totalOrders,
                totalRevenue,
                totalCustomers,
                recentOrders,
                topProducts
            }
        };
        
        console.log('✅ Dashboard response prepared');
        res.status(200).json(response);
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
}));

// Test route to verify admin routes are working
router.get('/test', (req, res) => {
    console.log('🧪 Admin test route hit!');
    res.json({ success: true, message: 'Admin routes working', timestamp: new Date().toISOString() });
});

// Get all products (admin)
router.get('/products', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔍 Admin products request:', { query: req.query, user: req.user.email });
        console.log('🔍 Request URL:', req.originalUrl);
        console.log('🔍 Request path:', req.path);
        console.log('🔍 Request baseUrl:', req.baseUrl);
        // Use a lightweight projection and server-side pagination to avoid huge payloads
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        console.log('📊 Pagination params:', { page, limit, skip });

        const baseQuery = Product.find({}, {
            name: 1, price: 1, category: 1, type: 1, material: 1, size: 1, description: 1,
            stock: 1, images: { $slice: 1 }, // send only first image
            colorVariants: 1, specifications: 1,
            featured: 1, bestSeller: 1, newArrival: 1, createdAt: 1,
            discountInfo: 1, discount: 1, discountEndDate: 1, isDiscountActive: 1, discountType: 1, discountStartDate: 1
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(10000); // 10 second timeout for admin queries

        const [products, totalProducts] = await Promise.all([
            baseQuery,
            Product.estimatedDocumentCount()
        ]);

        // Helper to decompress if compressed (H4sI...)
        const decompressIfNeeded = (value) => {
            try {
                if (!value || typeof value !== 'string' || !value.startsWith('H4sI')) return value;
                const buffer = Buffer.from(value, 'base64');
                const decompressed = zlib.gunzipSync(buffer);
                return `data:image/jpeg;base64,${decompressed.toString('base64')}`;
            } catch (_) {
                return value;
            }
        };

        const productsWithCalculatedStock = products.map(product => {
            let totalStock = 0;
            if (product.colorVariants && Array.isArray(product.colorVariants)) {
                totalStock = product.colorVariants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
            } else {
                totalStock = product.stock || 0;
            }
            
            // Limit description length to prevent large responses
            const limitedDescription = product.description && product.description.length > 200 
                ? product.description.substring(0, 200) + '...' 
                : product.description;
            
            // Decompress images if needed
            const decompressedImages = product.images ? product.images.map(img => ({
                ...img,
                url: decompressIfNeeded(img.url)
            })) : [];
            
            return { 
                ...product, 
                description: limitedDescription,
                calculatedStock: totalStock,
                images: decompressedImages
            };
        });
        
        // Debug: Log description for first product only to reduce console spam
        if (productsWithCalculatedStock.length > 0) {
            const firstProduct = productsWithCalculatedStock[0];
            console.log(`📝 Product "${firstProduct.name}" description:`, firstProduct.description);
            console.log(`📝 Product "${firstProduct.name}" has description field:`, 'description' in firstProduct);
        }

        const response = {
            success: true,
            count: productsWithCalculatedStock.length,
            totalProducts,
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
            products: productsWithCalculatedStock.map(product => ({
                _id: product._id,
                name: product.name,
                price: product.price,
                category: product.category,
                type: product.type,
                material: product.material,
                size: product.size,
                description: product.description,
                calculatedStock: product.calculatedStock,
                images: product.images,
                colorVariants: product.colorVariants,
                specifications: product.specifications,
                featured: product.featured,
                bestSeller: product.bestSeller,
                newArrival: product.newArrival,
                createdAt: product.createdAt,
                // Include discount fields
                discount: product.discount,
                discountType: product.discountType,
                discountStartDate: product.discountStartDate,
                discountEndDate: product.discountEndDate,
                isDiscountActive: product.isDiscountActive,
                discountInfo: product.discountInfo
            }))
        };
        console.log('✅ Admin products response:', { 
            count: response.count, 
            totalProducts: response.totalProducts,
            currentPage: response.currentPage,
            totalPages: response.totalPages,
            responseSize: JSON.stringify(response).length
        });
        res.status(200).json(response);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
}));

// Create new product (admin)
router.post('/products', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        console.log('📦 Creating new product for admin:', req.user.email);
        console.log('📋 Product data:', req.body);
        
        // Validate required fields
        const { name, price, category, type, material, size, description } = req.body;
        
        if (!name || !price || !category || !type || !material || !size || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, price, category, type, material, size, description'
            });
        }
        
        // Validate price
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }
        
        // Validate category and type
        const validCategories = ['backpack', 'sling', 'handbag', 'tote', 'laptop-bag', 'travel-bag'];
        const validTypes = ['backpack', 'sling', 'handbag'];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
            });
        }
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }
        
        // Process color variants if provided
        let colorVariants = [];
        if (req.body.colorVariants && Array.isArray(req.body.colorVariants)) {
            colorVariants = req.body.colorVariants.map(variant => ({
                name: variant.name || '',
                code: variant.code || '#000000',
                stock: parseInt(variant.stock) || 0,
                isAvailable: variant.isAvailable !== false, // Default to true
                images: variant.images || []
            })).filter(variant => variant.name.trim()); // Remove empty variants
        }
        
        // Add createdBy field with current admin user ID
        const productData = {
            ...req.body,
            createdBy: req.user._id,
            colorVariants: colorVariants,
            // Ensure images array exists
            images: req.body.images && Array.isArray(req.body.images) ? req.body.images : [{
                public_id: 'admin-upload-' + Date.now(),
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTIwQzE1NS44MiAxMjAgMTIwIDE1NS44MiAxMjAgMjAwQzEyMCAyNDQuMTggMTU1LjgyIDI4MCAyMDAgMjgwQzI0NC4xOCAyODAgMjgwIDI0NC4xOCAyODAgMjAwQzI4MCAxNTUuODIgMjQ0LjE4IDEyMCAyMDAgMTIwWk0yMDAgMjYwQzE3Ny45MDkgMjYwIDE2MCAyNDIuMDkxIDE2MCAyMjBDMTYwIDE5Ny45MDkgMTc3LjkwOSAxODAgMjAwIDE4MEMyMjIuMDkxIDE4MCAyNDAgMTk3LjkwOSAyNDAgMjIwQzI0MCAyNDIuMDkxIDIyMi4wOTEgMjYwIDIwMCAyNjBaIiBmaWxsPSIjOUNBMEE2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMzIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBMEE2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K',
                alt: 'Product Image',
                isPrimary: true
            }]
        };
        
        console.log('📦 Final product data:', productData);
        // Normalize images for create: prefer persistent Cloudinary; fallback to local optimization
        if (Array.isArray(productData.images)) {
            const useCloudinary = configureCloudinary();
            const normalized = [];
            for (let i = 0; i < productData.images.length; i++) {
                const img = productData.images[i] || {};
                const source = img.url || img; // supports {url,...} or raw string

                let finalUrl = null;
                let publicId = img.public_id || '';

                if (useCloudinary && source) {
                    try {
                        const uploaded = await uploadImage(source, { folder: 'laiq-bags/products' });
                        if (uploaded && uploaded.url) {
                            finalUrl = uploaded.url;
                            publicId = uploaded.public_id || publicId || `admin-upload-${Date.now()}-${i}`;
                        }
                    } catch (e) {
                        // fall through to local normalization
                    }
                }

                if (!finalUrl) {
                    const normalizedUrl = await normalizeImageUrlForProduct(source, (req.user && req.user._id ? req.user._id.toString() : 'temp'), i);
                    finalUrl = normalizedUrl || source;
                }

                normalized.push({
                    public_id: publicId || `admin-upload-${Date.now()}-${i}`,
                    url: finalUrl,
                    alt: img.alt || 'Product Image',
                    isPrimary: Boolean(img.isPrimary)
                });
            }
            productData.images = normalized;
        }

        const product = await Product.create(productData);
        
        console.log('✅ Product created successfully:', product._id);
        
        // Clear server-side cache for products
        try {
            // Clear products cache if it exists
            if (global.productsCache) {
                global.productsCache.clear();
                console.log('🗑️ Cleared server-side products cache');
            }
            
            // Clear admin products cache if it exists
            if (global.adminProductsCache) {
                global.adminProductsCache.clear();
                console.log('🗑️ Cleared server-side admin products cache');
            }
        } catch (cacheError) {
            console.warn('⚠️ Error clearing cache:', cacheError);
        }
        
        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('❌ Create product error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this name already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
}));

// Update product (admin)
router.put('/products/:id', adminAuth, catchAsyncErrors(async (req, res) => {
    try {
        console.log('📦 Updating product for admin:', req.user.email);
        console.log('📋 Product ID:', req.params.id);
        console.log('📋 Update data:', req.body);
        
        // Check if product exists
        let product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Validate required fields
        const { name, price, category, type, material, size, description } = req.body;
        
        if (!name || !price || !category || !type || !material || !size || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, price, category, type, material, size, description'
            });
        }
        
        // Validate price
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }
        
        // Validate category and type
        const validCategories = ['backpack', 'sling', 'handbag', 'tote', 'laptop-bag', 'travel-bag'];
        const validTypes = ['backpack', 'sling', 'handbag'];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
            });
        }
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }
        
        // Process color variants if provided
        let colorVariants = [];
        if (req.body.colorVariants && Array.isArray(req.body.colorVariants)) {
            colorVariants = req.body.colorVariants.map(variant => ({
                name: variant.name || '',
                code: variant.code || '#000000',
                stock: parseInt(variant.stock) || 0,
                isAvailable: variant.isAvailable !== false, // Default to true
                images: variant.images || []
            })).filter(variant => variant.name.trim()); // Remove empty variants
        }
        
        // Calculate total stock from color variants
        const totalStock = colorVariants.reduce((sum, variant) => sum + variant.stock, 0);
        
        // Normalize images for update: prefer Cloudinary; fallback to local optimization
        let normalizedImages = product.images;
        if (req.body.images && Array.isArray(req.body.images)) {
            const useCloudinary = configureCloudinary();
            normalizedImages = [];
            for (let i = 0; i < req.body.images.length; i++) {
                const img = req.body.images[i] || {};
                const source = img.url || img; // supports {url,...} or raw string

                // If already a Cloudinary object with public_id and https URL, keep as-is
                if (img && img.public_id && typeof img.url === 'string' && img.url.startsWith('http')) {
                    normalizedImages.push({
                        public_id: img.public_id,
                        url: img.url,
                        alt: img.alt || 'Product Image',
                        isPrimary: Boolean(img.isPrimary)
                    });
                    continue;
                }

                let finalUrl = null;
                let publicId = img.public_id || '';

                if (useCloudinary && source) {
                    try {
                        const uploaded = await uploadImage(source, { folder: 'laiq-bags/products' });
                        if (uploaded && uploaded.url) {
                            finalUrl = uploaded.url;
                            publicId = uploaded.public_id || publicId || `admin-upload-${Date.now()}-${i}`;
                        }
                    } catch (e) {
                        // fall through to local normalization
                    }
                }

                if (!finalUrl) {
                    const normalizedUrl = await normalizeImageUrlForProduct(source, product._id.toString(), i);
                    finalUrl = normalizedUrl || source;
                }

                normalizedImages.push({
                    public_id: publicId || `admin-upload-${Date.now()}-${i}`,
                    url: finalUrl,
                    alt: img.alt || 'Product Image',
                    isPrimary: Boolean(img.isPrimary)
                });
            }
        }

        // Prepare update data
        const updateData = {
            ...req.body,
            colorVariants: colorVariants,
            stock: totalStock, // Set total stock from color variants
            images: normalizedImages
        };
        
        console.log('📦 Final update data:', updateData);
        
        // Update product using save() so pre-save hooks (compression, stock calc) run
        product.set(updateData);
        await product.save();
        
        console.log('✅ Product updated successfully:', product._id);
        
        // Clear server-side cache for products
        try {
            // Clear products cache if it exists
            if (global.productsCache) {
                global.productsCache.clear();
                console.log('🗑️ Cleared server-side products cache');
            }
            
            // Clear admin products cache if it exists
            if (global.adminProductsCache) {
                global.adminProductsCache.clear();
                console.log('🗑️ Cleared server-side admin products cache');
            }
        } catch (cacheError) {
            console.warn('⚠️ Error clearing cache:', cacheError);
        }
        
        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('❌ Update product error:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this name already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}));

// Delete product (admin)
router.delete('/products/:id', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        await product.deleteOne();
        
        // Clear server-side cache for products
        try {
            // Clear products cache if it exists
            if (global.productsCache) {
                global.productsCache.clear();
                console.log('🗑️ Cleared server-side products cache');
            }
            
            // Clear admin products cache if it exists
            if (global.adminProductsCache) {
                global.adminProductsCache.clear();
                console.log('🗑️ Cleared server-side admin products cache');
            }
        } catch (cacheError) {
            console.warn('⚠️ Error clearing cache:', cacheError);
        }
        
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product'
        });
    }
}));

// Get all orders (admin)
router.get('/orders', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔍 Admin orders request:', { query: req.query, user: req.user.email });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Default 50 orders per page
        const skip = (page - 1) * limit;
        
        // Build filter query
        const filterQuery = {};
        
        // Status filter
        if (req.query.status && req.query.status !== '' && req.query.status !== 'all') {
            filterQuery.status = req.query.status;
            console.log('🔍 Applying status filter:', req.query.status);
        }
        
        // Payment method filter
        if (req.query.paymentMethod && req.query.paymentMethod !== '' && req.query.paymentMethod !== 'all') {
            filterQuery.paymentMethod = req.query.paymentMethod;
            console.log('🔍 Applying payment method filter:', req.query.paymentMethod);
        }
        
        // Date filter
        if (req.query.date) {
            const filterDate = new Date(req.query.date);
            if (!isNaN(filterDate.getTime())) {
                const startOfDay = new Date(filterDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filterDate);
                endOfDay.setHours(23, 59, 59, 999);
                filterQuery.createdAt = { $gte: startOfDay, $lte: endOfDay };
                console.log('🔍 Applying date filter:', req.query.date);
            }
        }
        
        // Search filter
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filterQuery.$or = [
                { _id: { $regex: searchRegex } },
                { 'user.name': { $regex: searchRegex } },
                { 'user.email': { $regex: searchRegex } },
                { 'orderItems.name': { $regex: searchRegex } }
            ];
            console.log('🔍 Applying search filter:', req.query.search);
        }
        
        console.log('📊 Orders pagination params:', { page, limit, skip });
        console.log('🔍 Filter query:', filterQuery);
        
        // Get total count for pagination with filters
        const totalOrders = await Order.countDocuments(filterQuery);
        
        // Get orders with pagination, filters, and limited population
        const orders = await Order.find(filterQuery)
            .populate('user', 'name email')
            .populate({
                path: 'orderItems.product',
                select: 'name images',
                transform: function(doc) {
                    if (!doc) return doc;
                    // Keep only first image url to shrink response size
                    if (Array.isArray(doc.images) && Array.isArray(doc.images) && doc.images.length > 0) {
                        doc.images = [doc.images[0]];
                    } else {
                        doc.images = [];
                    }
                    return doc;
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .select('orderItems totalAmount status createdAt user shippingInfo paymentInfo paymentMethod')
            .maxTimeMS(15000); // 15 second timeout for admin order queries
        
        const response = {
            success: true,
            count: orders.length,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            orders
        };
        console.log('✅ Admin orders response:', { 
            count: response.count, 
            totalOrders: response.totalOrders,
            currentPage: response.currentPage,
            totalPages: response.totalPages,
            responseSize: JSON.stringify(response).length
        });
        res.status(200).json(response);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
}));

// Update order status (admin)
router.put('/orders/:id/status', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔄 Admin updating order status:', req.params.id, 'to', req.body.status);
        console.log('📋 Request body:', req.body);
        
        const { status, notes } = req.body;
        
        // Validate order ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error('❌ Invalid order ID:', req.params.id);
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            console.error('❌ Order not found:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            console.error('❌ Invalid status:', status);
            return res.status(400).json({
                success: false,
                message: 'Invalid order status. Valid statuses are: ' + validStatuses.join(', ')
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
}));

// Get all customers (admin)
router.get('/customers', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const customers = await User.find({ role: 'user' })
            .select('-password')
            .lean();
        
        // Get order statistics using aggregation for better performance
        const customerStats = await Order.aggregate([
            { $group: { 
                _id: '$user', 
                totalOrders: { $sum: 1 }, 
                totalSpent: { $sum: '$totalAmount' } 
            }}
        ]);
        
        // Create a map for quick lookup
        const statsMap = new Map(customerStats.map(stat => [stat._id.toString(), stat]));
        
        const customersWithStats = customers.map(customer => {
            const stats = statsMap.get(customer._id.toString()) || { totalOrders: 0, totalSpent: 0 };
            
            return {
                ...customer,
                totalOrders: stats.totalOrders,
                totalSpent: stats.totalSpent
            };
        });
        
        res.status(200).json({
            success: true,
            count: customersWithStats.length,
            customers: customersWithStats
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers'
        });
    }
}));

// Get single customer details (admin)
router.get('/customers/:id', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer'
        });
    }
}));

// Update customer (admin)
router.put('/customers/:id', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        
        const customer = await User.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        // Validate phone number format
        if (phone && !phone.match(/^[0-9]{10}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number'
            });
        }
        
        // Use the adminUpdate method
        await customer.adminUpdate({ name, email, phone, address });
        
        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer'
        });
    }
}));

// Fix phone encryption for all customers (admin)
router.post('/customers/fix-phone-encryption', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const fixedCount = await User.fixAllPhoneNumbers();
        
        res.status(200).json({
            success: true,
            message: `Fixed ${fixedCount} encrypted phone numbers. They now show 'Phone number needs update'`,
            fixedCount
        });
    } catch (error) {
        console.error('Fix phone encryption error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fixing phone encryption'
        });
    }
}));

// Get customer orders (admin)
router.get('/customers/:id/orders', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const customerId = req.params.id;
        
        console.log('🔍 Admin requesting customer orders for ID:', customerId);
        
        // Early return for undefined/null customer IDs
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            console.error('❌ Invalid customer ID received:', customerId);
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }
        
        // Validate ObjectId format
        if (!customerId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('❌ Invalid ObjectId format:', customerId);
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }
        
        const orders = await Order.find({ user: customerId })
            .populate('user', 'name email')
            .populate('orderItems.product', 'name images price')
            .sort({ createdAt: -1 });
        
        console.log('✅ Customer orders found:', orders.length);
        
        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('❌ Get customer orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer orders'
        });
    }
}));

// Get customer wishlist (admin)
router.get('/customers/:id/wishlist', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const customerId = req.params.id;
        
        console.log('🔍 Admin requesting customer wishlist for ID:', customerId);
        
        // Early return for undefined/null customer IDs
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            console.error('❌ Invalid customer ID received:', customerId);
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }
        
        // Validate ObjectId format
        if (!customerId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('❌ Invalid ObjectId format:', customerId);
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }
        
        const customer = await User.findById(customerId);
        
        if (!customer) {
            console.error('❌ Customer not found for ID:', customerId);
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        console.log('✅ Customer found:', customer.name, 'Wishlist items:', customer.wishlist?.length || 0);
        
        // Get customer's wishlist products
        const wishlist = await Product.find({
            _id: { $in: customer.wishlist || [] }
        });
        
        console.log('📋 Wishlist products found:', wishlist.length);
        
        res.status(200).json({
            success: true,
            count: wishlist.length,
            wishlist
        });
    } catch (error) {
        console.error('❌ Get customer wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer wishlist',
            error: error.message
        });
    }
}));

// Get customer cart (admin)
router.get('/customers/:id/cart', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        const customerId = req.params.id;
        
        // Early return for undefined/null customer IDs
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }
        
        // Validate ObjectId format
        if (!customerId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }
        
        const customer = await User.findById(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        console.log('🛒 Admin requesting customer cart for ID:', customerId);
        console.log('✅ Customer found:', customer.name);
        
        // Get customer's cart from database
        let cart;
        try {
            cart = await Cart.findOne({ user: customerId }).populate('items.product');
            
            if (!cart) {
                console.log('🛒 No cart found for customer, returning empty cart');
                return res.status(200).json({
                    success: true,
                    cart: {
                        items: [],
                        totalAmount: 0,
                        itemCount: 0
                    }
                });
            }
            
            // Ensure all cart items have proper data
            const validatedItems = cart.items.map(item => {
                const product = item.product;
                return {
                    product: product?._id || item.product,
                    productId: product?._id || item.product,
                    name: item.name || product?.name || 'Unknown Product',
                    price: parseFloat(item.price) || parseFloat(product?.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    image: item.image || product?.images?.[0]?.url || product?.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=',
                    color: item.color || null,
                    product: product // Include full product data
                };
            }).filter(item => item.product && item.price > 0); // Remove invalid items
            
            const totalAmount = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemCount = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
            
            console.log('🛒 Cart found with items:', validatedItems.length);
            
            res.status(200).json({
                success: true,
                cart: {
                    items: validatedItems,
                    totalAmount,
                    itemCount
                }
            });
            
        } catch (cartError) {
            console.error('❌ Error finding cart:', cartError);
            return res.status(500).json({
                success: false,
                message: 'Error fetching customer cart',
                error: cartError.message
            });
        }
        
    } catch (error) {
        console.error('❌ Get customer cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer cart',
            error: error.message
        });
    }
}));

// Get analytics data (admin)
router.get('/analytics', isAuthenticatedUser, adminOnly, catchAsyncErrors(async (req, res) => {
    try {
        // Sales by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    status: { $in: ['delivered', 'shipped'] }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalSales: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        // Top selling products
        const topProducts = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $group: {
                    _id: '$orderItems.product',
                    totalSold: { $sum: '$orderItems.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);
        
        // Category-wise sales
        const categorySales = await Order.aggregate([
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderItems.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    totalSales: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
                    totalSold: { $sum: '$orderItems.quantity' }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                monthlySales,
                topProducts,
                categorySales
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
}));

// Get website settings
router.get('/settings', catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔍 Settings request received');
        
        // Add cache control headers to prevent caching
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Get settings from database or return defaults
        let settings = await Settings.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = new Settings({
                websiteName: 'Laiq Bags',
                websiteDescription: 'Premium bags and accessories',
                contactEmail: 'info@laiqbags.com',
                contactPhone: '+91 98765 43210',
                address: 'Mumbai, Maharashtra, India',
                socialMedia: {
                    facebook: '',
                    instagram: '',
                    twitter: ''
                },
                theme: {
                    primaryColor: '#d4af37',
                    secondaryColor: '#f5f5dc'
                }
            });
            await settings.save();
            console.log('✅ Default settings created');
        }
        
        res.status(200).json({
            success: true,
            settings: {
                websiteName: settings.websiteName || 'Laiq Bags',
                websiteDescription: settings.websiteDescription || 'Premium bags and accessories',
                contactEmail: settings.contactEmail || 'info@laiqbags.com',
                contactPhone: settings.contactPhone || '+91 98765 43210',
                whatsappNumber: settings.whatsappNumber || '+91 99999 99999',
                instagramHandle: settings.instagramHandle || '@laiq_bags_',
                address: settings.address || 'Mumbai, Maharashtra, India',
                socialMedia: settings.socialMedia || {},
                theme: settings.theme || {
                    primaryColor: '#d4af37',
                    secondaryColor: '#f5f5dc'
                }
            }
        });
    } catch (error) {
        console.error('❌ Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
}));

// Update website settings
router.put('/settings', adminAuth, catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔍 Update settings request received:', req.body);
        
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = new Settings();
        }
        
        // Update settings with provided data
        Object.assign(settings, req.body);
        await settings.save();
        
        console.log('✅ Settings updated successfully');
        
        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('❌ Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings',
            error: error.message
        });
    }
}));

module.exports = router; 