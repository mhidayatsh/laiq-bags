// Analytics Tracker for Laiq Bags
class AnalyticsTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.pageStartTime = Date.now();
        this.currentPage = window.location.pathname;
        this.isTracking = false;
        this.analyticsEnabled = true; // Will be updated after config check
        
        // Throttling and batching
        this.pendingEvents = [];
        this.batchTimeout = null;
        this.batchInterval = 5000; // 5 seconds
        this.throttleDelay = 1000; // 1 second
        this.lastTrackTime = 0;
        
        this.init();
    }
    
    async init() {
        // Check if analytics is enabled
        try {
            const base = (window.api && window.api.baseURL) || 'http://localhost:3001/api';
            const response = await fetch(`${base}/analytics/config`);
            if (response.ok) {
                const config = await response.json();
                this.analyticsEnabled = config.enabled;
                console.log('📊 Analytics enabled:', this.analyticsEnabled);
            }
        } catch (error) {
            console.log('📊 Could not fetch analytics config, defaulting to disabled');
            this.analyticsEnabled = false;
        }
        
        // Only initialize if analytics is enabled
        if (!this.analyticsEnabled) {
            console.log('📊 Analytics disabled, skipping initialization');
            return;
        }
        
        // Track initial page view
        this.trackPageView();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Track page visibility changes
        this.setupVisibilityTracking();
        
        // Track before page unload
        this.setupUnloadTracking();
        
        // Start batch processing
        this.startBatchProcessing();
        
        console.log('📊 Analytics tracker initialized');
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUserId() {
        // Get user ID from localStorage or other sources
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user._id || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    
    // Throttled tracking to prevent too many API calls
    trackPageView() {
        if (!this.analyticsEnabled) {
            return; // Skip if analytics is disabled
        }
        
        const now = Date.now();
        if (now - this.lastTrackTime < this.throttleDelay) {
            return; // Skip if called too frequently
        }
        
        const pageData = {
            page: window.location.pathname,
            sessionId: this.sessionId,
            userId: this.userId,
            duration: Math.floor((Date.now() - this.pageStartTime) / 1000),
            referrer: document.referrer
        };
        
        this.addToBatch('pageview', pageData);
        this.lastTrackTime = now;
        this.pageStartTime = Date.now();
    }
    
    trackBehavior(action, element = null, data = {}) {
        if (!this.analyticsEnabled) {
            return; // Skip if analytics is disabled
        }
        
        const behaviorData = {
            action,
            page: window.location.pathname,
            element: element || '',
            sessionId: this.sessionId,
            userId: this.userId,
            data
        };
        
        this.addToBatch('behavior', behaviorData);
    }
    
    trackConversion(type, value = 0, details = {}) {
        if (!this.analyticsEnabled) {
            return; // Skip if analytics is disabled
        }
        
        const conversionData = {
            type,
            userId: this.userId,
            sessionId: this.sessionId,
            value,
            details
        };
        
        this.addToBatch('conversion', conversionData);
    }
    
    // Batch processing to reduce API calls
    addToBatch(type, data) {
        this.pendingEvents.push({ type, data, timestamp: Date.now() });
        
        // Process immediately if it's a conversion (important)
        if (type === 'conversion') {
            this.processBatch();
        }
    }
    
    startBatchProcessing() {
        this.batchTimeout = setInterval(() => {
            this.processBatch();
        }, this.batchInterval);
    }
    
    processBatch() {
        if (this.pendingEvents.length === 0) return;
        
        const events = [...this.pendingEvents];
        this.pendingEvents = [];
        
        // Process events in batches
        events.forEach(event => {
            try {
                switch (event.type) {
                    case 'pageview':
                        api.trackPageView(event.data).catch(error => {
                            console.error('❌ Error tracking page view:', error);
                        });
                        break;
                    case 'behavior':
                        api.trackUserBehavior(event.data).catch(error => {
                            console.error('❌ Error tracking behavior:', error);
                        });
                        break;
                    case 'conversion':
                        api.trackConversion(event.data).catch(error => {
                            console.error('❌ Error tracking conversion:', error);
                        });
                        break;
                }
            } catch (error) {
                console.error('❌ Error processing analytics event:', error);
            }
        });
    }
    
    setupEventListeners() {
        // Track clicks with throttling
        let clickTimeout;
        document.addEventListener('click', (e) => {
            if (clickTimeout) return;
            
            clickTimeout = setTimeout(() => {
                const target = e.target;
                const element = target.tagName.toLowerCase();
                const text = target.textContent?.trim().substring(0, 50) || '';
                
                this.trackBehavior('click', `${element}:${text}`, {
                    x: e.clientX,
                    y: e.clientY,
                    tagName: element,
                    className: target.className,
                    id: target.id
                });
                clickTimeout = null;
            }, 500); // Throttle clicks to 500ms
        });
        
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const formId = form.id || form.className || 'unknown_form';
            
            this.trackBehavior('form_submit', formId, {
                formId,
                formAction: form.action
            });
        });
        
        // Track scroll events (throttled)
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                this.trackBehavior('scroll', 'page', { scrollPercent });
                scrollTimeout = null;
            }, 2000); // Increased throttle to 2 seconds
        });
        
        // Track search events
        const searchInputs = document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="search"]');
        searchInputs.forEach(input => {
            let searchTimeout;
            input.addEventListener('input', (e) => {
                if (searchTimeout) clearTimeout(searchTimeout);
                
                searchTimeout = setTimeout(() => {
                    if (e.target.value.length > 2) {
                        this.trackBehavior('search', 'search_input', {
                            query: e.target.value,
                            inputId: e.target.id || e.target.name
                        });
                    }
                }, 1000); // Debounce search to 1 second
            });
        });
        
        // Track add to cart
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="add-to-cart"], .add-to-cart, button[onclick*="addToCart"]')) {
                const productId = e.target.dataset.productId || e.target.closest('[data-product-id]')?.dataset.productId;
                this.trackBehavior('add_to_cart', 'add_to_cart_button', { productId });
            }
        });
        
        // Track remove from cart
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="remove-from-cart"], .remove-from-cart, button[onclick*="removeFromCart"]')) {
                const productId = e.target.dataset.productId || e.target.closest('[data-product-id]')?.dataset.productId;
                this.trackBehavior('remove_from_cart', 'remove_from_cart_button', { productId });
            }
        });
        
        // Track wishlist actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="add-to-wishlist"], .add-to-wishlist, button[onclick*="addToWishlist"]')) {
                const productId = e.target.dataset.productId || e.target.closest('[data-product-id]')?.dataset.productId;
                this.trackBehavior('wishlist_add', 'add_to_wishlist_button', { productId });
            }
            
            if (e.target.matches('[data-action="remove-from-wishlist"], .remove-from-wishlist, button[onclick*="removeFromWishlist"]')) {
                const productId = e.target.dataset.productId || e.target.closest('[data-product-id]')?.dataset.productId;
                this.trackBehavior('wishlist_remove', 'remove_from_wishlist_button', { productId });
            }
        });
        
        // Track purchase conversions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="purchase"], .purchase, button[onclick*="placeOrder"], button[onclick*="checkout"]')) {
                this.trackConversion('purchase', 0, { source: 'button_click' });
            }
        });
        
        // Track newsletter signup
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#newsletter-form, .newsletter-form, form[action*="newsletter"]')) {
                this.trackConversion('newsletter', 0, { source: 'form_submit' });
            }
        });
        
        // Track contact form
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#contact-form, .contact-form, form[action*="contact"]')) {
                this.trackConversion('contact', 0, { source: 'form_submit' });
            }
        });
    }
    
    setupVisibilityTracking() {
        let hidden, visibilityChange;
        
        if (typeof document.hidden !== "undefined") {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
        }
        
        document.addEventListener(visibilityChange, () => {
            if (document[hidden]) {
                // Page is hidden, track time spent
                const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
                if (timeSpent > 5) { // Only track if spent more than 5 seconds
                    this.trackBehavior('page_view', this.currentPage, { timeSpent });
                }
            } else {
                // Page is visible again
                this.pageStartTime = Date.now();
            }
        });
    }
    
    setupUnloadTracking() {
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);
            if (timeSpent > 5) {
                this.trackBehavior('page_view', this.currentPage, { timeSpent });
            }
            
            // Process any pending events before unload
            if (this.pendingEvents.length > 0) {
                this.processBatch();
            }
        });
    }
    
    // Public methods for manual tracking
    trackPurchase(orderId, amount) {
        this.trackConversion('purchase', amount, { orderId });
    }
    
    trackSignup(userId) {
        this.trackConversion('signup', 0, { userId });
    }
    
    trackDownload(fileName) {
        this.trackConversion('download', 0, { fileName });
    }
    
    // Cleanup method
    destroy() {
        if (this.batchTimeout) {
            clearInterval(this.batchTimeout);
        }
        this.processBatch(); // Process any remaining events
    }
}

// Initialize analytics tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsTracker = new AnalyticsTracker();
});

// Export for use in other scripts
window.AnalyticsTracker = AnalyticsTracker; 