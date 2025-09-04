// Global JavaScript Functions
let cart = []
let wishlist = []
let guestCart = []
let guestWishlist = []
let settings = {}
// Lightweight suppression for accidental double-adds (same product+color within a short window)
let lastAddToCartKey = null
let lastAddToCartTime = 0

function getCartItemKey(productId, color) {
    const colorName = color ? (color.name || color) : 'default'
    return `${productId}:${colorName}`
}

// Auto-clear caches on page load if needed
document.addEventListener('DOMContentLoaded', function() {
    // Check if we need to clear caches (e.g., after admin updates)
    const shouldClearCache = sessionStorage.getItem('clearCacheOnNextLoad');
    if (shouldClearCache) {
        console.log('🔄 Auto-clearing caches on page load...');
        clearAllCaches();
        sessionStorage.removeItem('clearCacheOnNextLoad');
    }
});

// Force refresh customer page data
async function refreshCustomerData() {
    try {
        console.log('🔄 Refreshing customer page data...');
        
        // Clear API cache first
        if (api && typeof api.clearProductCache === 'function') {
            api.clearProductCache();
        }
        
        // Reload page data based on current page
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('index.html') || currentPage === '/') {
            // Home page - reload featured products
            if (typeof loadFeaturedProducts === 'function') {
                await loadFeaturedProducts();
            }
        } else if (currentPage.includes('shop.html')) {
            // Shop page - reload products with cache clearing
            if (typeof clearShopCache === 'function') {
                clearShopCache();
            }
            if (typeof forceRefreshShopProducts === 'function') {
                await forceRefreshShopProducts();
            } else if (typeof loadProductsFromAPI === 'function') {
                await loadProductsFromAPI();
            }
        } else if (currentPage.includes('product.html')) {
            // Product page - reload product details with cache clearing
            if (typeof clearProductCache === 'function') {
                clearProductCache();
            }
            if (typeof forceRefreshProductDetails === 'function') {
                await forceRefreshProductDetails();
            } else if (typeof loadProductFromAPI === 'function') {
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id');
                if (productId) {
                    await loadProductFromAPI(productId);
                }
            }
        }
        
        console.log('✅ Customer page data refreshed');
    } catch (error) {
        console.error('❌ Error refreshing customer data:', error);
    }
}

// Global refresh function - can be called from any page
window.refreshPageData = async function() {
    try {
        console.log('🔄 Refreshing page data...');
        
        // Clear API cache first
        if (api && typeof api.clearProductCache === 'function') {
            api.clearProductCache();
        }
        
        // Check if we're on admin page
        const isAdminPage = window.location.pathname.includes('admin') || 
                           document.querySelector('[data-admin-page]');
        
        if (isAdminPage) {
            // Admin page - refresh admin data
            if (typeof refreshAdminData === 'function') {
                await refreshAdminData();
            } else if (typeof loadProducts === 'function') {
                await loadProducts();
            }
        } else {
            // Customer page - refresh customer data
            await refreshCustomerData();
        }
        
        console.log('✅ Page data refreshed successfully');
    } catch (error) {
        console.error('❌ Error refreshing page data:', error);
    }
};

// Force hard refresh function - for when normal refresh doesn't work
window.forceHardRefresh = function() {
    console.log('🔄 Force hard refresh...');
    window.location.reload(true);
};

// Smart refresh function - tries normal refresh first, then hard refresh if needed
window.smartRefresh = async function() {
    try {
        console.log('🔄 Smart refresh starting...');
        
        // First try normal refresh
        await refreshPageData();
        
        // Wait a moment to see if data updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we need to force a hard refresh
        // This is a simple check - you can make it more sophisticated
        const needsHardRefresh = false; // Add logic here if needed
        
        if (needsHardRefresh) {
            console.log('🔄 Normal refresh didn\'t work, forcing hard refresh...');
            forceHardRefresh();
        } else {
            console.log('✅ Smart refresh completed successfully');
        }
    } catch (error) {
        console.error('❌ Smart refresh failed, forcing hard refresh:', error);
        forceHardRefresh();
    }
};

// Aggressive cache clearing function
window.clearAllCaches = function() {
    console.log('🗑️ Clearing all caches...');
    
    // Clear API cache
    if (api && typeof api.clearProductCache === 'function') {
        api.clearProductCache();
    }
    
    // Clear page-specific caches
    if (typeof clearShopCache === 'function') {
        clearShopCache();
    }
    
    if (typeof clearProductCache === 'function') {
        clearProductCache();
    }
    
    // Clear localStorage caches
    try {
        localStorage.removeItem('productsCache');
        localStorage.removeItem('productCache');
        localStorage.removeItem('shopCache');
        console.log('🗑️ Cleared localStorage caches');
    } catch (e) {
        console.warn('⚠️ Could not clear localStorage:', e);
    }
    
    // Clear sessionStorage
    try {
        sessionStorage.clear();
        console.log('🗑️ Cleared sessionStorage');
    } catch (e) {
        console.warn('⚠️ Could not clear sessionStorage:', e);
    }
    
    console.log('✅ All caches cleared');
};

// Force refresh with cache clearing
window.forceRefreshWithCacheClear = async function() {
    console.log('🔄 Force refresh with cache clearing...');
    
    // Clear all caches first
    clearAllCaches();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force hard refresh
    forceHardRefresh();
};

// Global flags to prevent multiple simultaneous calls
let isBackendSyncInProgress = false
let isCartLoading = false
let isWishlistLoading = false

// Load user data based on login status
function loadUserData() {
    const isLoggedIn = isCustomerLoggedIn()
    
    if (isLoggedIn) {
        // Load user cart and wishlist
        const userCartData = localStorage.getItem('userCart')
        const userWishlistData = localStorage.getItem('userWishlist')
        
        if (userCartData) {
            try {
                cart = JSON.parse(userCartData)
                // Ensure all cart items have required fields
                cart = cart.map(item => ({
                    id: item.id || item.productId || 'unknown',
                    productId: item.productId || item.id || 'unknown',
                    name: item.name || 'Unknown Product',
                    price: parseFloat(item.price) || 0,
                    image: item.image || item.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo = ',
                    qty: parseInt(item.qty) || parseInt(item.quantity) || 1,
                    color: item.color || null,
                }))
            } catch (error) {
                console.error('❌ Error parsing user cart data:', error)
                cart = []
            }
        } else {
            cart = []
        }
        
        if (userWishlistData) {
            try {
                wishlist = JSON.parse(userWishlistData)
                // Ensure all wishlist items have required fields
                wishlist = wishlist.map(item => {
                    if (typeof item === 'string') {
                        // Legacy format - just ID
                        return {
                            id: item,
                            productId: item,
                            name: 'Product',
                            price: 0,
                            image: 'assets/thumbnail.jpg'
                        }
                    } else if (typeof item === 'object') {
                        // New format - product object
                        return {
                            id: item.id || item._id || 'unknown',
                            productId: item.productId || item.id || item._id || 'unknown',
                            name: item.name || 'Unknown Product',
                            price: parseFloat(item.price) || 0,
                            image: item.image || item.images?.[0]?.url || 'assets/thumbnail.jpg'
                        }
                    } else {
                        console.warn('⚠️ Invalid wishlist item:', item)
                        return null
                    }
                }).filter(item => item !== null); // Remove invalid items
            } catch (error) {
                console.error('❌ Error parsing user wishlist data:', error)
                wishlist = []
            }
        } else {
            wishlist = []
        }
        
        console.log('👤 Loading user data:', { 
            cart: cart.length, 
            wishlist: wishlist.length,
            userCartData: userCartData,
            userWishlistData: userWishlistData
        })
    } else {
        // Load guest cart and wishlist
        const guestCartData = localStorage.getItem('guestCart')
        const guestWishlistData = localStorage.getItem('guestWishlist')
        
        if (guestCartData) {
            try {
                guestCart = JSON.parse(guestCartData)
                // Ensure all guest cart items have required fields
                guestCart = guestCart.map(item => ({
                    id: item.id || item.productId || 'unknown',
                    productId: item.productId || item.id || 'unknown',
                    name: item.name || 'Unknown Product',
                    price: parseFloat(item.price) || 0,
                    image: item.image || item.images?.[0]?.url || 'assets/thumbnail.jpg',
                    qty: parseInt(item.qty) || parseInt(item.quantity) || 1,
                    color: item.color || null
                }))
                console.log('📦 Guest cart loaded:', guestCart.length, 'items')
            } catch (error) {
                console.error('❌ Error parsing guest cart data:', error)
                guestCart = []
            }
        } else {
            guestCart = []
        }
        
        if (guestWishlistData) {
            try {
                guestWishlist = JSON.parse(guestWishlistData)
                // Ensure all guest wishlist items have required fields
                guestWishlist = guestWishlist.map(item => {
                    if (typeof item === 'string') {
                        return {
                            id: item,
                            productId: item,
                            name: 'Product',
                            price: 0,
                            image: 'assets/thumbnail.jpg'
                        }
                    } else if (typeof item === 'object') {
                        return {
                            id: item.id || item._id || 'unknown',
                            productId: item.productId || item.id || item._id || 'unknown',
                            name: item.name || 'Unknown Product',
                            price: parseFloat(item.price) || 0,
                            image: item.image || item.images?.[0]?.url || 'assets/thumbnail.jpg'
                        }
                    } else {
                        console.warn('⚠️ Invalid guest wishlist item:', item)
                        return null
                    }
                }).filter(item => item !== null)
                console.log('❤️ Guest wishlist loaded:', guestWishlist.length, 'items')
            } catch (error) {
                console.error('❌ Error parsing guest wishlist data:', error)
                guestWishlist = []
            }
        } else {
            guestWishlist = []
        }
        
        console.log('👤 Guest data loaded:', { 
            guestCart: guestCart.length, 
            guestWishlist: guestWishlist.length 
        })
    }
    
    // Update counts after loading data
    updateCartCount()
    updateWishlistCount()
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌐 Main.js initialized')
    
    if (window.mainInitialized) {
        console.log('⚠️ Main.js already initialized, skipping...')
        return
    }
    window.mainInitialized = true
    
    // Never block UI on network calls: wire up UI instantly
    try {
        const currentPage = window.location.pathname
        const isAuthPage = currentPage.includes('customer-login.html') || 
                           currentPage.includes('customer-register.html') ||
                           currentPage.includes('admin-login.html') ||
                           currentPage.includes('admin-register.html') ||
                           currentPage.includes('forgot-password.html') ||
                           currentPage.includes('reset-password.html')

        console.log('📄 Current page:', currentPage, 'Is auth page:', isAuthPage)

        // 1) Load local data and attach UI handlers immediately
        loadUserData()
        loadGuestCart(); // Ensure guest data is loaded
        clearInvalidCartData()
        initializeNavbar()
        initializeCart()
        initializeWishlist()
        initializeBackToTop()
        initializeLoading()
        initializeQuickView()
        initializeNewsletter()
        initializeContactForm()
        // Ensure logout buttons are always bound (desktop + mobile)
        bindLogoutButtons()
        
        // Update counts immediately from localStorage
        updateAllCounts()

        // 2) Kick off settings and auth in background
        loadSettings().catch(err => console.error('❌ Settings load failed:', err))

        if (!isAuthPage) {
            // Don't await; let it run and enhance state later
            initializeCustomerAuth().catch(err => console.error('❌ Auth init failed:', err))
        }
        
        // Listen for settings updates from admin panel
        listenForSettingsUpdates()

        // 3) If logged-in, do backend sync soon after without blocking UI
        if (isCustomerLoggedIn() && !isBackendSyncInProgress) {
            isBackendSyncInProgress = true
            setTimeout(async () => {
                try {
                    await loadCartFromBackend()
                    await loadWishlistFromBackend()
                } catch (error) {
                    console.error('❌ Backend sync failed:', error)
                } finally {
                    isBackendSyncInProgress = false
                    debouncedUpdateAllCounts()
                    updateAllWishlistButtonsOnPage()
                }
            }, 100)
        } else {
            // Ensure wishlist button states are refreshed
            setTimeout(updateAllWishlistButtonsOnPage, 100)
        }

        // Hide loading overlay a bit later regardless
        const loadingOverlay = document.getElementById('loading-overlay')
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.style.display = 'none'
            }, 500)
        }

        console.log('✅ Main.js ready')
    } catch (error) {
        console.error('❌ Error in main.js initialization:', error)
        window.mainInitialized = false
        isBackendSyncInProgress = false
        const loadingOverlay = document.getElementById('loading-overlay')
        if (loadingOverlay) loadingOverlay.style.display = 'none'
    }
})

// Check if user is logged in
function isCustomerLoggedIn() {
    const token = localStorage.getItem('customerToken');
    if (!token || token === 'undefined') {
        return false;
    }
    
    try {
        // Verify token is valid by checking expiration
        const payload = parseJwt(token);
        if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn('🔒 Token expired, removing.');
            localStorage.removeItem('customerToken');
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Error checking token validity:', error);
        localStorage.removeItem('customerToken');
        return false;
    }
}

// Switch user function - clears current user data
function switchCustomerUser() {
    console.log('🔄 Switching customer user...')
    
    // Clear all customer-related data
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerUser')
    localStorage.removeItem('userCart')
    localStorage.removeItem('userWishlist')
    
    // Clear guest data too
    localStorage.removeItem('guestCart')
    localStorage.removeItem('guestWishlist')
    
    // Reset cart and wishlist arrays
    cart = []
    wishlist = []
    
    // Show success message
    showToast('Logged out successfully. You can now login with a different account.', 'success')
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = '/customer-login.html'
    }, 1500)
}

// Load user cart from localStorage
function loadUserCart() {
    try {
        const userCartData = localStorage.getItem('userCart')
        if (userCartData) {
            try {
                const userCart = JSON.parse(userCartData)
                console.log('📥 Loaded user cart from localStorage:', userCart.length, 'items')
                
                // Normalize data structure
                return userCart.map(item => ({
                    id: item.id || item.productId || 'unknown',
                    productId: item.productId || item.id || 'unknown',
                    name: item.name || 'Unknown Product',
                    price: parseFloat(item.price) || 0,
                    image: item.image || 'assets/thumbnail.jpg',
                    qty: parseInt(item.qty) || parseInt(item.quantity) || 1,
                    color: item.color || null,
                }))
            } catch (parseError) {
                console.error('❌ Error parsing user cart from localStorage:', parseError)
                return []
            }
        }
        return []
    } catch (error) {
        console.error('❌ Error loading user cart:', error)
        return []
    }
}

// Save user cart to localStorage with compression
function saveUserCart() {
    try {
        // Compress cart data to reduce storage size
        const cartData = JSON.stringify(cart)
        
        // Check if data is too large
        if (cartData.length > 5000000) { // 5MB limit
            console.warn('⚠️ Cart data too large, compressing...')
            
            // Keep only essential data
            const compressedCart = cart.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                color: item.color,
                // Remove large fields
                name: item.name?.substring(0, 50),
                price: item.price,
                image: null // Remove image to save space
            }))
            
            localStorage.setItem('userCart', JSON.stringify(compressedCart))
            console.log('✅ Compressed cart saved')
        } else {
            localStorage.setItem('userCart', cartData)
        }
        
        console.log('✅ User cart saved:', cart.length, 'items')
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('⚠️ Storage quota exceeded, clearing old data...')
            
            // Clear old data
            clearOldCartData()
            
            // Try to save minimal data
            try {
                const minimalCart = cart.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    quantity: item.quantity
                }))
                localStorage.setItem('userCart', JSON.stringify(minimalCart))
                console.log('✅ Saved minimal cart data')
            } catch (retryError) {
                console.error('❌ Failed to save even minimal cart data:', retryError)
                // Clear cart to prevent further issues
                cart = []
            }
        } else {
            console.error('❌ Error saving user cart:', error)
        }
    }
}

// Save user wishlist to localStorage
function saveUserWishlist(wishlist) {
    try {
        // Compress wishlist data by keeping only essential fields
        const compressedWishlist = wishlist.map(item => ({
            id: item._id || item.id,
            name: item.name?.substring(0, 30), // Limit name length
            price: item.price || 0
        }))
        
        localStorage.setItem('userWishlist', JSON.stringify(compressedWishlist))
        console.log('✅ Wishlist saved to localStorage:', compressedWishlist.length, 'items')
    } catch (error) {
        console.error('❌ Error saving wishlist:', error)
        
        if (error.name === 'QuotaExceededError') {
            console.log('🧹 Clearing old data due to quota exceeded')
            // Clear old data and try again
            try {
                // Clear all localStorage data
                localStorage.clear()
                
                // Try with even more minimal data
                const minimalWishlist = wishlist.map(item => ({
                    id: item._id || item.id,
                    name: item.name?.substring(0, 20) // Even shorter name
                }))
                
                localStorage.setItem('userWishlist', JSON.stringify(minimalWishlist))
                console.log('✅ Wishlist saved with minimal data')
            } catch (retryError) {
                console.error('❌ Failed to save wishlist even after clearing:', retryError)
                // Store only IDs as final fallback
                const wishlistIds = wishlist.map(item => item._id || item.id)
                localStorage.setItem('userWishlistIds', JSON.stringify(wishlistIds))
                console.log('✅ Saved only wishlist IDs as fallback')
            }
        }
    }
}

// Save guest cart
function saveGuestCart() {
    try {
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
        const savedData = localStorage.getItem('guestCart')
        if (savedData) {
            console.log('✅ Guest cart saved to localStorage:', guestCart.length, 'items')
            debugGuestData('SAVE_CART', guestCart)
        } else {
            console.error('❌ Failed to save guest cart to localStorage')
        }
    } catch (error) {
        console.error('❌ Error saving guest cart:', error)
    }
}

// Save guest wishlist
function saveGuestWishlist() {
    localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist))
    const savedData = localStorage.getItem('guestWishlist')
        if (savedData) {
        console.log('✅ Guest wishlist saved to localStorage:', guestWishlist.length, 'items')
        debugGuestData('SAVE_WISHLIST', guestWishlist)
    }
}

// Merge guest data with user data on login
async function mergeGuestDataWithUser(userId) {
    console.log('🔄 Checking for guest data to merge...');
    const guestData = getGuestData();

    const guestCart = guestData.cart || [];
    const guestWishlist = guestData.wishlist || [];
    
    console.log('📦 Fresh guest cart from localStorage:', guestCart.length, 'items', guestCart)
    console.log('❤️ Fresh guest wishlist from localStorage:', guestWishlist.length, 'items', guestWishlist)
    console.log('📦 Current user cart:', cart.length, 'items', cart)
    console.log('❤️ Current user wishlist:', wishlist.length, 'items', wishlist)
    
    // Check if merge is already in progress
    if (window.mergeInProgress) {
        console.log('⚠️ Merge already in progress, skipping...')
        return
    }
    
    window.mergeInProgress = true
    
    try {
        // Merge fresh guest cart with backend WITHOUT clearing existing items
        if (guestCart.length > 0) {
            // Normalize and combine duplicate guest items by (productId + color)
            const guestMap = new Map();
            for (const rawItem of guestCart) {
                const productId = rawItem.productId || rawItem.id || 'unknown';
                if (!productId || productId === 'unknown' || productId === 'undefined' || productId === 'null') {
                    console.warn('⚠️ Skipping guest cart item with invalid product ID:', rawItem);
                    continue;
                }
                const colorName = rawItem.color ? (rawItem.color.name || rawItem.color) : 'default';
                const key = `${productId}::${colorName}`;
                const qty = parseInt(rawItem.qty) || parseInt(rawItem.quantity) || 1;
                if (!guestMap.has(key)) {
                    guestMap.set(key, { productId, qty, color: rawItem.color || (colorName !== 'default' ? { name: colorName } : null) });
                } else {
                    const entry = guestMap.get(key);
                    entry.qty += qty;
                }
            }

            // Apply only the guest deltas to backend so existing user cart is preserved
            for (const [key, item] of guestMap.entries()) {
                try {
                    console.log('➕ Merging guest item into backend cart:', { productId: item.productId, qty: item.qty, color: item.color });
                    await api.addToCart(item.productId, item.qty, item.color || null);
                    // Small delay to avoid rate limits
                    await new Promise(r => setTimeout(r, 30));
                } catch (error) {
                    console.error('❌ Failed merging guest item to backend:', item.productId, error);
                }
            }

            // Refresh local cart view from backend after merge
            try {
                await loadCartFromBackend();
                console.log('✅ Guest cart merged with backend and local cart refreshed');
            } catch (e) {
                console.warn('⚠️ Could not refresh cart from backend after merge:', e);
            }
        }
        
        // Merge fresh guest wishlist with user wishlist AND sync to backend
        if (guestWishlist.length > 0) {
            // Normalize guest wishlist items
            const normalizedGuestWishlist = guestWishlist.map(item => {
                if (typeof item === 'string') {
                    return {
                        id: item,
                        productId: item,
                        name: 'Product',
                        price: 0,
                        image: 'assets/thumbnail.jpg'
                    }
                } else if (typeof item === 'object') {
                    return {
                        id: item.id || item._id || 'unknown',
                        productId: item.productId || item.id || item._id || 'unknown',
                        name: item.name || 'Unknown Product',
                        price: parseFloat(item.price) || 0,
                        image: item.image || item.images?.[0]?.url || 'https://via.placeholder.com/56x56?text=Product'
                }
                }
                return null
            }).filter(item => item !== null)
            
            let backendWishlist = []
            let skipDedupe = false
            try {
                // Reduce timeout to 6 seconds for better UX (was 10s)
                const backendResponse = await api.getCustomerWishlist({ timeoutMs: 25000 }) // Align with backend wishlist timeout
                if (backendResponse.success) {
                    backendWishlist = backendResponse.wishlist || []
                    console.log('📋 Current backend wishlist:', backendWishlist.length, 'items')
                } else {
                    skipDedupe = true
                }
            } catch (error) {
                console.error('❌ Error getting backend wishlist:', error)
                // Fallback: if we cannot read backend state, try adding all and let backend dedupe
                skipDedupe = true
            }
            
            // Prepare items to add (fallback to all guest items if backend fetch failed)
            const itemsToAdd = skipDedupe
                ? normalizedGuestWishlist
                : normalizedGuestWishlist.filter(guestItem => 
                    !backendWishlist.some(backendItem => {
                        const backendId = backendItem._id || backendItem.id
                        const guestId = guestItem.id || guestItem.productId
                        return backendId === guestId
                    })
                  )
             
            console.log('📋 Items to add to wishlist:', itemsToAdd.length, 'out of', normalizedGuestWishlist.length)
            
            // Add only new items to backend with shorter timeout
            for (const wishlistItem of itemsToAdd) {
                try {
                    const productId = wishlistItem.id || wishlistItem.productId
                    console.log('➕ Attempting to add wishlist item:', productId)
                    
                    // Use shorter timeout for individual wishlist additions
                    const addResponse = await api.addToCustomerWishlist(productId, { timeoutMs: 5000 })
                    
                    if (addResponse.success) {
                        console.log('✅ Successfully added wishlist item:', productId)
                    } else {
                        console.log('⚠️ Wishlist item response not successful:', productId, addResponse)
                    }
                } catch (error) {
                    // Handle specific error cases more gracefully
                    if (error.message && error.message.includes('already in wishlist')) {
                        console.log('ℹ️ Wishlist item already exists in backend:', wishlistItem.id)
                    } else if (error.message && error.message.includes('Product not found')) {
                        console.log('⚠️ Product not found in backend:', wishlistItem.id)
                    } else if (error.message && error.message.includes('timeout')) {
                        console.log('⏰ Wishlist item addition timed out:', wishlistItem.id)
                    } else {
                        console.error('❌ Error syncing guest wishlist item to backend:', wishlistItem.id, error)
                    }
                }
            }
            
            // Reload wishlist from backend to sync properly (with shorter timeout)
            try {
                console.log('🔄 Reloading wishlist from backend after guest merge...')
                await loadWishlistFromBackend()
                console.log('✅ Guest wishlist merged and synced with backend')
            } catch (error) {
                console.error('❌ Error reloading wishlist from backend:', error)
                // Continue with local state if backend reload fails
            }
        }
        
        // Clear guest data after successful merge
        if (guestCart.length > 0 || guestWishlist.length > 0) {
            localStorage.removeItem('guestCart');
            localStorage.removeItem('guestWishlist');
            console.log('🧹 Guest data cleared from localStorage after merge');
            // Update counts post-clear
            updateAllCounts();
        }
    } finally {
        window.mergeInProgress = false
    }
}

// Clear old cart data
function clearOldCartData() {
    // Check if cart has old format data
    const oldCart = localStorage.getItem('cart')
    if (oldCart) {
        try {
            const parsedCart = JSON.parse(oldCart)
            // If cart has old format (without proper structure), clear it
            if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                const hasOldFormat = parsedCart.some(item => !item.id || !item.name || !item.price)
                if (hasOldFormat) {
                    console.log('🧹 Clearing old cart data format')
                    localStorage.removeItem('cart')
                    cart = []
                }
            }
        } catch (error) {
            console.log('🧹 Clearing corrupted cart data')
            localStorage.removeItem('cart')
            cart = []
        }
    }
}

// Load settings from backend
async function loadSettings() {
    try {
        console.log('⚙️ Loading website settings...')
        
        // Try to load settings from backend
        const response = await api.getSettings()
        
        if (response.success) {
            settings = response.settings
            console.log('✅ Settings loaded from backend:', settings)
        } else {
            // Fallback to default settings
            settings = {
                websiteName: 'Laiq Bags',
                contactEmail: 'mdhidayatulahsheikh786@gmail.com',
                instagramHandle: '@laiq_bags_',
                whatsappNumber: '+91 99999 99999'
            }
            console.log('⚠️ Using default settings')
        }
        
        // Update website elements with settings
        updateWebsiteWithSettings()
        console.log('✅ Settings applied to website')
    } catch (error) {
        console.error('❌ Error loading settings:', error)
        // Fallback to default settings
        settings = {
            websiteName: 'Laiq Bags',
            contactEmail: 'mdhidayatulahsheikh786@gmail.com',
            instagramHandle: '@laiq_bags_',
            whatsappNumber: '+91 99999 99999'
        }
        updateWebsiteWithSettings()
        console.log('✅ Fallback settings applied')
    }
}

// Update website elements with settings
function updateWebsiteWithSettings() {
    if (!settings) return
    
    console.log('🔄 Updating website with settings:', settings)
    
    // Update website name
    const websiteNameElements = document.querySelectorAll('.website-name')
    websiteNameElements.forEach(element => {
        element.textContent = settings.websiteName || 'Laiq Bags';
    });
    
    // Update contact email
    const contactEmailElements = document.querySelectorAll('.contact-email, .footer-contact-email')
    contactEmailElements.forEach(element => {
        element.textContent = settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com';
        element.href = `mailto:${settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com'}`;
    });
    
    // Update Instagram handle
    const instagramElements = document.querySelectorAll('.instagram-handle, .footer-instagram')
    instagramElements.forEach(element => {
        element.textContent = settings.instagramHandle || '@laiq_bags_';
        element.href = `https://www.instagram.com/${settings.instagramHandle?.replace('@', '') || 'laiq_bags_'}`;
    });
    
    // Update WhatsApp number
    const whatsappElements = document.querySelectorAll('.whatsapp-number, .footer-whatsapp')
    whatsappElements.forEach(element => {
        const cleanNumber = settings.whatsappNumber?.replace(/\D/g, '') || '919999999999';
        element.textContent = settings.whatsappNumber || '+91 99999 99999';
        element.href = `https://wa.me/${cleanNumber}`;
    });
    
    console.log('✅ Website updated with settings')
}

// Listen for settings updates from admin panel
function listenForSettingsUpdates() {
    console.log('👂 Listening for settings updates...');
    
    // Listen for custom events
    window.addEventListener('settingsUpdated', (event) => {
        console.log('🔄 Settings update received via event:', event.detail);
        handleSettingsUpdate(event.detail.settings);
    });
    
    // Check localStorage for updates periodically
    setInterval(() => {
        const settingsUpdate = localStorage.getItem('settingsUpdate');
        if (settingsUpdate) {
            try {
                const update = JSON.parse(settingsUpdate);
                const lastUpdate = localStorage.getItem('lastSettingsUpdate');
                
                // Only process if this is a new update
                if (!lastUpdate || update.timestamp > parseInt(lastUpdate)) {
                    console.log('🔄 Settings update detected in localStorage:', update);
                    localStorage.setItem('lastSettingsUpdate', update.timestamp.toString());
                    handleSettingsUpdate(update.settings);
                }
            } catch (error) {
                console.error('❌ Error parsing settings update:', error);
            }
        }
    }, 2000); // Check every 2 seconds
}

// Handle settings update
function handleSettingsUpdate(newSettings) {
    console.log('🔄 Applying settings update:', newSettings);
    
    // Update the global settings object
    settings = { ...settings, ...newSettings };
    
    // Update the website with new settings
    updateWebsiteWithSettings();
    
    // Show a notification to the user
    showToast('Website settings have been updated!', 'info');
    
    console.log('✅ Settings update applied successfully');
}

// Update footer with settings
function updateFooterWithSettings() {
    const footer = document.querySelector('footer')
    if (footer) {
        // Update contact info in footer
        const footerContactEmail = footer.querySelector('.footer-contact-email')
        if (footerContactEmail) {
            footerContactEmail.textContent = settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com';
            footerContactEmail.href = `mailto:${settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com'}`;
        }
        
        const footerInstagram = footer.querySelector('.footer-instagram')
        if (footerInstagram) {
            footerInstagram.textContent = settings.instagramHandle || '@laiq_bags_';
            footerInstagram.href = `https://www.instagram.com/${settings.instagramHandle?.replace('@', '') || 'laiq_bags_'}`;
        }
        
        const footerWhatsapp = footer.querySelector('.footer-whatsapp')
        if (footerWhatsapp) {
            footerWhatsapp.textContent = settings.whatsappNumber || '+91 99999 99999';
            const phoneNumber = settings.whatsappNumber?.replace(/\s/g, '') || '+919999999999';
            footerWhatsapp.href = `https://wa.me/${phoneNumber}`;
        }
    }
}

// Navbar functionality
function initializeNavbar() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn')
    const mobileMenu = document.getElementById('mobile-menu')
    const menuOpen = document.getElementById('menu-open')
    const menuClose = document.getElementById('menu-close')
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden')
            if (menuOpen) menuOpen.classList.toggle('hidden')
            if (menuClose) menuClose.classList.toggle('hidden')
        })
    }
}

// Cart functionality
function initializeCart() {
    // Cart icon handler - expanded selectors
    const cartIcon = document.querySelector('#cart-btn, .cart-icon, [data-cart-btn], button[onclick*="cart"], a[href*="cart"], .cart-button, [data-cart], .shopping-cart, .cart-link')
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault()
            toggleCartDrawer()
        })
        console.log('✅ Cart icon handler added')
    } else {
        console.warn('⚠️ Cart icon not found - this is normal on pages without cart functionality')
    }
    
    // Mobile cart link handler - expanded selectors
    const mobileCartLink = document.querySelector('#mobile-cart-link, .mobile-cart-link, [data-mobile-cart], a[href*="cart"], .mobile-cart, .mobile-cart-btn')
    if (mobileCartLink) {
        mobileCartLink.addEventListener('click', function(e) {
            e.preventDefault()
            toggleCartDrawer()
        })
        console.log('✅ Mobile cart link handler added')
    } else {
        console.warn('⚠️ Mobile cart link not found - this is normal on pages without mobile cart functionality')
    }
    
    // Create cart drawer
    createCartDrawer()
}

function createCartDrawer() {
    // Remove existing drawer if any
    const existingDrawer = document.getElementById('cart-drawer')
    if (existingDrawer) {
        existingDrawer.remove()
    }
    
    const drawer = document.createElement('div')
    drawer.id = 'cart-drawer';
    drawer.className = 'fixed top-0 right-0 h-screen w-80 md:w-96 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50';
    drawer.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="flex items-center justify-between p-4 border-b border-beige">
                <h3 class="text-lg font-semibold">Shopping Cart (<span id="cart-item-count">0</span>)</h3>
                <button class="close-cart text-2xl hover:text-gold transition-colors" type="button">&times;</button>
            </div>
            <div class="flex-1 overflow-y-auto p-4" id="cart-items">
                <!-- Cart items will be rendered here -->
            </div>
            <div class="border-t border-beige p-4">
                <div class="flex justify-between items-center mb-4">
                    <span class="font-semibold">Total:</span>
                    <span class="font-bold text-gold" id="cart-total">₹0</span>
                </div>
                <div class="flex gap-2 mb-3">
                    <button class="clear-cart flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                        Clear Cart
                    </button>
                </div>
                <button class="checkout-btn w-full bg-gold text-white py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                    Proceed to Checkout
                </button>
            </div>
        </div>
    `
    
    document.body.appendChild(drawer)
    
    // Close button handler - prevent event bubbling
    const closeBtn = drawer.querySelector('.close-cart')
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleCartDrawer()
    })
    
    // Clear cart button handler
    const clearBtn = drawer.querySelector('.clear-cart')
    clearBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        clearCart()
    })
    
    // Checkout button handler
    const checkoutBtn = drawer.querySelector('.checkout-btn')
    checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        proceedToCheckout()
    })
    
    // Close on backdrop click
    drawer.addEventListener('click', (e) => {
        if (e.target === drawer) {
            toggleCartDrawer()
        }
    })
    
    // Render cart items after a small delay to ensure DOM is ready
    setTimeout(() => {
        renderCartDrawer()
    }, 100)
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer')
    if (!drawer) {
        console.error('❌ Cart drawer not found')
        return
    }
    
    const isOpen = !drawer.classList.contains('translate-x-full')
    
    if (isOpen) {
        // Close drawer
        drawer.classList.add('translate-x-full')
        // Restore original body overflow and remove any horizontal scroll issues
        document.body.style.overflow = '';
        document.body.style.overflowX = 'hidden';
        console.log('🛒 Cart drawer closed')
    } else {
        // Open drawer
        drawer.classList.remove('translate-x-full')
        // Prevent body scroll but maintain horizontal overflow hidden
        document.body.style.overflow = 'hidden';
        document.body.style.overflowX = 'hidden';
        
        // Load and render cart data
        const isGuest = !isCustomerLoggedIn();
        let cartData = []
        
        if (isGuest) {
            cartData = guestCart || []
            console.log('🛒 Loading guest cart data:', cartData.length, 'items')
        } else {
            // For logged-in users, load from backend
            loadCartFromBackend().then(() => {
                renderCartDrawer(cart || [])
            })
            return
        }
        
        renderCartDrawer(cartData)
        console.log('🛒 Cart drawer opened with', cartData.length, 'items')
    }
}

async function renderCartDrawer(items = null) {
    // Ensure cart drawer exists
    let drawer = document.getElementById('cart-drawer')
    if (!drawer) {
        console.log('🛒 Creating cart drawer...')
        createCartDrawer()
        drawer = document.getElementById('cart-drawer')
    }
    
    const cartItemsContainer = document.getElementById('cart-items')
    const cartTotal = document.getElementById('cart-total')
    const cartItemCount = document.getElementById('cart-item-count')
    
    if (!cartItemsContainer || !cartTotal) {
        console.error('❌ Cart drawer elements not found, recreating drawer...')
        createCartDrawer()
        // Try again after recreation
        setTimeout(() => {
            renderCartDrawer(items)
        }, 100)
        return
    }
    
    // Use provided items or get current cart
    let currentItems = items;
    if (!currentItems) {
        if (isCustomerLoggedIn()) {
            currentItems = cart;
        } else {
            currentItems = guestCart;
        }
    }
    
    // Ensure currentItems is an array before proceeding
    if (!Array.isArray(currentItems)) {
        console.warn('🛒 renderCartDrawer received non-array items, defaulting to empty array:', currentItems);
        currentItems = [];
    }
    
    console.log('🛒 Rendering cart drawer with items:', currentItems)
    
    // Update cart item count
    const totalQuantity = currentItems.reduce((sum, item) => sum + (parseInt(item.qty) || parseInt(item.quantity) || 1), 0)
    if (cartItemCount) {
        cartItemCount.textContent = totalQuantity
    }
    
    if (!currentItems || currentItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                <p class="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
            </div>
        `
        cartTotal.textContent = '₹0';
        return;
    }
    
    // Calculate total
    const total = currentItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0
        const quantity = parseInt(item.qty) || parseInt(item.quantity) || 1
        return sum + (price * quantity)
    }, 0)
    
    cartTotal.textContent = `₹${total.toFixed(2)}`
    
    // Render cart items
    const cartItemsHTML = currentItems.map(item => {
        const quantity = parseInt(item.qty) || parseInt(item.quantity) || 1
        const price = parseFloat(item.price) || 0
        const itemTotal = price * quantity
        const image = item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdDwvdGV4dD4KPC9zdmc+Cg = =';
        const color = item.color ? ` (${item.color.name || item.color})` : '';
        const productId = item.id || item.productId;
        
        // Create unique identifier that includes both productId and color
        const colorName = item.color ? (item.color.name || item.color) : 'default';
        const uniqueId = `${productId}_${colorName}`;
        
        return `
            <div class="cart-item flex items-center space-x-4 py-4 border-b border-gray-200" data-product-id="${productId}" data-unique-id="${uniqueId}" data-color="${colorName}">
                <img src="${image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                <div class="flex-1">
                    <h4 class="text-sm font-medium text-gray-900">${item.name}${color}</h4>
                    <p class="text-sm text-gray-500">₹${price.toFixed(2)}</p>
                    <div class="flex items-center space-x-2 mt-2">
                        <button class="quantity-btn minus text-gray-500 hover:text-gold" data-action="decrease" data-id="${uniqueId}">-</button>
                        <span class="quantity-display text-sm font-medium">${quantity}</span>
                        <button class="quantity-btn plus text-gray-500 hover:text-gold" data-action="increase" data-id="${uniqueId}">+</button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">₹${itemTotal.toFixed(2)}</p>
                    <button class="remove-item text-red-500 hover:text-red-700 text-sm mt-1" data-product-id="${productId}" data-unique-id="${uniqueId}" data-color="${colorName}">
                        Remove
                    </button>
                </div>
            </div>
        `
    }).join('')
    
    cartItemsContainer.innerHTML = cartItemsHTML
    
    // Add event listeners to cart items
    addCartEventListeners()
    
    console.log('✅ Cart drawer rendered successfully')
}

function addCartEventListeners() {
    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange)
    })
    
    // Remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', handleRemoveFromCart)
    })
}

// Debounce function to prevent rapid API calls
let quantityUpdateTimeout = null

function handleQuantityChange(e) {
    const btn = e.currentTarget
    const uniqueId = btn.dataset.id; // This contains productId_colorName
    const action = btn.dataset.action
    
    if (!uniqueId) {
        console.error('❌ Unique ID not found for quantity change')
        return
    }
    
    // Parse uniqueId to get productId and colorName
    const [productId, colorName] = uniqueId.split('_')
    
    console.log('🔄 Quantity change:', action, 'for product:', { productId, colorName, uniqueId })
    
    if (!productId) {
        console.error('❌ Product ID not found for quantity change')
        return
    }
    
    // Prevent rapid clicks
    if (btn.disabled) return
    btn.disabled = true
    
    setTimeout(() => {
        btn.disabled = false
    }, 1000)
    
    if (isCustomerLoggedIn()) {
        // Find exact item by productId AND color
        const item = cart.find(item => {
            const idMatch = item.id === productId || item.productId === productId;
            const itemColorName = item.color ? (item.color.name || item.color) : 'default';
            return idMatch && itemColorName === colorName;
        });
        if (!item) {
            console.error('❌ Cart item not found for color variant:', { productId, colorName })
            return
        }
        
        let newQuantity = parseInt(item.qty) || parseInt(item.quantity) || 1
        
        if (action === 'increase') {
            newQuantity += 1
            console.log('➕ Increased quantity to:', newQuantity)
        } else if (action === 'decrease') {
            newQuantity -= 1
            console.log('➖ Decreased quantity to:', newQuantity)
            if (newQuantity <= 0) {
                // Use unique removal already color-aware
                removeItemFromCart(uniqueId)
                return
            }
        }
        
        // Update quantity locally first
        item.qty = newQuantity
        saveUserCart()
        renderCartDrawer()
        updateCartCount()
        
        // Debounce API call to prevent multiple rapid requests
        clearTimeout(quantityUpdateTimeout)
        quantityUpdateTimeout = setTimeout(() => {
            updateCartItemQuantity(productId, newQuantity, colorName)
        }, 500)
        
        // Show feedback
        if (action === 'increase') {
            showToast('Quantity increased', 'info')
        } else if (action === 'decrease') {
            showToast('Quantity decreased', 'info')
        }
    } else {
        // For guest users, find by productId AND color
        const item = guestCart.find(item => {
            const idMatch = item.id === productId || item.productId === productId;
            const itemColorName = item.color ? (item.color.name || item.color) : 'default';
            return idMatch && itemColorName === colorName;
        });
        if (!item) {
            console.error('❌ Guest cart item not found for color variant:', { productId, colorName })
            return
        }
        
        let currentQty = parseInt(item.qty) || parseInt(item.quantity) || 1
        
        if (action === 'increase') {
            currentQty += 1
            console.log('➕ Increased quantity to:', currentQty)
        } else if (action === 'decrease') {
            currentQty -= 1
            console.log('➖ Decreased quantity to:', currentQty)
            if (currentQty <= 0) {
                // Remove this specific color variant
                guestCart = guestCart.filter(cartItem => {
                    const cartItemId = cartItem.id || cartItem.productId;
                    const cartItemColorName = cartItem.color ? (cartItem.color.name || cartItem.color) : 'default';
                    return !(cartItemId === productId && cartItemColorName === colorName);
                });
                console.log('🗑️ Removed color variant from guest cart')
            }
        }
        
        if (currentQty > 0) {
            item.qty = currentQty
        }
        
        saveGuestCart()
        renderCartDrawer()
        updateCartCount()
        
        // Show feedback
        if (action === 'increase') {
            showToast('Quantity increased', 'info')
        } else if (action === 'decrease') {
            if (currentQty > 0) {
                showToast('Quantity decreased', 'info')
            } else {
                showToast('Item removed from cart', 'info')
            }
        }
    }
}

// Direct API call to update cart item quantity
async function updateCartItemQuantity(productId, quantity, color = null) {
    try {
        console.log('🔄 Updating cart item quantity:', { productId, quantity, color })
        const response = await api.updateCartItem(productId, quantity, color)
        
        if (response.success) {
            console.log('✅ Cart item quantity updated successfully')
            // Update local cart with backend data
            if (response.cart && response.cart.items) {
                cart = response.cart.items.map(item => ({
                    id: item.product?._id || item.productId,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    qty: item.quantity,
                    color: item.color,
                }))
                saveUserCart()
                renderCartDrawer()
                updateCartCount()
            }
        } else {
            console.error('❌ Failed to update cart item quantity:', response.message)
            // Reload cart from backend to sync
            loadCartFromBackend()
        }
    } catch (error) {
        console.error('❌ Error updating cart item quantity:', error)
        // Reload cart from backend to sync
        loadCartFromBackend()
    }
}

// Direct API call to remove item from cart
async function removeItemFromCart(uniqueId) {
    try {
        console.log('🗑️ Removing item from cart:', uniqueId)
        
        // Parse uniqueId to get productId and color
        const [productId, colorName] = uniqueId.split('_')
        
        // Find the item in cart to get color information - handle both frontend and backend structures
        const cartItem = cart.find(item => {
            const itemColorName = item.color ? (item.color.name || item.color) : 'default';
            // Handle both frontend (id/productId) and backend (product) structures
            const itemId = item.id || item.productId || item.product;
            const itemUniqueId = `${itemId}_${itemColorName}`;
            return itemUniqueId === uniqueId;
        });
        
        if (!cartItem) {
            console.error('❌ Cart item not found for uniqueId:', uniqueId)
            console.log('🔍 Available cart items:', cart.map(item => ({
                id: item.id || item.productId || item.product,
                color: item.color ? (item.color.name || item.color) : 'default'
            })))
            return
        }
        
        // Get the correct product ID for API call
        const actualProductId = cartItem.id || cartItem.productId || cartItem.product;
        
        // Send color information to backend
        const color = cartItem.color ? cartItem.color.name : (colorName || 'Default')
        console.log('🎨 Sending color to backend:', color, 'for product:', actualProductId)
        const response = await api.removeFromCart(actualProductId, color)
        
        if (response.success) {
            console.log('✅ Item removed from cart successfully')
            // Update local cart using unique identifier - handle both structures
            cart = cart.filter(item => {
                const itemColorName = item.color ? (item.color.name || item.color) : 'default';
                const itemId = item.id || item.productId || item.product;
                const itemUniqueId = `${itemId}_${itemColorName}`;
                return itemUniqueId !== uniqueId;
            });
            saveUserCart();
            renderCartDrawer();
            updateCartCount();
            showToast('Item removed from cart', 'info')
        } else {
            console.error('❌ Failed to remove item from cart:', response.message)
            // Try to remove by product ID only (without color) as fallback
            try {
                console.log('🔄 Trying fallback removal by product ID only...')
                const fallbackResponse = await api.removeFromCart(actualProductId)
                if (fallbackResponse.success) {
                    console.log('✅ Item removed using fallback method')
                    // Update local cart - handle both structures
                    cart = cart.filter(item => {
                        const itemColorName = item.color ? (item.color.name || item.color) : 'default';
                        const itemId = item.id || item.productId || item.product;
                        const itemUniqueId = `${itemId}_${itemColorName}`;
                        return itemUniqueId !== uniqueId;
                    });
                    saveUserCart();
                    renderCartDrawer();
                    updateCartCount();
                    showToast('Item removed from cart', 'info')
                } else {
                    console.error('❌ Fallback removal also failed:', fallbackResponse.message)
                    // Reload cart from backend to sync
                    loadCartFromBackend()
                }
            } catch (fallbackError) {
                console.error('❌ Fallback removal error:', fallbackError)
                // Reload cart from backend to sync
                loadCartFromBackend()
            }
        }
    } catch (error) {
        console.error('❌ Error removing item from cart:', error)
        // Reload cart from backend to sync
        loadCartFromBackend()
    }
}

function handleRemoveFromCart(e) {
    const productId = e.currentTarget.dataset.productId
    const uniqueId = e.currentTarget.dataset.uniqueId
    const colorName = e.currentTarget.dataset.color
    
    if (!productId || !uniqueId) {
        console.error('❌ Product ID or Unique ID not found for remove action')
        return
    }
    
    console.log('🗑️ Removing item from cart:', { productId, uniqueId, colorName })
    
    if (isCustomerLoggedIn()) {
        // Use unique identifier for logged-in users
        removeItemFromCart(uniqueId)
    } else {
        // For guest users, filter by unique identifier
        guestCart = guestCart.filter(item => {
            const itemColorName = item.color ? (item.color.name || item.color) : 'default';
            const itemUniqueId = `${item.id || item.productId}_${itemColorName}`;
            return itemUniqueId !== uniqueId;
        });
        saveGuestCart();
        renderCartDrawer();
        updateCartCount();
        showToast('Item removed from cart', 'info')
    }
}

// Wishlist functionality
function initializeWishlist() {
    // Wishlist icon handler - expanded selectors
    const wishlistIcon = document.querySelector('#wishlist-btn, .wishlist-icon, [data-wishlist-btn], button[onclick*="wishlist"], a[href*="wishlist"], .wishlist-button, [data-wishlist], .favorites, .wishlist-link')
    
    if (wishlistIcon) {
        wishlistIcon.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('❤️ Wishlist icon clicked')
            toggleWishlistDrawer()
        })
    } else {
        console.warn('⚠️ Wishlist icon not found - this is normal on pages without wishlist functionality')
    }
    
    // Mobile wishlist link handler - expanded selectors
    const mobileWishlistLink = document.querySelector('#mobile-wishlist-link, .mobile-wishlist-link, [data-mobile-wishlist], .mobile-wishlist, .mobile-wishlist-btn')
    if (mobileWishlistLink) {
        mobileWishlistLink.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('📱 Mobile wishlist link clicked')
            toggleWishlistDrawer()
        })
    } else {
        console.warn('⚠️ Mobile wishlist link not found - this is normal on pages without mobile wishlist functionality')
    }
    
    // Create wishlist drawer
    createWishlistDrawer()
}

function createWishlistDrawer() {
    // Remove existing drawer if any
    const existingDrawer = document.getElementById('wishlist-drawer')
    if (existingDrawer) {
        existingDrawer.remove()
    }
    
    const drawer = document.createElement('div')
    drawer.id = 'wishlist-drawer';
    drawer.className = 'fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50';
    drawer.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="flex items-center justify-between p-4 border-b border-beige">
                <h3 class="text-lg font-semibold">Wishlist</h3>
                <button class="close-wishlist text-2xl hover:text-gold transition-colors" type="button">&times;</button>
            </div>
            <div class="flex-1 overflow-y-auto p-4" id="wishlist-items">
                <!-- Wishlist items will be rendered here -->
            </div>
            <div class="hidden" id="wishlist-item-count">0</div>
        </div>
    `
    
    document.body.appendChild(drawer)
    
    // Close button handler - prevent event bubbling
    const closeBtn = drawer.querySelector('.close-wishlist')
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlistDrawer()
    })
    
    // Close on backdrop click
    drawer.addEventListener('click', (e) => {
        // Close only if clicking backdrop area (outside panel content)
        if (e.target.id === 'wishlist-drawer') {
            toggleWishlistDrawer()
        }
    })
    
    // Render wishlist items after a small delay to ensure DOM is ready
    setTimeout(() => {
        renderWishlistDrawer()
    }, 100)
}

function toggleWishlistDrawer() {
    const drawer = document.getElementById('wishlist-drawer')
    if (drawer) {
        // Re-render wishlist items before opening
        renderWishlistDrawer()
        const isClosed = drawer.classList.contains('translate-x-full')
        if (isClosed) {
            // Open drawer
            drawer.classList.remove('translate-x-full')
            drawer.classList.add('translate-x-0')
            document.body.style.overflow = 'hidden';
            console.log('❤️ Wishlist drawer opened')
        } else {
            // Close drawer
            drawer.classList.add('translate-x-full')
            drawer.classList.remove('translate-x-0')
            document.body.style.overflow = 'auto';
            console.log('❤️ Wishlist drawer closed')
        }
    }
}

// Get display price (with discount if applicable)
function getDisplayPrice(product) {
    // First check if discountInfo is available and active
    if (product.discountInfo && product.discountInfo.status === 'active') {
        return product.discountInfo.discountPrice;
    }
    
    // Fallback: check discount manually with real-time validation
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
            return Math.round(product.price * (1 - product.discount / 100));
        }
    }
    
    return product.price;
}

async function renderWishlistDrawer(items = null) {
    const wishlistItemsContainer = document.getElementById('wishlist-items')
    const wishlistCountEl = document.getElementById('wishlist-item-count')

    if (!wishlistItemsContainer || !wishlistCountEl) {
        console.error('❌ Wishlist drawer elements not found')
        // Force re-create drawer if DOM mutated or page changed
        createWishlistDrawer()
        // Try again shortly
        setTimeout(() => renderWishlistDrawer(items), 50)
        return
    }

    // Use provided items or get current wishlist
    let currentItems = items
    if (!currentItems) {
        if (isCustomerLoggedIn()) {
            currentItems = wishlist
        } else {
            currentItems = guestWishlist
        }
    }

    console.log('❤️ Rendering wishlist drawer with items:', currentItems?.length || 0)

    if (!currentItems || currentItems.length === 0) {
        wishlistItemsContainer.innerHTML = `
            <div class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Your wishlist is empty</h3>
                <p class="mt-1 text-sm text-gray-500">Start adding products to your wishlist.</p>
            </div>
        `
        wishlistCountEl.textContent = '0';
        return;
    }

    // Enrich items with live product data to get discountInfo and accurate price
    // Also clean up invalid products that no longer exist in database
    try {
        const needsEnrichment = currentItems.some(item => typeof item === 'string' || (typeof item === 'object' && !item.discountInfo))
        if (needsEnrichment && typeof api !== 'undefined') {
            const ids = currentItems.map(item => (typeof item === 'string' ? item : (item.id || item._id))).filter(Boolean)
            const uniqueIds = Array.from(new Set(ids))
            // Fetch details in parallel (limit to 12 to avoid overfetch)
            const toFetch = uniqueIds.slice(0, 12)
            const fetchedMap = new Map()
            const validIds = new Set()
            
            await Promise.all(toFetch.map(async (id) => {
                try {
                    const res = await api.getProduct(id)
                    if (res.success && res.product) {
                        fetchedMap.set(id, res.product)
                        validIds.add(id)
                    } else {
                        console.log('🗑️ Product not found, will be removed from wishlist:', id)
                    }
                } catch (e) { 
                    console.log('🗑️ Error fetching product, will be removed from wishlist:', id, e.message)
                }
            }))
            
            // Filter out invalid items and replace with enriched ones when available
            const originalCount = currentItems.length
            currentItems = currentItems.filter(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id)
                return validIds.has(id)
            }).map(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id)
                const enriched = fetchedMap.get(id)
                if (enriched) {
                    return {
                        id: enriched._id || id,
                        name: enriched.name,
                        price: enriched.price,
                        images: enriched.images,
                        image: enriched.images?.[0]?.url,
                        discount: enriched.discount,
                        isDiscountActive: enriched.isDiscountActive,
                        discountInfo: enriched.discountInfo
                    }
                }
                return item
            })
            
            // Log cleanup results
            const removedCount = originalCount - currentItems.length
            if (removedCount > 0) {
                console.log(`🧹 Cleaned up wishlist: removed ${removedCount} invalid products`)
            }
            
            // Persist cleaned and enriched wishlist for future fast loads
            if (isCustomerLoggedIn()) {
                wishlist = currentItems
                saveUserWishlist(wishlist)
            } else {
                guestWishlist = currentItems
                saveGuestWishlist()
            }
        }
    } catch (e) {
        console.warn('⚠️ Wishlist enrichment failed:', e.message)
    }

    // For logged in users, items should already have product data
    const wishlistItemsHTML = currentItems.map(item => {
        let productId, name, price, image, originalPrice, discountInfo
        
        if (typeof item === 'string') {
            // Legacy format - just ID
            productId = item;
            name = 'Product';
            price = 0;
            originalPrice = 0;
            image = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjI4IiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo = ';
        } else if (typeof item === 'object') {
            // New format - product object
            productId = item.id || item._id;
            name = item.name || 'Unknown Product';
            originalPrice = item.price || 0;
            price = getDisplayPrice(item); // Calculate discounted price
            image = item.image || item.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjI4IiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo = ';
            discountInfo = item.discountInfo;
        } else {
            return null;
        }

        const hasDiscount = price < originalPrice
        const discountPercentage = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

        return `
            <div class="wishlist-item flex items-center justify-between py-4 border-b border-gray-200">
                <div class="flex items-center">
                    <img src="${image}" alt="${name}" class="w-16 h-16 object-cover rounded-lg mr-4">
                    <div>
                        <h4 class="font-semibold text-sm">${name}</h4>
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-bold text-gold">₹${price.toLocaleString()}</p>
                            ${hasDiscount ? `
                                <span class="text-xs line-through text-gray-400">₹${originalPrice.toLocaleString()}</span>
                                <span class="text-xs bg-red-500 text-white px-1 py-0.5 rounded">${discountPercentage}% OFF</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="add-to-cart-from-wishlist bg-gold text-white px-3 py-1 rounded text-sm hover:bg-charcoal transition-colors" 
                            data-product-id="${productId}" data-name="${name}" data-price="${price}" data-image="${image}">
                        Add to Cart
                    </button>
                    <button class="remove-from-wishlist text-red-500 hover:text-red-700" data-product-id="${productId}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
        `
    }).filter(Boolean).join('')

    wishlistItemsContainer.innerHTML = wishlistItemsHTML
    wishlistCountEl.textContent = currentItems.length
    
    // Add event listeners for wishlist drawer buttons
    addWishlistDrawerEventListeners()
    
    console.log('✅ Wishlist drawer rendered with', currentItems.length, 'items')
}

// Add event listeners for wishlist drawer buttons
function addWishlistDrawerEventListeners() {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-from-wishlist').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId
            const name = this.dataset.name
            const price = parseInt(this.dataset.price)
            const image = this.dataset.image
            
            console.log('🛒 Adding to cart from wishlist:', { productId, name, price })
            addToCart(productId, name, price, image)
        })
    })
    
    // Remove from wishlist buttons
    document.querySelectorAll('.remove-from-wishlist').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId
            console.log('❤️ Removing from wishlist:', productId)
            removeFromWishlist(productId)
        })
    })
}

// Cart functions with optimized performance
async function addToCart(productId, name, price, image, color = null, quantity = 1) {
    console.log('🛒 Adding to cart:', { productId, name, price, color, quantity })
    // Suppress duplicate rapid calls for the same product+color
    try {
        const key = getCartItemKey(productId, color)
        const now = Date.now()
        if (lastAddToCartKey === key && (now - lastAddToCartTime) < 700) {
            console.warn('⏱️ Rapid duplicate add suppressed for', key)
            return
        }
        lastAddToCartKey = key
        lastAddToCartTime = now
    } catch (e) {
        console.warn('⚠️ Could not apply add-to-cart throttle:', e)
    }
    
    if (isCustomerLoggedIn()) {
        try {
            const response = await api.addToCart(productId, quantity, color)
            if (response.success) {
                // Optimize: Update local cart directly instead of full backend reload
                if (response.cart && response.cart.items) {
                    // Map backend response to local cart format
                    cart = response.cart.items.map(item => ({
                        id: item._id || item.id || item.productId || 'unknown',
                        productId: item._id || item.id || item.productId || 'unknown',
                        name: item.name || item.product?.name || 'Unknown Product',
                        price: parseFloat(item.price || item.product?.price) || 0,
                        image: item.image || item.product?.images?.[0]?.url || item.images?.[0]?.url || 'assets/thumbnail.jpg',
                        qty: parseInt(item.qty || item.quantity) || 1,
                        color: item.color || null
                    }))
                    
                    // Save to localStorage and update UI immediately
                    saveUserCart()
                    updateCartCount()
                    renderCartDrawer()
                } else {
                    // Fallback: Add item locally if backend response doesn't include cart
                    const newItem = {
                        id: productId,
                        productId: productId,
                        name: name,
                        price: parseFloat(price) || 0,
                        image: image || 'assets/thumbnail.jpg',
                        qty: quantity,
                        color: color || { name: 'Default', code: '#000000' }
                    }
                    cart.push(newItem)
                    saveUserCart()
                    updateCartCount()
                    renderCartDrawer()
                }
                
                showToast(`${name} added to cart!`, 'success')
                openCartDrawer()
            }
        } catch (error) {
            console.error('❌ Error adding to cart:', error)
            showToast('Failed to add item to cart', 'error')
        }
    } else {
        console.log('🛒 Adding to guest cart:', { productId, name, price, image, color })
        
        // Check if item already exists
        const existingItem = guestCart.find(item => {
            const itemProductId = item.id || item.productId;
            const itemColor = item.color ? (item.color.name || item.color) : 'default';
            const newColor = color ? (color.name || color) : 'default';
            return itemProductId === productId && itemColor === newColor;
        });

        if (existingItem) {
            existingItem.qty += quantity
            console.log('🔄 Updated existing guest cart item quantity:', existingItem.qty)
        } else {
            const newCartItem = {
                id: productId,
                productId: productId,
                name: name,
                price: parseFloat(price) || 0,
                image: image || 'assets/thumbnail.jpg',
                qty: quantity,
                color: color || { name: 'Default', code: '#000000' },
            }
            guestCart.push(newCartItem)
            console.log('➕ Added new item to guest cart:', newCartItem)
        }

        saveGuestCart()
        updateCartCount()
        renderCartDrawer()
        debugGuestData('ADD_TO_CART', { productId, name, price, image, color })
        // Provide user feedback in guest mode as well
        showToast(`${name} added to cart!`, 'success')
        openCartDrawer()
    }
}

async function clearCart() {
    if (isCustomerLoggedIn()) {
        // Clear from backend first
        try {
            await api.clearCart()
            console.log('✅ Cart cleared from backend')
        } catch (error) {
            console.error('❌ Error clearing cart from backend:', error)
        }
        
        // Clear from local storage
        cart = []
        saveUserCart()
    } else {
        // Clear guest cart
        guestCart = []
        saveGuestCart()
    }
    
    renderCartDrawer()
    updateCartCount()
    showToast('Cart cleared', 'info')
}

// Proceed to checkout
function proceedToCheckout() {
    const currentCart = isCustomerLoggedIn() ? cart : guestCart
    
    if (currentCart.length === 0) {
        showToast('Your cart is empty', 'error')
        return
    }
    
    // Close cart drawer
    toggleCartDrawer()
    
    // Check if user is logged in
    if (!isCustomerLoggedIn()) {
        showToast('Please login to checkout', 'error')
        setTimeout(() => {
            window.location.href = '/customer-login.html';}, 2000)
        return
    }
    
    // Redirect to checkout page
    window.location.href = '/checkout.html';
}

function updateCartCount() {
    let count = 0;
    if (isCustomerLoggedIn()) {
        // For logged in users, sum up quantities from cart array
        if (Array.isArray(cart)) {
        count = cart.reduce((sum, item) => sum + (parseInt(item.qty) || parseInt(item.quantity) || 1), 0);
        }
    } else {
        // For guest users, sum up quantities
        if (Array.isArray(guestCart)) {
        count = guestCart.reduce((sum, item) => sum + (parseInt(item.qty) || parseInt(item.quantity) || 1), 0);
        }
    }
    
    // Update all cart count elements
    document.querySelectorAll('#cart-count, #cart-count-mobile, .cart-count').forEach(el => {
        if (el) {
            el.textContent = count
            // Show/hide based on count
            if (count > 0) {
                el.classList.remove('hidden')
            } else {
                el.classList.add('hidden')
            }
        }
    })
    
    // Also update cart item count in drawer
    const cartItemCount = document.getElementById('cart-item-count')
    if (cartItemCount) {
        cartItemCount.textContent = count
    }
    
    console.log('🛒 Updated cart count:', count)
}

// Wishlist functions
function addToWishlist(productId, productData = null) {
    if (isCustomerLoggedIn()) {
        // Logged in user - check if already in wishlist
        const existingIndex = wishlist.findIndex(item => {
            if (typeof item === 'string') {
                return item === productId
            } else if (typeof item === 'object') {
                return item.id === productId
            }
            return false
        })
        
        if (existingIndex === -1) {
            // Add product to wishlist
            if (productData) {
                wishlist.push({
                    id: productId,
                    productId: productId,
                    name: productData.name,
                    price: parseFloat(productData.price) || 0,
                    image: productData.images?.[0]?.url || productData.image || 'assets/thumbnail.jpg'
                })
            } else {
                wishlist.push(productId)
            }
            saveUserWishlist(wishlist); // Pass wishlist to saveUserWishlist
            updateAllCounts()
            updateAllWishlistButtonsOnPage(); // Update UI immediately
            
            // Update wishlist drawer immediately
            renderWishlistDrawer()
            
            // Sync with backend - handle errors gracefully
            syncWishlistWithBackend(productId, 'add').catch(error => {
                console.error('❌ Backend sync failed, but keeping local wishlist:', error)
                // If backend sync fails, don't remove from local wishlist
                // Just log the error and keep local state
                if (error.message && error.message.includes('already in wishlist')) {
                    console.log('ℹ️ Product already in backend wishlist, keeping local state')
                }
            })
            console.log('❤️ Added to user wishlist:', productData?.name || productId)
            
            // Show success notification
            showToast('Added to wishlist', 'success')
        } else {
            console.log('⚠️ Product already in wishlist')
            showToast('Product already in wishlist', 'info')
        }
    } else {
        console.log('❤️ Adding to guest wishlist:', { productId, productData })
        
        // Check if already in wishlist
        if (guestWishlist.some(item => (item.id || item.productId) === productId)) {
            console.log('⚠️ Product already in guest wishlist')
            return
        }

        const newWishlistItem = {
            id: productId,
            productId: productId,
            name: productData?.name || 'Product',
            price: parseFloat(productData?.price) || 0,
            image: productData?.images?.[0]?.url || productData?.image || 'assets/thumbnail.jpg'
        }
        guestWishlist.push(newWishlistItem)
        console.log('➕ Added new item to guest wishlist:', newWishlistItem)

        saveGuestWishlist()
        updateWishlistCount()
        debugGuestData('ADD_TO_WISHLIST', { productId, productData })
    }
}

function removeFromWishlist(productId) {
    if (isCustomerLoggedIn()) {
        // Logged in user - remove from main wishlist
        wishlist = wishlist.filter(item => {
            if (typeof item === 'string') {
                return item !== productId
            } else if (typeof item === 'object') {
                return item.id !== productId
            }
            return true
        })
        saveUserWishlist(wishlist); // Pass wishlist to saveUserWishlist
        updateAllCounts()
        updateAllWishlistButtonsOnPage(); // Update UI immediately
        
        // Update wishlist drawer immediately
        renderWishlistDrawer()
        
        // Sync with backend
        syncWishlistWithBackend(productId, 'remove')
        console.log('🗑️ Removed from user wishlist:', productId)
        
        // Show success notification
        showToast('Item removed from wishlist', 'success')
    } else {
        // Guest user - remove from guest wishlist
        guestWishlist = guestWishlist.filter(item => {
            if (typeof item === 'string') {
                return item !== productId
            } else if (typeof item === 'object') {
                return item.id !== productId
            }
            return true
        })
        saveGuestWishlist()
        updateAllCounts()
        updateAllWishlistButtonsOnPage(); // Update UI immediately
        
        // Update wishlist drawer immediately
        renderWishlistDrawer()
        
        console.log('🗑️ Removed from guest wishlist:', productId)
        
        // Show success notification
        showToast('Item removed from wishlist', 'success')
    }
}

// Sync wishlist with backend
async function syncWishlistWithBackend(productId, action) {
    if (!isCustomerLoggedIn()) return
    
    try {
        console.log('🔄 Syncing wishlist with backend:', action, 'product', productId)
        
        if (action === 'add') {
            await api.addToCustomerWishlist(productId)
        } else if (action === 'remove') {
            await api.removeFromCustomerWishlist(productId)
        }
        
        console.log('✅ Wishlist synced with backend successfully')
    } catch (error) {
        console.error('❌ Error syncing wishlist with backend:', error)
        
        // Handle "already in wishlist" error gracefully
        if (error.message && error.message.includes('already in wishlist')) {
            console.log('ℹ️ Product already in backend wishlist, this is expected')
            // Don't throw error, just log it as info
            return
        }
        
        // For other errors, re-throw to be handled by caller
        throw error
    }
}

// Load wishlist from backend
async function loadWishlistFromBackend() {
    if (!isCustomerLoggedIn()) {
        console.log('👤 User not logged in, skipping backend wishlist load')
        return
    }

    // Prevent multiple simultaneous wishlist loads
    if (isWishlistLoading) {
        console.log('🔄 Wishlist loading already in progress, skipping...')
        return
    }

    isWishlistLoading = true

    try {
        console.log('📋 Loading wishlist from backend...')
        
        // Try with shorter timeout for wishlist
        try {
            const wishlistResponse = await api.getCustomerWishlist({ timeoutMs: 25000 }); // Align with backend 25s
            console.log('✅ Wishlist loaded from backend with 10s timeout');

            // Map backend wishlist into global state and persist
            const backendWishlist = (wishlistResponse && Array.isArray(wishlistResponse.wishlist))
                ? wishlistResponse.wishlist
                : [];

            wishlist = backendWishlist.map(item => ({
                id: item._id || item.id || 'unknown',
                productId: item._id || item.id || 'unknown',
                name: item.name || 'Unknown Product',
                price: parseFloat(item.price) || 0,
                image: (item.images && item.images[0] && item.images[0].url) || item.image || 'assets/thumbnail.jpg'
            }));

            saveUserWishlist(wishlist);
            updateWishlistCount();
            updateAllWishlistButtonsOnPage();
            // If drawer open, re-render
            const drawer = document.getElementById('wishlist-drawer');
            if (drawer && !drawer.classList.contains('translate-x-full')) {
                renderWishlistDrawer();
            }

            return wishlistResponse;
        } catch (shortTimeoutError) {
            console.log('⏰ Quick timeout also failed, using localStorage fallback')
            // Use localStorage data as final fallback
            const guestWishlist = loadGuestWishlist()
            return {
                success: true,
                wishlist: guestWishlist
            }
        }
    } catch (error) {
        console.error('❌ Error loading wishlist from backend:', error)
        
        // If it's a timeout error, try with a shorter timeout
        if (error.message && error.message.includes('timeout')) {
            console.log('⏰ Wishlist request timed out, trying with shorter timeout...')
            try {
                const quickResponse = await api.getCustomerWishlist({ timeoutMs: 8000 })
                if (quickResponse.success) {
                    const backendWishlist = quickResponse.wishlist || []
                    console.log('✅ Wishlist loaded with quick timeout:', backendWishlist.length, 'items')
                    
                    wishlist = backendWishlist.map(item => ({
                        id: item._id || item.id || 'unknown',
                        productId: item._id || item.id || 'unknown',
                        name: item.name || 'Unknown Product',
                        price: parseFloat(item.price) || 0,
                        image: item.images?.[0]?.url || item.image || 'assets/thumbnail.jpg'
                    }))
                    
                    saveUserWishlist(wishlist)
                    updateWishlistCount()
                    updateAllWishlistButtonsOnPage()
                    return
                }
            } catch (quickError) {
                console.log('⏰ Quick timeout also failed, using localStorage fallback')
            }
        }
        
        console.log('⚠️ Keeping local wishlist state due to backend error')
        
        // Load from localStorage as fallback
        const userWishlistData = localStorage.getItem('userWishlist')
        if (userWishlistData) {
            try {
                wishlist = JSON.parse(userWishlistData)
                console.log('📋 Loaded wishlist from localStorage fallback after error:', wishlist.length, 'items')
                updateWishlistCount()
            } catch (parseError) {
                console.error('❌ Error parsing localStorage wishlist:', parseError)
                wishlist = []
            }
        }
    } finally {
        // Always reset the loading flag
        isWishlistLoading = false
    }
}

function isInWishlist(productId) {
    return wishlist.some(item => {
        if (typeof item === 'string') {
            return item === productId
        } else if (typeof item === 'object') {
            return item.id === productId
        }
        return false
    }) || guestWishlist.some(item => {
        if (typeof item === 'string') {
            return item === productId
        } else if (typeof item === 'object') {
            return item.id === productId
        }
        return false
    })
}

function saveWishlist() {
    if (isCustomerLoggedIn()) {
        saveUserWishlist(wishlist); // Pass wishlist to saveUserWishlist
    } else {
        saveGuestWishlist()
    }
}

function updateWishlistCount() {
    // Only count the active context (logged-in vs guest)
    const count = isCustomerLoggedIn() ? (wishlist?.length || 0) : (guestWishlist?.length || 0)
    
    // Update all wishlist count elements
    document.querySelectorAll('#wishlist-count, #wishlist-count-mobile, .wishlist-count').forEach(el => {
        if (el) {
            el.textContent = count
            // Show/hide based on count
            if (count > 0) {
                el.classList.remove('hidden')
            } else {
                el.classList.add('hidden')
            }
        }
    })
    
    console.log('❤️ Updated wishlist count:', count)
}

// Update wishlist icon appearance based on count
function updateWishlistIcon(count) {
    const wishlistBtns = document.querySelectorAll('#wishlist-btn, .wishlist-btn')
    wishlistBtns.forEach(btn => {
        const countEl = btn.querySelector('#wishlist-count, .wishlist-count')
        if (countEl) {
            countEl.textContent = count
            if (count > 0) {
                countEl.classList.remove('hidden')
            } else {
                countEl.classList.add('hidden')
            }
        }
    })
}

// Global wishlist state management
function syncWishlistState() {
    console.log('🔄 Syncing wishlist state...')
    console.log('📋 Current wishlist:', wishlist)
    console.log('📋 Current guest wishlist:', guestWishlist)
    
    // Update wishlist count
    updateWishlistCount()
    
    // Update wishlist drawer if open
    const drawer = document.getElementById('wishlist-drawer')
    if (drawer && !drawer.classList.contains('translate-x-full')) {
        renderWishlistDrawer()
    }
    
    // Update all wishlist buttons on current page
    updateAllWishlistButtonsOnPage()
}

// Update all wishlist buttons on current page
function updateAllWishlistButtonsOnPage() {
    // Shop page wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = btn.dataset.id
        const isInWishlistState = isInWishlist(productId)
        
        if (isInWishlistState) {
            btn.classList.add('text-red-500')
            btn.classList.remove('text-charcoal/60')
            btn.querySelector('svg').setAttribute('fill', 'currentColor')
        } else {
            btn.classList.remove('text-red-500')
            btn.classList.add('text-charcoal/60')
            btn.querySelector('svg').setAttribute('fill', 'none')
        }
    })
    
    // Product detail page wishlist button
    const detailWishlistBtn = document.querySelector('.wishlist-btn[data-id]')
    if (detailWishlistBtn) {
        const productId = detailWishlistBtn.dataset.id
        const isInWishlistState = isInWishlist(productId)
        
        if (isInWishlistState) {
            detailWishlistBtn.classList.add('border-gold', 'text-gold')
            detailWishlistBtn.classList.remove('border-charcoal/20', 'text-charcoal/60')
            detailWishlistBtn.querySelector('svg').setAttribute('fill', 'currentColor')
        } else {
            detailWishlistBtn.classList.remove('border-gold', 'text-gold')
            detailWishlistBtn.classList.add('border-charcoal/20', 'text-charcoal/60')
            detailWishlistBtn.querySelector('svg').setAttribute('fill', 'none')
        }
    }
}

// Newsletter functionality
function initializeNewsletter() {
    const form = document.getElementById('newsletter-form')
    if (!form) return
    
    form.addEventListener('submit', function(e) {
        e.preventDefault()
        
        const emailInput = document.getElementById('newsletter-email')
        const email = emailInput.value.trim()
        
        if (!email) {
            showToast('Please enter your email address', 'error')
            return
        }
        
        // Save to localStorage for now
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]')
        if (!subscribers.includes(email)) {
            subscribers.push(email)
            localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers))
        }
        
        showToast('Successfully subscribed to newsletter!', 'success')
        emailInput.value = ''
    })
}

// Contact form functionality
function initializeContactForm() {
    const form = document.querySelector('form')
    if (!form) return
    
    // Check if this is a contact form (has name, email, message fields)
    const nameInput = form.querySelector('#name, input[name="name"]')
    const emailInput = form.querySelector('#email, input[name="email"]')
    const messageInput = form.querySelector('#message, textarea[name="message"]')
    
    if (!nameInput || !emailInput || !messageInput) return
    
    console.log('📧 Initializing contact form...')
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault()
        
        const submitBtn = form.querySelector('button[type="submit"]')
        const originalText = submitBtn.textContent
        
        // Show loading state
        submitBtn.disabled = true
        submitBtn.textContent = 'Sending...'
        
        try {
            const formData = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                message: messageInput.value.trim()
            }
            
            // Validate form data
            if (!formData.name || !formData.email || !formData.message) {
                showToast('Please fill in all fields', 'error')
                return
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                showToast('Please enter a valid email address', 'error')
                return
            }
            
            // Send contact form data
            const response = await fetch('https://www.laiq.shop/api/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            
            // Enhanced JSON parsing with error handling
            const responseText = await response.text();
            let result;
            
            try {
                // Check if response is empty
                if (!responseText || responseText.trim() === '') {
                    throw new Error('Empty response received from server');
                }
                
                // Check if response looks like HTML
                if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                    console.error('❌ HTML Response Detected:', responseText.substring(0, 500));
                    throw new Error('Server returned HTML instead of JSON');
                }
                
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON Parse Error in contact form:', parseError);
                console.error('📄 Response content:', responseText.substring(0, 1000));
                throw new Error(`Failed to submit contact form: ${parseError.message}`);
            }
            
            if (result.success) {
                showToast(result.message, 'success')
                
                // Clear form
                form.reset()
                
                // Track contact form submission
                if (window.analyticsTracker) {
                    window.analyticsTracker.trackConversion('contact', 0, { 
                        source: 'form_submit',
                        name: formData.name,
                        email: formData.email
                    })
                }
            } else {
                showToast(result.message || 'Failed to send message. Please try again.', 'error')
            }
        } catch (error) {
            console.error('❌ Contact form error:', error)
            showToast('Network error. Please check your connection and try again.', 'error')
        } finally {
            // Reset button state
            submitBtn.disabled = false
            submitBtn.textContent = originalText
        }
    })
}

// Back to top functionality
function initializeBackToTop() {
    const backToTopBtn = document.createElement('button')
    backToTopBtn.id = 'back-to-top'
    backToTopBtn.className = 'fixed bottom-6 right-6 bg-gold text-white p-3 rounded-full shadow-lg hover:bg-charcoal transition-all duration-300 opacity-0 pointer-events-none z-40'
    backToTopBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
    `
    
    document.body.appendChild(backToTopBtn)
    
    // Show/hide based on scroll
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'pointer-events-none')
        } else {
            backToTopBtn.classList.add('opacity-0', 'pointer-events-none')
        }
    })
    
    // Scroll to top
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    })
}

// Loading functionality
function initializeLoading() {
    // Add loading overlay
    const loadingOverlay = document.createElement('div')
    loadingOverlay.id = 'loading-overlay'
    loadingOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-sm'
    loadingOverlay.innerHTML = `
        <div class="flex flex-col items-center text-center">
            <svg width="56" height="56" viewBox="0 0 50 50" class="mb-4" aria-hidden="true">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#D4AF37" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.4 188.4">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
                </circle>
            </svg>
            <p id="loading-text" class="text-charcoal/70">Loading…</p>
        </div>
    `
    
    document.body.appendChild(loadingOverlay)
    
    // Hide loading after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 1000);
    })
}

// Quick view modal functionality
function initializeQuickView() {
    // Create modal container
    const modal = document.createElement('div')
    modal.id = 'quick-view-modal'
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 opacity-0 pointer-events-none transition-opacity duration-300'
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold">Quick View</h3>
                    <button class="close-quick-view text-2xl hover:text-gold transition-colors">&times;</button>
                </div>
                <div id="quick-view-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        </div>
    `
    
    document.body.appendChild(modal)
    
    // Close button handler
    const closeBtn = modal.querySelector('.close-quick-view')
    closeBtn.addEventListener('click', closeQuickViewModal)
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeQuickViewModal()
        }
    })
}

function openQuickViewModal(product) {
    const modal = document.getElementById('quick-view-modal')
    const content = document.getElementById('quick-view-content')
    
    console.log('🔍 Quick View Product Data:', product)
    console.log('🔍 Product Description:', product.description)
    console.log('🔍 Product Desc:', product.desc)
    
    if (!modal || !content) return
    
    // Calculate display price with discount
    const displayPrice = getDisplayPrice(product)
    const originalPrice = product.price
    const hasDiscount = product.discountInfo && product.discountInfo.status === 'active' || (product.discount > 0 && product.isDiscountActive)
    
    content.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <div class="relative">
                <img src="${product.images?.[0]?.url || product.image}" alt="${product.name}" class="w-full h-64 object-cover rounded-lg" />
                ${hasDiscount ? `
                    <div class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                        <i class="fas fa-fire mr-1"></i>${product.discountInfo?.value || product.discount}% OFF
                    </div>
                ` : ''}
            </div>
            <div>
                <h4 class="text-lg font-semibold mb-2">${product.name}</h4>
                <p class="text-charcoal/70 text-sm mb-3">${product.shortDescription || product.description || product.desc || 'No description available'}</p>
                <div class="mb-4">
                    ${hasDiscount ? `
                        <div class="flex flex-col">
                            <span class="text-gold font-bold text-lg">₹${displayPrice.toLocaleString()}</span>
                            <span class="text-charcoal/40 text-sm line-through">₹${originalPrice.toLocaleString()}</span>
                        </div>
                    ` : `
                        <div class="text-gold font-bold text-lg">₹${displayPrice.toLocaleString()}</div>
                    `}
                </div>
                <div class="flex gap-2">
                    <button class="add-to-cart-quick bg-gold text-white px-4 py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors" data-id="${product._id || product.id}" data-name="${product.name}" data-price="${displayPrice}" data-image="${product.images?.[0]?.url || product.image}">
                        Add to Cart
                    </button>
                    <a href="product?id=${product._id || product.id}" class="bg-charcoal/10 text-charcoal px-4 py-2 rounded-lg font-semibold hover:bg-charcoal hover:text-white transition-colors">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    `
    
    // Add to cart handler
    const addToCartBtn = content.querySelector('.add-to-cart-quick')
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            const btn = e.currentTarget
            
            // Handle color selection for multi-variant products
            let color = null
            if (product.colorVariants && product.colorVariants.length > 0) {
                if (product.colorVariants.length === 1) {
                    // Single color variant - use it automatically
                    color = { name: product.colorVariants[0].name, code: product.colorVariants[0].code }
                } else {
                    // Multiple color variants - show error and redirect to product page
                    showToast('Please select a color on the product page', 'error')
                    closeQuickViewModal()
                    setTimeout(() => {
                        window.location.href = `/product?id=${product._id || product.id}`
                    }, 1500)
                    return
                }
            }
            
            // Use the display price that was already calculated and passed to the button
            const price = parseInt(btn.dataset.price)
            addToCart(btn.dataset.id, btn.dataset.name, price, btn.dataset.image, color)
            showToast('Added to cart!', 'success')
            closeQuickViewModal()
        })
    }
    
    modal.classList.remove('opacity-0', 'pointer-events-none')
}

function closeQuickViewModal() {
    const modal = document.getElementById('quick-view-modal')
    if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none')
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 transform translate-x-full`
    
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500')
            break
        case 'error':
            toast.classList.add('bg-red-500')
            break
        default:
            toast.classList.add('bg-charcoal')
    }
    
    toast.textContent = message
    document.body.appendChild(toast)
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full')
    }, 100)
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full')
        setTimeout(() => {
            document.body.removeChild(toast)
        }, 300)
    }, 3000)
}

// Generate stars for ratings
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<svg class = "w-4 h-4 fill-gold" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    if (hasHalfStar) {
        stars += '<svg class="w-4 h-4 fill-gold" viewBox="0 0 24 24"><defs><linearGradient id="half"><stop offset="50%" stop-color="#d4af37"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><path fill="url(#half)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<svg class = "w-4 h-4 fill-gray-300" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    return stars;
} 

// Customer Authentication
async function initializeCustomerAuth() {
    console.log('🔄 Initializing customer authentication...');
    const token = localStorage.getItem('customerToken');
    console.log('🔑 Token found:', token ? 'YES' : 'NO');
    console.log('🔑 Token value:', token);

    if (token && token !== 'undefined') {
        console.log('🔍 Attempting to decode token...');
        const customer = getCustomerFromToken(token);
        console.log('👤 Decoded customer data:', customer);

        if (customer && (customer.id || customer._id)) {
            const customerId = customer.id || customer._id;
            
            // Enhanced customer data extraction from JWT
            const customerData = {
                id: customerId,
                name: customer.name || customer.username || customer.email || 'Customer',
                email: customer.email || 'customer@example.com'
            };
            
            console.log('👤 Customer identified from token:', customerData.name, 'ID:', customerId);
            console.log('🔍 Full customer data from JWT:', customer);
            
            // Immediately update UI to show logged-in state
            showCustomerMenu(customerData);
            
            // Perform data merging and loading in the background
            try {
                await mergeGuestDataWithUser(customerId);
                // After merging, load fresh data from the backend
                await Promise.all([
                    loadWishlistFromBackend(),
                    loadCartFromBackend()
                ]);
            } catch (error) {
                console.error("Error during post-login data sync:", error);
            }

        } else {
            console.log('🕵️ Invalid token found, proceeding as guest.');
            showGuestMenu();
            loadGuestData();
        }
    } else {
        console.log('🕵️ No token found, proceeding as guest.');
        showGuestMenu();
        loadGuestData();
    }
    console.log('✅ Customer authentication initialized.');
}

/**
 * Decodes the JWT token to extract customer data.
 */
function parseJwt(token) {
    if (!token) {
        return null;
    }
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            throw new Error('Invalid JWT token format');
        }
        
        // Fix for browser compatibility
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        
        // Use try-catch for atob with fallback
        let jsonPayload;
        try {
            const decoded = atob(base64);
            jsonPayload = decodeURIComponent(decoded.split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (atobError) {
            console.error('❌ atob failed, trying alternative method:', atobError);
            // Alternative method for older browsers
            jsonPayload = decodeURIComponent(escape(atob(base64)));
        }

        const payload = JSON.parse(jsonPayload);
        console.log('🔍 JWT payload decoded successfully:', payload);
        return payload;
    } catch (error) {
        console.error("❌ Failed to decode JWT:", error);
        return null;
    }
}

/**
 * Decodes the JWT token to extract customer data.
 * @param {string} token - The JWT token.
 * @returns {object|null} - The customer data or null if invalid.
 */
function getCustomerFromToken(token) {
    try {
        console.log('🔍 Parsing JWT token...');
        const payload = parseJwt(token);
        console.log('🔍 JWT payload parsed:', payload);

        // Check if token is expired
        if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn('🔒 Token expired, removing.');
            localStorage.removeItem('customerToken');
            return null;
        }
        
        console.log('✅ Token valid, returning payload:', payload);
        return payload;
    } catch (error) {
        console.error('❌ Error decoding token:', error);
        localStorage.removeItem('customerToken');
        return null;
    }
}

/**
 * Shows the customer menu and hides guest menu
 * @param {object} customer - Customer object with id, name, email
 */
async function showCustomerMenu(customer) {
    console.log('👤 Showing customer menu for:', customer.name || customer.email || 'Customer');
    console.log('🔍 Customer object received:', customer);
    
    // Desktop menu
    const customerMenu = document.getElementById('customer-menu');
    const guestMenu = document.getElementById('guest-menu');
    const customerNameElement = document.getElementById('customer-name');

    // Mobile menu
    const customerMenuMobile = document.getElementById('customer-menu-mobile');
    const guestMenuMobile = document.getElementById('guest-menu-mobile');
    const customerNameMobile = document.getElementById('customer-name-mobile');

    if (customerMenu && guestMenu) {
        guestMenu.classList.add('hidden');
        customerMenu.classList.remove('hidden');
        customerMenu.classList.add('flex');
        if (customerNameElement) {
            customerNameElement.textContent = customer.name || customer.email || 'Account';
            console.log('✅ Customer name set in desktop UI:', customerNameElement.textContent);
        }
    }

    if (customerMenuMobile && guestMenuMobile) {
        guestMenuMobile.classList.add('hidden');
        customerMenuMobile.classList.remove('hidden');
        if (customerNameMobile) {
            customerNameMobile.textContent = customer.name || customer.email || 'Account';
            console.log('✅ Customer name set in mobile UI:', customerNameMobile.textContent);
        }
    }
    
    // Force update all counts to reflect logged-in state
    updateAllCounts();
    console.log('✅ Customer menu displayed successfully');
}

/**
 * Shows the guest menu and hides customer menu
 */
function showGuestMenu() {
    console.log('🕵️ Showing guest menu, hiding customer menu');
    
    // Desktop menu
    const customerMenu = document.getElementById('customer-menu');
    const guestMenu = document.getElementById('guest-menu');

    // Mobile menu
    const customerMenuMobile = document.getElementById('customer-menu-mobile');
    const guestMenuMobile = document.getElementById('guest-menu-mobile');

    if (customerMenu && guestMenu) {
        customerMenu.classList.add('hidden');
        customerMenu.classList.remove('flex');
        guestMenu.classList.remove('hidden');
    }

    if (customerMenuMobile && guestMenuMobile) {
        customerMenuMobile.classList.add('hidden');
        guestMenuMobile.classList.remove('hidden');
    }
}

/**
 */
function hideCustomerMenu() {
    console.log('🕵️ Hiding customer menu, showing guest menu');
    
    // Desktop menu
    const customerMenu = document.getElementById('customer-menu');
    const guestMenu = document.getElementById('guest-menu');

    // Mobile menu
    const customerMenuMobile = document.getElementById('customer-menu-mobile');
    const guestMenuMobile = document.getElementById('guest-menu-mobile');

    if (customerMenu && guestMenu) {
        customerMenu.classList.add('hidden');
        customerMenu.classList.remove('flex');
        guestMenu.classList.remove('hidden');
    }

    if (customerMenuMobile && guestMenuMobile) {
        customerMenuMobile.classList.add('hidden');
        guestMenuMobile.classList.remove('hidden');
    }
}

/**
 * Loads guest data from localStorage
 */
function loadGuestData() {
    console.log('📦 Loading guest data...');
    loadGuestCart();
    loadGuestWishlist();
    console.log('✅ Guest data loaded');
}

/**
 */
function mergeGuestData() {
    console.log('🔍 Guest data check...');
    const guestCartData = localStorage.getItem('guestCart');
    const guestWishlistData = localStorage.getItem('guestWishlist');

    if (!guestCartData && !guestWishlistData) {
        console.log('📭 No guest data to merge');
        return;
    }

    if (guestCartData) {
        const guestCartItems = JSON.parse(guestCartData);
        if (guestCartItems.length > 0) {
            console.log(`🛒 Merging ${guestCartItems.length} guest cart items...`);
            api.mergeGuestCart({ guestCart: guestCartItems })
                .then(() => {
                    console.log('✅ Guest cart merged successfully');
                    localStorage.removeItem('guestCart');
                    loadCartFromBackend(); // Refresh cart from backend
                })
                .catch(err => console.error('❌ Error merging guest cart:', err));
        }
    }

    if (guestWishlistData) {
        const guestWishlistItems = JSON.parse(guestWishlistData);
        if (guestWishlistItems.length > 0) {
            console.log(`❤️ Merging ${guestWishlistItems.length} guest wishlist items...`);
            api.mergeGuestWishlist({ guestWishlist: guestWishlistItems })
                .then(() => {
                    console.log('✅ Guest wishlist merged successfully');
                    localStorage.removeItem('guestWishlist');
                    loadWishlistFromBackend(); // Refresh wishlist
                })
                .catch(err => console.error('❌ Error merging guest wishlist:', err));
        }
    }
} 

// Sync cart with backend
async function syncCartWithBackend() {
    if (!isCustomerLoggedIn()) return
    
    try {
        console.log('🔄 Syncing cart with backend...')
        
        // Get current cart from localStorage
        const userCartData = localStorage.getItem('userCart')
        const currentCart = userCartData ? JSON.parse(userCartData) : []
        
        console.log('📦 Current cart items:', currentCart.length)
        
        // First, clear the backend cart
        try {
            await api.clearCart()
            console.log('🗑️ Cleared backend cart')
        } catch (error) {
            console.error('❌ Error clearing backend cart:', error)
        }
        
        // Then add each cart item to backend with delay to prevent conflicts
        for (const item of currentCart) {
                // Ensure we have valid data
                const productId = item.id || item.productId
                const quantity = item.qty || item.quantity || 1
                const color = item.color || null
                
                if (!productId || productId === 'unknown' || productId === 'undefined' || productId === 'null') {
                    console.warn('⚠️ Skipping item with invalid product ID:', item)
                    continue
                }
                
                // Validate productId format (should be 24 character hex string)
                if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
                    console.warn('⚠️ Skipping item with invalid product ID format:', productId)
                    continue
                }
                
            try {
                console.log('🛒 Syncing item:', { productId, quantity, color })
                
                // Add to backend with better error handling
                await api.addToCart(productId, quantity, color)
                console.log('✅ Successfully synced item:', productId)
                
                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 50))
                
            } catch (error) {
                // Ensure productId is available in error handling
                const currentProductId = productId || 'unknown';
                console.error('❌ Error syncing cart item to backend:', currentProductId, error);
                
                // If color validation fails, try without color
                if (error.message && error.message.includes('color is not available')) {
                    try {
                        console.log('🔄 Retrying without color for product:', currentProductId)
                        await api.addToCart(currentProductId, quantity, null)
                        console.log('✅ Successfully synced item without color:', currentProductId)
                    } catch (retryError) {
                        console.error('❌ Failed to sync even without color:', currentProductId, retryError)
                    }
                }
            }
        }
        
        console.log('✅ Cart synced with backend')
        
    } catch (error) {
        console.error('❌ Error syncing cart with backend:', error)
    }
}

// Handle customer logout
function handleCustomerLogout() {
    console.log('🚪 Customer logging out...');
    
    // Best-effort backend logout (non-blocking)
    try {
        if (window.api && typeof window.api.customerLogout === 'function') {
            window.api.customerLogout().catch(() => {});
        }
    } catch (_) {}
    
    // Clear all customer data
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    localStorage.removeItem('userCart');
    localStorage.removeItem('userWishlist');
    
    // Clear guest data too
    localStorage.removeItem('guestCart');
    localStorage.removeItem('guestWishlist');
    
    // Reset cart and wishlist arrays
    cart = [];
    wishlist = [];
    
    // Show guest menu
    showGuestMenu();
    
    // Update counts
    updateAllCounts();
    
    // Show success message
    showToast('Logged out successfully!', 'success');
    
    console.log('✅ Customer logged out successfully');
}

// Utility: bind logout buttons defensively (desktop + mobile)
function bindLogoutButtons() {
    try {
        const desktop = document.getElementById('logout-btn')
        const mobile = document.getElementById('mobile-logout-link')
        if (desktop) {
            desktop.onclick = null
            desktop.addEventListener('click', handleCustomerLogout)
        }
        if (mobile) {
            mobile.onclick = null
            mobile.addEventListener('click', (e) => { 
                e.preventDefault()
                handleCustomerLogout()
            })
        }
    } catch (_) {}
}

// Load cart from backend with optimized performance
async function loadCartFromBackend() {
    if (!isCustomerLoggedIn()) {
        console.log('👤 User not logged in, skipping backend cart load')
        return
    }

    // Prevent multiple simultaneous cart loads
    if (isCartLoading) {
        console.log('🔄 Cart loading already in progress, skipping...')
        return
    }

    isCartLoading = true

    try {
        console.log('📥 Loading cart from backend...')
        const startTime = Date.now()
        
        // Check localStorage first for logged in users
        const userCartData = localStorage.getItem('userCart');
        const localStorageCart = userCartData ? JSON.parse(userCartData) : [];
        
        console.log('👤 localStorage cart items:', localStorageCart);
        
        if (localStorageCart.length > 0) {
            // Use localStorage cart if it has items
            cart = localStorageCart;
            console.log('✅ Using localStorage cart with', cart.length, 'items');
            
            // Save to localStorage and update UI immediately
            saveUserCart()
            updateCartCount()
            renderCartDrawer(cart)
            
            // Sync to backend in background (non-blocking)
            try {
                console.log('🔄 Syncing localStorage cart to backend...');
                const cartResponse = await api.getCart({ timeoutMs: 5000 });
                if (cartResponse.success && cartResponse.cart && cartResponse.cart.items) {
                    const backendCart = cartResponse.cart.items;
                    console.log('📦 Backend cart has', backendCart.length, 'items');
                    
                    // If backend cart is empty but localStorage has items, sync them
                    if (backendCart.length === 0 && localStorageCart.length > 0) {
                        console.log('🔄 Backend cart is empty, syncing localStorage items...');
                        for (const item of localStorageCart) {
                            try {
                                await api.addToCart(item.id, item.qty, item.color);
                                console.log('✅ Synced item to backend:', item.name);
                            } catch (error) {
                                console.warn('⚠️ Failed to sync item to backend:', item.name, error.message);
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('⚠️ Backend sync failed, continuing with localStorage cart:', error.message);
            }
            
            const duration = Date.now() - startTime
            console.log(`✅ Cart loaded from localStorage in ${duration}ms`)
        } else {
            // localStorage is empty, try backend
            console.log('📦 localStorage cart is empty, trying backend...');
            
            // Single optimized request with reasonable timeout (increased for auth)
            const cartResponse = await api.getCart({ timeoutMs: 10000 });
            
            if (cartResponse.success && cartResponse.cart && cartResponse.cart.items) {
                // Handle different cart response structures efficiently
                let backendCart = []
                if (cartResponse.cart && Array.isArray(cartResponse.cart)) {
                    backendCart = cartResponse.cart
                } else if (cartResponse.cart && cartResponse.cart.items && Array.isArray(cartResponse.cart.items)) {
                    backendCart = cartResponse.cart.items
                } else if (cartResponse.items && Array.isArray(cartResponse.items)) {
                    backendCart = cartResponse.items
                } else {
                    console.warn('⚠️ Unexpected cart response structure:', cartResponse)
                    backendCart = []
                }
                
                console.log('✅ Cart loaded from backend:', backendCart.length, 'items')
                
                // Optimized mapping with reduced logging
                cart = backendCart.map(item => ({
                    id: item.product || item._id || item.id || item.productId || 'unknown',
                    productId: item.product || item._id || item.id || item.productId || 'unknown',
                    name: item.name || item.product?.name || 'Unknown Product',
                    price: parseFloat(item.price || item.product?.price) || 0,
                    image: item.image || item.product?.images?.[0]?.url || item.images?.[0]?.url || 'assets/thumbnail.jpg',
                    qty: parseInt(item.qty || item.quantity) || 1,
                    color: item.color || null
                }))
                
                // Save to localStorage and update UI immediately
                saveUserCart()
                updateCartCount()
                renderCartDrawer(cart)
                
                const duration = Date.now() - startTime
                console.log(`✅ Cart synced with backend successfully in ${duration}ms`)
            } else {
                console.warn('⚠️ Backend cart response not successful, using localStorage')
                loadFromLocalStorage()
            }
        }
    } catch (error) {
        console.error('❌ Error loading cart from backend:', error)
        
        // Handle 401 Unauthorized errors gracefully
        if (error.message && error.message.includes('Unauthorized')) {
            console.log('🔐 User not authorized, loading from localStorage...')
            loadFromLocalStorage()
            return
        }
        
        // Handle timeout errors gracefully
        if (error.message && error.message.includes('timeout')) {
            console.log('⏰ Cart request timed out, using localStorage fallback')
            loadFromLocalStorage()
            return
        }
        
        console.log('⚠️ Using localStorage fallback due to backend error')
        loadFromLocalStorage()
    } finally {
        // Always reset the loading flag
        isCartLoading = false
    }
}

// Helper function to load cart from localStorage
function loadFromLocalStorage() {
    if (isCustomerLoggedIn()) {
        const userCart = loadUserCart()
        cart = userCart || []
        console.log('📦 Loaded user cart from localStorage:', cart.length, 'items')
    } else {
        const guestCart = loadGuestCart()
        cart = guestCart
        console.log('📦 Loaded guest cart from localStorage:', cart.length, 'items')
    }
    updateCartCount()
    renderCartDrawer()
}

function loadGuestCart() {
    try {
        const guestCartData = localStorage.getItem('guestCart')
        const guestWishlistData = localStorage.getItem('guestWishlist')

        if (guestCartData) {
            try {
                guestCart = JSON.parse(guestCartData)
                console.log('📥 Loaded guest cart from localStorage:', guestCart.length, 'items')
            } catch (e) {
                console.error('❌ Error parsing guest cart:', e)
                guestCart = []
            }
        }

        if (guestWishlistData) {
            try {
                guestWishlist = JSON.parse(guestWishlistData)
                console.log('📥 Loaded guest wishlist from localStorage:', guestWishlist.length, 'items')
            } catch (e) {
                console.error('❌ Error parsing guest wishlist:', e)
                guestWishlist = []
            }
        }

        // Normalize data structure
        guestCart = guestCart.map(item => ({
            id: item.id || item.productId || 'unknown',
            productId: item.productId || item.id || 'unknown',
            name: item.name || 'Unknown Product',
            price: parseFloat(item.price) || 0,
            image: item.image || item.images?.[0]?.url || 'assets/thumbnail.jpg',
            qty: parseInt(item.qty) || parseInt(item.quantity) || 1,
            color: item.color || null,
        }))

        guestWishlist = guestWishlist.map(item => ({
            id: item.id || item.productId || 'unknown',
            productId: item.productId || item.id || 'unknown',
            name: item.name || 'Unknown Product',
            price: parseFloat(item.price) || 0,
            image: item.image || item.images?.[0]?.url || 'assets/thumbnail.jpg'
        }))

        updateCartCount()
        updateWishlistCount()
        
        debugGuestData('LOAD_GUEST_DATA', { guestCart, guestWishlist })
        console.log('👤 Guest data loaded successfully')
    } catch (error) {
        console.error('❌ Error loading guest data:', error)
        guestCart = []
        guestWishlist = []
    }
}

// Update cart display from guest data
function updateCartFromGuestData() {
    const cartItems = guestCart.map(item => {
        // Find product details from localStorage or use default
        const productData = {
            id: item.productId,
            name: item.name || 'Product',
            price: item.price || 0,
            image: item.image || 'assets/thumbnail.jpg',
            quantity: item.quantity || 1,
            color: item.color || null
        }
        return productData
    })

    // Update cart count
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    updateCartCount(totalItems)

    // Update cart drawer if open
    if (document.getElementById('cart-drawer')) {
        renderCartDrawer(cartItems)
    }
} 

// Open cart drawer
function openCartDrawer() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.remove('translate-x-full');
        cartDrawer.classList.add('translate-x-0');
        document.body.style.overflow = 'hidden';
    }
}

// Close cart drawer
function closeCartDrawer() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.remove('translate-x-0');
        cartDrawer.classList.add('translate-x-full');
        document.body.style.overflow = 'auto';
    }
}

// Clear invalid cart data from localStorage
function clearInvalidCartData() {
    try {
        const storedCart = localStorage.getItem('guestCart')
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart)
            if (Array.isArray(parsedCart)) {
                const validItems = parsedCart.filter(item => {
                    if (!item) return false
                    const productId = item.productId || item.id
                    const qty = parseInt(item.qty || item.quantity || 0)
                    return (
                        productId &&
                        productId !== 'unknown' &&
                        productId !== 'undefined' &&
                        productId !== 'null' &&
                        Number.isFinite(qty) && qty > 0
                    )
                })

                if (validItems.length !== parsedCart.length) {
                    console.log('🧹 Clearing invalid cart items:', parsedCart.length - validItems.length)
                    localStorage.setItem('guestCart', JSON.stringify(validItems))
                }
            }
        }
    } catch (error) {
        console.error('❌ Error clearing invalid cart data:', error)
        localStorage.removeItem('guestCart')
    }
}

// Update cart icon appearance based on count
function updateCartIcon(count) {
    const cartBtns = document.querySelectorAll('#cart-btn, .cart-btn')
    cartBtns.forEach(btn => {
        const countEl = btn.querySelector('#cart-count, .cart-count')
        if (countEl) {
            countEl.textContent = count
            if (count > 0) {
                countEl.classList.remove('hidden')
            } else {
                countEl.classList.add('hidden')
            }
        }
    })
}

// Debounced count updates
let countUpdateTimeout
function debouncedUpdateAllCounts() {
    clearTimeout(countUpdateTimeout)
    countUpdateTimeout = setTimeout(() => {
        updateAllCounts()
    }, 300); // Increased delay to reduce frequency
}

// Update counts on page load and navigation
function updateAllCounts() {
    console.log('🔄 Updating all counts...');
    
    // Ensure cart and wishlist are arrays before calculating counts
    const safeCart = Array.isArray(cart) ? cart : [];
    const safeGuestCart = Array.isArray(guestCart) ? guestCart : [];
    const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
    const safeGuestWishlist = Array.isArray(guestWishlist) ? guestWishlist : [];

    const loggedIn = isCustomerLoggedIn();

    // Only count the active context (logged-in vs guest)
    const cartCount = loggedIn
        ? safeCart.reduce((s, i) => s + (parseInt(i.qty) || parseInt(i.quantity) || 1), 0)
        : safeGuestCart.reduce((s, i) => s + (parseInt(i.qty) || parseInt(i.quantity) || 1), 0);
    updateCartIcon(cartCount);

    const wishlistCount = loggedIn ? safeWishlist.length : safeGuestWishlist.length;
    updateWishlistIcon(wishlistCount);
    
    console.log('✅ All counts updated - Cart:', cartCount, 'Wishlist:', wishlistCount);
}

// Listen for page visibility changes to update counts when user returns to tab
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setTimeout(updateAllCounts, 100)
    }
})

// Listen for page focus to update counts when user switches back to window
window.addEventListener('focus', function() {
    setTimeout(updateAllCounts, 100)
})

// Add debugging for guest data operations
function debugGuestData(operation, data) {
    console.log(`🔍 [${operation}] Guest Data:`, {
        cart: guestCart.length,
        wishlist: guestWishlist.length,
        localStorage: {
            cart: localStorage.getItem('guestCart') ? JSON.parse(localStorage.getItem('guestCart')).length : 0,
            wishlist: localStorage.getItem('guestWishlist') ? JSON.parse(localStorage.getItem('guestWishlist')).length : 0
        },
        data: data
    });
}

function loadGuestWishlist() {
    const guestWishlistData = localStorage.getItem('guestWishlist')
    if (guestWishlistData) {
        try {
            const parsed = JSON.parse(guestWishlistData)
            console.log('📋 Guest wishlist loaded from localStorage:', parsed.length, 'items')
            return parsed
        } catch (error) {
            console.error('❌ Error parsing guest wishlist from localStorage:', error)
            return []
        }
    }
    return []
}

/**
 * Retrieves guest data from localStorage.
 * @returns {{cart: any[], wishlist: any[]}}
 */
function getGuestData() {
    const cart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    const wishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
    return { cart, wishlist };
}