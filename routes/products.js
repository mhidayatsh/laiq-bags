const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { productLimiter } = require('../middleware/rateLimiter');
const { performanceMonitor } = require('../utils/performanceMonitor');
const cacheManager = require('../utils/cache');

const router = express.Router();

// Simple in-memory cache for product lists (TTL in ms)
const LIST_CACHE_TTL = 60 * 1000; // 60s
const listCache = new Map(); // key: JSON.stringify(query), value: { data, ts }

// Warm cache to avoid cold-start blank UI if DB is slow
let warmCache = { data: null, ts: 0 };
const setWarmCache = (payload) => {
  try {
    warmCache = { data: payload, ts: Date.now() };
  } catch (_) {}
};

// Helper: timeout a promise
const withTimeout = (promise, ms, label = 'operation') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms))
  ]);
};

// Get all products => /api/products
router.get('/', productLimiter, async (req, res) => {
  // Check if this is a cache-busting request
  const isCacheBusting = req.query._t || req.query.timestamp;
  
  if (isCacheBusting) {
    // Disable caching for cache-busting requests
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else {
    // Add cache headers for better performance
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.set('ETag', `products-${Date.now()}`);
  }
  
  // Start performance monitoring
  const timer = performanceMonitor.startTimer('get-all-products');
  
  try {
    // If identical request was served recently, return quickly
    // Cache key from querystring
    const cacheKey = JSON.stringify(req.query || {});
    const cached = listCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < LIST_CACHE_TTL) {
      return res.status(200).json(cached.data);
    }
    const resPerPage = parseInt(req.query.limit) || 8; // Allow custom limit
    const currentPage = parseInt(req.query.page) || 1;
    
    // Validate pagination parameters
    if (resPerPage > 20) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 20 products per page allowed'
      });
    }
    
    // Put a defensive cap on server-side time (keep < client 8s timeout)
    const QUERY_TIMEOUT_MS = 6000;
    // Use estimated count for speed; wrap in try so count failure doesn't block listing
    let productsCount = 0;
    try {
      productsCount = await withTimeout(Product.estimatedDocumentCount(), QUERY_TIMEOUT_MS, 'count');
    } catch (_) {
      productsCount = 0;
    }

    // Build match query
    const hasKeyword = Boolean(req.query.keyword && String(req.query.keyword).trim());
    const matchQuery = {};
    if (hasKeyword) {
      const keyword = String(req.query.keyword).trim();
      // Use regex-based search to avoid $meta textScore (unstable under apiStrict)
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      matchQuery.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { material: { $regex: regex } },
        { tags: { $elemMatch: { $regex: regex } } }
      ];
    }
    if (req.query.category) {
      matchQuery.category = req.query.category;
    }
    if (req.query.type) {
      matchQuery.type = req.query.type;
    }
    if (req.query.minPrice || req.query.maxPrice) {
      matchQuery.price = {};
      if (req.query.minPrice) matchQuery.price.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) matchQuery.price.$lte = parseInt(req.query.maxPrice);
    }
    // Boolean flags
    const boolFromQuery = (v) => typeof v === 'string' ? v === 'true' : Boolean(v);
    if (typeof req.query.featured !== 'undefined') {
      matchQuery.featured = boolFromQuery(req.query.featured);
    }
    if (typeof req.query.bestSeller !== 'undefined') {
      matchQuery.bestSeller = boolFromQuery(req.query.bestSeller);
    }
    if (typeof req.query.newArrival !== 'undefined') {
      matchQuery.newArrival = boolFromQuery(req.query.newArrival);
    }
    if (typeof req.query.isDiscountActive !== 'undefined') {
      matchQuery.isDiscountActive = boolFromQuery(req.query.isDiscountActive);
    }

    // Determine sort order requested by client
    const sortParam = String(req.query.sort || '').trim();
    let sortStage = null;
    switch (sortParam) {
      case 'price_asc':
        sortStage = { price: 1 };
        break;
      case 'price_desc':
        sortStage = { price: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      case 'name':
        sortStage = { name: 1 };
        break;
      case 'discount':
        // Prioritize active discounts, then larger discount, then newest
        sortStage = { isDiscountActive: -1, discount: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortStage = null; // decide below (keyword => score, else createdAt desc)
    }

    const hasFilters = Object.keys(matchQuery).length > 0;

    const filteredCountPromise = hasFilters
      ? (hasKeyword
          ? Promise.resolve(null)
          : withTimeout(Product.countDocuments(matchQuery), QUERY_TIMEOUT_MS, 'filteredCount').catch(() => null))
      : Promise.resolve(productsCount);

    // Pagination values
    const skip = (currentPage - 1) * resPerPage;

    // Aggregation pipeline to minimize payload (compute a safe 'image' and drop big base64/compressed URLs)
    const basePipeline = [
      { $match: matchQuery },
      // Derive primaryImage (prefer isPrimary, else first)
      {
        $addFields: {
          primaryImage: {
            $let: {
              vars: {
                primaries: {
                  $filter: {
                    input: { $ifNull: ['$images', []] },
                    as: 'img',
                    cond: { $eq: ['$$img.isPrimary', true] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $size: '$$primaries' }, 0] },
                  { $arrayElemAt: ['$$primaries', 0] },
                  { $arrayElemAt: [{ $ifNull: ['$images', []] }, 0] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          imageUrl: '$primaryImage.url'
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          category: 1,
          type: 1,
          material: 1,
          size: 1,
          colors: 1,
          stock: 1,
          featured: 1,
          bestSeller: 1,
          newArrival: 1,
          discount: 1,
          isDiscountActive: 1,
          discountStartDate: 1,
          discountEndDate: 1,
          ratings: 1,
          numOfReviews: 1,
          createdAt: 1,
          // Provide a shortDescription for cards/quick-view (avoid huge payloads)
          shortDescription: {
            $let: {
              vars: { desc: { $ifNull: ['$description', ''] } },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: '$$desc' }, 160] },
                  { $concat: [ { $substrCP: ['$$desc', 0, 157] }, '…' ] },
                  '$$desc'
                ]
              }
            }
          },
          'colorVariants.name': 1,
          'colorVariants.code': 1,
          'colorVariants.stock': 1,
          'colorVariants.isAvailable': 1,
          image: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $substrBytes: [{ $ifNull: ['$imageUrl', ''] }, 0, 10] }, 'data:image'] },
                  { $eq: [{ $substrBytes: [{ $ifNull: ['$imageUrl', ''] }, 0, 4] }, 'H4sI'] }
                ]
              },
              null,
              '$imageUrl'
            ]
          }
        }
      }
    ];

    const finalSortStage = sortStage || { createdAt: -1 };

    const pipeline = [
      ...basePipeline,
      {
        $facet: {
          results: [
            { $sort: finalSortStage },
            { $skip: skip },
            { $limit: resPerPage }
          ],
          count: [ { $count: 'total' } ]
        }
      }
    ];

    const aggResult = await withTimeout(
      Product.aggregate(pipeline).option({ maxTimeMS: QUERY_TIMEOUT_MS, allowDiskUse: true }),
      QUERY_TIMEOUT_MS,
      'products'
    );
    const facet = Array.isArray(aggResult) && aggResult.length > 0 ? aggResult[0] : { results: [], count: [] };
    const products = facet.results || [];

    // Add discount info and ensure images array shape expected by client
    const productsWithDiscount = products.map(product => {
      let discountInfo = null;
      
      // Use real-time discount validation instead of relying on isDiscountActive
      if (product.discount > 0) {
        const now = new Date();
        let status = 'active';
        
        // Check start date
        if (product.discountStartDate && now < new Date(product.discountStartDate)) {
          status = 'upcoming';
        } 
        // Check end date
        else if (product.discountEndDate && now > new Date(product.discountEndDate)) {
          status = 'expired';
        }
        
        // Only provide discount info if status is active
        if (status === 'active') {
          const discountPrice = Math.round(product.price - (product.price * product.discount / 100));
          
          // Compute timeRemaining for countdowns
          let timeRemaining = null;
          if (product.discountEndDate) {
            const endDate = new Date(product.discountEndDate);
            const diff = endDate - now;
            if (diff > 0) {
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              timeRemaining = { days, hours, minutes };
            }
          }
          
          discountInfo = {
            type: 'percentage',
            value: `${product.discount}%`,
            originalPrice: product.price,
            discountPrice,
            savings: Math.round(product.price * product.discount / 100),
            status,
            timeRemaining
          };
        }
      }
      
      return {
        ...product,
        images: undefined,
        discountInfo
      };
    });

    // Resolve counts using the same pipeline match
    const filteredProductsCount = (facet.count && facet.count[0] && facet.count[0].total) ? facet.count[0].total : products.length;
    const effectiveFilteredCount = filteredProductsCount || (productsCount || productsWithDiscount.length);

    const payload = {
      success: true,
      productsCount,
      resPerPage,
      currentPage,
      totalPages: Math.max(1, Math.ceil(effectiveFilteredCount / resPerPage)),
      filteredProductsCount: effectiveFilteredCount,
      totalProducts: effectiveFilteredCount,
      products: productsWithDiscount
    };

    // Save to cache
    listCache.set(cacheKey, { data: payload, ts: Date.now() });
    // Update warm cache for future timeouts
    setWarmCache(payload);

    // End performance monitoring
    const duration = performanceMonitor.endTimer('get-all-products');
    performanceMonitor.trackQuery('products', 'find', duration);

    res.status(200).json(payload);
  } catch (error) {
    console.error('Get products error:', error);
    // Serve stale cache if available on timeout to avoid blank UI
    const cacheKey = JSON.stringify(req.query || {});
    const cached = listCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached.data, cache: 'stale' });
    }
    // Fallback to warm cache if available (even if query differs slightly)
    if (warmCache.data) {
      return res.status(200).json({ ...warmCache.data, cache: 'warm-stale' });
    }
    const isTimeout = String(error.message || '').includes('timeout');
    res.status(isTimeout ? 504 : 500).json({
      success: false,
      message: isTimeout ? 'Products request timed out' : 'Error getting products'
    });
  }
});

// Get single product details => /api/products/:id
router.get('/:id', productLimiter, async (req, res) => {
  // Check if this is a cache-busting request
  const isCacheBusting = req.query._t || req.query.timestamp;
  
  if (isCacheBusting) {
    // Disable caching for cache-busting requests
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else {
    // Add cache headers for better performance
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutes cache for individual products
    res.set('ETag', `product-${req.params.id}-${Date.now()}`);
  }
  
  try {
    const { id } = req.params;
    
    // Check if it's a slug (contains letters but not a valid ObjectId) or ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const isSlug = !isValidObjectId && /[a-zA-Z]/.test(id);
    
    let matchQuery;
    if (isSlug) {
      // Search by slug
      matchQuery = { slug: id };
    } else {
      // Validate basic ObjectId pattern to avoid server errors
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID' });
      }
      matchQuery = { _id: new mongoose.Types.ObjectId(id) };
    }

    const pipeline = [
      { $match: matchQuery },
      // Sanitize top-level images: drop data:image and compressed H4sI
      {
        $addFields: {
          images: {
            $filter: {
              input: { $ifNull: ['$images', []] },
              as: 'img',
              cond: {
                $and: [
                  { $ne: [{ $substrBytes: [{ $ifNull: ['$$img.url', ''] }, 0, 10] }, 'data:image'] },
                  { $ne: [{ $substrBytes: [{ $ifNull: ['$$img.url', ''] }, 0, 4] }, 'H4sI'] }
                ]
              }
            }
          }
        }
      },
      // Sanitize colorVariants images similarly
      {
        $addFields: {
          colorVariants: {
            $map: {
              input: { $ifNull: ['$colorVariants', []] },
              as: 'cv',
              in: {
                name: '$$cv.name',
                code: '$$cv.code',
                stock: '$$cv.stock',
                isAvailable: '$$cv.isAvailable',
                images: {
                  $filter: {
                    input: { $ifNull: ['$$cv.images', []] },
                    as: 'cimg',
                    cond: {
                      $and: [
                        { $ne: [{ $substrBytes: [{ $ifNull: ['$$cimg.url', ''] }, 0, 10] }, 'data:image'] },
                        { $ne: [{ $substrBytes: [{ $ifNull: ['$$cimg.url', ''] }, 0, 4] }, 'H4sI'] }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
      // Project necessary fields only
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1, // full description for product page
          metaDescription: 1, // SEO meta description
          seoTitle: 1, // SEO title
          seoKeywords: 1, // SEO keywords
          specifications: 1, // include specs so features can render
          price: 1,
          stock: 1,
          category: 1,
          type: 1,
          size: 1,
          material: 1,
          colors: 1,
          featured: 1,
          bestSeller: 1,
          newArrival: 1,
          discount: 1,
          discountType: 1,
          discountAmount: 1,
          discountStartDate: 1,
          discountEndDate: 1,
          isDiscountActive: 1,
          ratings: 1,
          numOfReviews: 1,
          reviews: 1,
          images: 1,
          colorVariants: 1,
          createdAt: 1
        }
      }
    ];

    const results = await Product.aggregate(pipeline).option({ allowDiskUse: true });
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productObj = results[0];

    // Attach discount info similar to list route
    let discountInfo = null;
    if (productObj.discount > 0) {
      const now = new Date();
      let status = 'active';
      
      // Check start date
      if (productObj.discountStartDate && now < new Date(productObj.discountStartDate)) {
        status = 'upcoming';
      } 
      // Check end date
      else if (productObj.discountEndDate && now > new Date(productObj.discountEndDate)) {
        status = 'expired';
      }
      
      // Only provide discount info if status is active
      if (status === 'active') {
        const discountPrice = Math.round(productObj.price - (productObj.price * productObj.discount / 100));
        discountInfo = {
          type: 'percentage',
          value: `${productObj.discount}%`,
          originalPrice: productObj.price,
          discountPrice,
          savings: Math.round(productObj.price * productObj.discount / 100),
          status
        };
      }
    }

    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": productObj.name,
      "description": productObj.description,
      "brand": {
        "@type": "Brand",
        "name": "LAIQ BAGS"
      },
      "category": productObj.category,
      "image": productObj.images?.map(img => img.url) || [],
      "offers": {
        "@type": "Offer",
        "price": productObj.price,
        "priceCurrency": "INR",
        "availability": productObj.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Laiq Bags"
        }
      }
    };

    // Add reviews if available
    if (productObj.reviews && productObj.reviews.length > 0) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": productObj.ratings || 0,
        "reviewCount": productObj.numOfReviews || 0
      };
      
      structuredData.review = productObj.reviews.slice(0, 5).map(review => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": review.name
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating
        },
        "reviewBody": review.comment
      }));
    }

    return res.status(200).json({ 
      success: true, 
      product: { ...productObj, discountInfo },
      structuredData 
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Error getting product' });
  }
});

// Performance monitoring endpoint (admin only)
router.get('/performance/stats', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const summary = performanceMonitor.getSummary();
    const topEndpoints = performanceMonitor.getTopEndpoints(10);
    const slowQueries = performanceMonitor.getSlowQueries(10);
    const dbPerformance = performanceMonitor.getDatabasePerformance();
    const cachePerformance = performanceMonitor.getCachePerformance();

    res.status(200).json({
      success: true,
      performance: {
        summary,
        topEndpoints,
        slowQueries,
        database: dbPerformance,
        cache: cachePerformance
      }
    });
  } catch (error) {
    console.error('Performance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting performance stats'
    });
  }
});

// Get products with active discounts => /api/products/discounts/active
router.get('/discounts/active', async (req, res) => {
  try {
    const products = await Product.find({
      isDiscountActive: true,
      discount: { $gt: 0 }
    });

    const productsWithDiscountInfo = products.map(product => {
      const productObj = product.toObject();
      productObj.discountInfo = product.getDiscountInfo();
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithDiscountInfo.length,
      products: productsWithDiscountInfo
    });
  } catch (error) {
    console.error('Get discounted products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting discounted products'
    });
  }
});

// Get products by discount percentage => /api/products/discounts/:percentage
router.get('/discounts/:percentage', async (req, res) => {
  try {
    const percentage = parseInt(req.params.percentage);
    
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount percentage'
      });
    }

    const products = await Product.find({
      isDiscountActive: true,
      discount: percentage,
      discountType: 'percentage'
    });

    const productsWithDiscountInfo = products.map(product => {
      const productObj = product.toObject();
      productObj.discountInfo = product.getDiscountInfo();
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithDiscountInfo.length,
      discountPercentage: percentage,
      products: productsWithDiscountInfo
    });
  } catch (error) {
    console.error('Get products by discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting products by discount'
    });
  }
});

// Create new product => /api/products/new
router.post('/new', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const product = await Product.create(req.body);

    const productObj = product.toObject();
    productObj.discountInfo = product.getDiscountInfo();

    res.status(201).json({
      success: true,
      product: productObj
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product'
    });
  }
});

// Update Product => /api/products/:id
router.put('/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Recalculate stock on backend to ensure consistency with colorVariants
    if (Array.isArray(req.body.colorVariants)) {
      const calculatedStock = req.body.colorVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      req.body.stock = calculatedStock;
      console.log('📦 Stock calculation:', {
        colorVariants: req.body.colorVariants.map(v => ({ name: v.name, stock: v.stock })),
        calculatedStock: calculatedStock
      });
    } else {
      // If no colorVariants, ensure stock is at least 0
      req.body.stock = req.body.stock || 0;
    }

    // Use findOneAndUpdate with runValidators to ensure proper validation
    product = await Product.findOneAndUpdate(
      { _id: req.params.id }, 
      req.body, 
      {
        new: true,
        runValidators: true,
        useFindAndModify: false
      }
    );

    const productObj = product.toObject();
    productObj.discountInfo = product.getDiscountInfo();

    res.status(200).json({
      success: true,
      product: productObj
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
});

// Add/Update discount for product => /api/products/:id/discount
router.put('/:id/discount', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { discount, discountType, discountStartDate, discountEndDate } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate discount data
    if (discountType === 'percentage' && (discount < 0 || discount > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100'
      });
    }

    if (discountType === 'fixed' && discount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount amount cannot be negative'
      });
    }

    // Update discount fields
    product.discount = discount;
    product.discountType = discountType || 'percentage';
    product.discountStartDate = discountStartDate || null;
    product.discountEndDate = discountEndDate || null;
    product.isDiscountActive = true;

    await product.save();

    const productObj = product.toObject();
    productObj.discountInfo = product.getDiscountInfo();

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      product: productObj
    });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating discount'
    });
  }
});

// Remove discount from product => /api/products/:id/discount/remove
router.delete('/:id/discount/remove', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Remove discount
    product.discount = 0;
    product.discountType = 'percentage';
    product.discountAmount = 0;
    product.discountStartDate = null;
    product.discountEndDate = null;
    product.isDiscountActive = false;

    await product.save();

    const productObj = product.toObject();
    productObj.discountInfo = product.getDiscountInfo();

    res.status(200).json({
      success: true,
      message: 'Discount removed successfully',
      product: productObj
    });
  } catch (error) {
    console.error('Remove discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing discount'
    });
  }
});

// Bulk update discounts => /api/products/discounts/bulk
router.put('/discounts/bulk', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { productIds, discount, discountType, discountStartDate, discountEndDate } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    if (discountType === 'percentage' && (discount < 0 || discount > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100'
      });
    }

    const updateData = {
      discount,
      discountType: discountType || 'percentage',
      discountStartDate: discountStartDate || null,
      discountEndDate: discountEndDate || null,
      isDiscountActive: true
    };

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `Discount updated for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating discounts'
    });
  }
});

// Delete Product => /api/products/:id
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

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
});

// Create/Update product review => /api/products/review
router.put('/review', isAuthenticatedUser, async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
      product.reviews.forEach(review => {
        if (review.user.toString() === req.user._id.toString()) {
          review.comment = comment;
          review.rating = rating;
        }
      });
    } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review'
    });
  }
});

// Get Product Reviews => /api/products/reviews
router.get('/reviews/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
      success: true,
      reviews: product.reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reviews'
    });
  }
});

// Delete Product Review => /api/products/reviews
router.delete('/reviews', isAuthenticatedUser, async (req, res) => {
  try {
    const product = await Product.findById(req.query.productId);

    const reviews = product.reviews.filter(
      review => review._id.toString() !== req.query.id.toString()
    );

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
      reviews,
      ratings,
      numOfReviews
    }, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

module.exports = router; 