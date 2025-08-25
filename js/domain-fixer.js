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
        
        // If we're not on www.laiq.shop, redirect
        if (currentHost === 'laiq.shop') {
            const newUrl = `${currentProtocol}//www.${currentHost}${currentPath}${currentSearch}${currentHash}`;
            console.log('🔄 Redirecting to www version:', newUrl);
            window.location.href = newUrl;
            return;
        }
        
        // If we're on www.laiq.shop, ensure all URLs use the correct domain
        if (currentHost === 'www.laiq.shop') {
            console.log('✅ Correct domain detected: www.laiq.shop');
            
            // Override window.location.origin to always return www version
            Object.defineProperty(window.location, 'origin', {
                get: function() {
                    return 'https://www.laiq.shop';
                },
                configurable: true
            });
            
            // Fix any existing meta tags that might have wrong URLs
            fixMetaTags();
        }
    }
    
    // Fix meta tags to use correct domain
    function fixMetaTags() {
        const metaTags = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"]');
        
        metaTags.forEach(tag => {
            if (tag.content && tag.content.includes('https://laiq.shop')) {
                tag.content = tag.content.replace('https://laiq.shop', 'https://www.laiq.shop');
            }
            if (tag.href && tag.href.includes('https://laiq.shop')) {
                tag.href = tag.href.replace('https://laiq.shop', 'https://www.laiq.shop');
            }
        });
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
        if (url && typeof url === 'string' && url.includes('laiq.shop') && !url.includes('www.laiq.shop')) {
            url = url.replace('laiq.shop', 'www.laiq.shop');
        }
        return originalPushState.call(this, state, title, url);
    };
    
    history.replaceState = function(state, title, url) {
        if (url && typeof url === 'string' && url.includes('laiq.shop') && !url.includes('www.laiq.shop')) {
            url = url.replace('laiq.shop', 'www.laiq.shop');
        }
        return originalReplaceState.call(this, state, title, url);
    };
    
    console.log('🔧 Domain fixer loaded - ensuring www.laiq.shop is always used');
})();
