const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const path = require('path');

// Handle SEO-friendly product URLs: /product/product-name-id
// Only match URLs that contain a dash (indicating product-name-id format)
router.get('/product/:slug', async (req, res) => {
    // Skip if this is a static file request or doesn't contain a dash
    if (req.params.slug.includes('.') || !req.params.slug.includes('-')) {
        return res.status(404).send('Not found');
    }
    try {
        const { slug } = req.params;
        
        // Extract product ID from slug (last part after the last dash)
        const parts = slug.split('-');
        if (parts.length < 2) {
            return res.status(404).sendFile(path.join(__dirname, '../404.html'));
        }
        
        const productId = parts[parts.length - 1];
        
        // Validate ObjectId format
        if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
            return res.status(404).sendFile(path.join(__dirname, '../404.html'));
        }
        
        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).sendFile(path.join(__dirname, '../404.html'));
        }
        
        // Verify the slug matches the product name
        const expectedSlug = product.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const actualSlug = parts.slice(0, -1).join('-');
        
        // If slug doesn't match, redirect to correct URL
        if (actualSlug !== expectedSlug) {
            const correctSlug = `${expectedSlug}-${productId}`;
            return res.redirect(301, `/product/${correctSlug}`);
        }
        
        // Serve the product.html page with the product ID
        res.sendFile(path.join(__dirname, '../product.html'));
        
    } catch (error) {
        console.error('Error handling SEO-friendly product URL:', error);
        res.status(500).sendFile(path.join(__dirname, '../500.html'));
    }
});

// Handle legacy product URLs: /product.html?id=...
router.get('/product.html', (req, res) => {
    const { id } = req.query;
    
    if (!id) {
        return res.status(404).sendFile(path.join(__dirname, '../404.html'));
    }
    
    // Redirect to SEO-friendly URL
    res.redirect(301, `/product/legacy-${id}`);
});

// Handle legacy redirects
router.get('/product/legacy-:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find product by ID
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).sendFile(path.join(__dirname, '../404.html'));
        }
        
        // Generate SEO-friendly URL
        const slug = product.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const seoUrl = `/product/${slug}-${id}`;
        
        // Redirect to SEO-friendly URL
        res.redirect(301, seoUrl);
        
    } catch (error) {
        console.error('Error handling legacy product redirect:', error);
        res.status(500).sendFile(path.join(__dirname, '../500.html'));
    }
});

module.exports = router;
