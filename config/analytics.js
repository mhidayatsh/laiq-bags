// Analytics Configuration
module.exports = {
    // Enable/disable analytics tracking
    enabled: false, // TEMPORARILY DISABLED to prevent limit exceeding
    
    // Tracking settings
    tracking: {
        pageViews: false,
        userBehavior: false,
        conversions: false,
        sessions: false,
        realTime: false
    },
    
    // Rate limiting settings
    rateLimiting: {
        enabled: false,
        maxRequestsPerMinute: 1000,
        maxRequestsPerHour: 10000
    },
    
    // Data retention settings
    retention: {
        pageViews: 30, // days
        userBehavior: 30,
        sessions: 30,
        conversions: 90
    },
    
    // Privacy settings
    privacy: {
        anonymizeIP: true,
        respectDoNotTrack: true,
        cookieConsent: true
    }
}; 