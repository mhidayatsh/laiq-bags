// Domain Fixer - Ensure www.laiq.shop is always used
(function() {
    'use strict';
    
    // Check if we're on the correct domain
    function checkAndFixDomain() {
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const currentHash = window.location.hash;
        
        // If we're not on www.laiq.shop, don't redirect - let API handle it
        if (currentHost !== 'www.laiq.shop') {
            console.log('ℹ️ Non-www domain detected, API will handle domain resolution');
            return;
        }
        
        // If we're on www.laiq.shop, ensure all URLs use the correct domain
        if (currentHost === 'www.laiq.shop') {
            console.log('✅ Correct domain detected: www.laiq.shop');
            
            // Create a custom origin getter that always returns www version
            if (!window._originalOrigin) {
                window._originalOrigin = window.location.origin;
            }
            
            // Override window.location.origin getter
            try {
                Object.defineProperty(window.location, 'origin', {
                    get: function() {
                        return 'https://www.laiq.shop';
                    },
                    configurable: true
                });
            } catch (e) {
                console.log('⚠️ Could not override window.location.origin, using fallback method');
                // Fallback: create a custom origin property
                window.location._customOrigin = 'https://www.laiq.shop';
            }
            
            // Fix any existing meta tags that might have wrong URLs
            fixMetaTags();
        }
    }
    
    // Fix meta tags to use correct domain
    function fixMetaTags() {
        const metaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"]');
        
        metaTags.forEach(tag => {
            if (tag.content && tag.content.includes('https://www.laiq.shop')) {
                tag.content = tag.content.replace('https://www.laiq.shop', 'https://www.laiq.shop');
            }
            if (tag.href && tag.href.includes('https://www.laiq.shop')) {
                tag.href = tag.href.replace('https://www.laiq.shop', 'https://www.laiq.shop');
            }
        });
    }
    
    // Get the correct origin (with fallback)
    function getCorrectOrigin() {
        if (window.location._customOrigin) {
            return window.location._customOrigin;
        }
        return 'https://www.laiq.shop';
    }
    
    // Run the check
    checkAndFixDomain();
    
    // Also check on page load and navigation
    window.addEventListener('load', checkAndFixDomain);
    window.addEventListener('popstate', checkAndFixDomain);
    
    // Override history.pushState and history.replaceState to ensure correct domain
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
        if (url && typeof url === 'string' && url.includes('www.laiq.shop')) {
            url = url.replace('www.laiq.shop', 'www.laiq.shop');
        }
        return originalPushState.call(this, state, title, url);
    };
    
    history.replaceState = function(state, title, url) {
        if (url && typeof url === 'string' && url.includes('www.laiq.shop')) {
            url = url.replace('www.laiq.shop', 'www.laiq.shop');
        }
        return originalReplaceState.call(this, state, title, url);
    };
    
    console.log('🔧 Domain fixer loaded - ensuring www.laiq.shop is always used');
})();
