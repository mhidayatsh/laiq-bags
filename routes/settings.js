const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

// Get website settings (public endpoint)
router.get('/', catchAsyncErrors(async (req, res) => {
    try {
        console.log('🔍 Public settings request received');
        
        // Get settings from database or return defaults
        let settings = await Settings.findOne();
        
        if (!settings) {
            // Return default settings without creating in database
            settings = {
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
            };
        }
        
        res.status(200).json({
            success: true,
            settings: {
                websiteName: settings.websiteName || 'Laiq Bags',
                websiteDescription: settings.websiteDescription || 'Premium bags and accessories',
                contactEmail: settings.contactEmail || 'info@laiqbags.com',
                contactPhone: settings.contactPhone || '+91 98765 43210',
                address: settings.address || 'Mumbai, Maharashtra, India',
                socialMedia: settings.socialMedia || {},
                theme: settings.theme || {
                    primaryColor: '#d4af37',
                    secondaryColor: '#f5f5dc'
                },
                returnPolicy: settings.returnPolicy || {
                    returnableByDefault: true,
                    replaceableByDefault: true,
                    merchantReturnDays: 7,
                    merchantReplacementDays: 7,
                    returnFees: 'free',
                    policyNotes: 'Items can be returned or replaced within the window if unused and in original packaging.'
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

module.exports = router;
