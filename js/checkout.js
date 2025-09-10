// Checkout Page JavaScript - Standalone Version
let orderItems = [];
let orderTotal = 0;
let customerInfo = null;
let isProcessing = false;
let savedAddresses = [];
let selectedAddress = null;

// Brand logo handling for Razorpay (preload and provide data URL to avoid external fetch hiccups)
let brandLogoDataUrl = null;
const brandLogoCanonicalUrl = '/assets/laiq-logo-192x192.png';

async function prefetchBrandLogo() {
    try {
        const logoUrl = `${window.location.origin}${brandLogoCanonicalUrl}`;
        console.log(`🖼️ Prefetching brand logo from: ${logoUrl}`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const resp = await fetch(logoUrl, { 
            signal: controller.signal,
            cache: 'force-cache' // Use cached version if available
        });
        
        clearTimeout(timeoutId);
        
        if (!resp.ok) {
            console.warn(`⚠️ Failed to fetch brand logo: HTTP status ${resp.status}`);
            return;
        }
        
        const blob = await resp.blob();
        
        // Validate blob size (should be reasonable for a logo)
        if (blob.size > 1024 * 1024) { // 1MB limit
            console.warn(`⚠️ Brand logo too large: ${blob.size} bytes`);
            return;
        }
        
        const reader = new FileReader();
        brandLogoDataUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        console.log('✅ Brand logo prefetched successfully as data URL.');
    } catch (e) {
        if (e.name === 'AbortError') {
            console.warn('⚠️ Brand logo fetch timed out, proceeding without logo');
        } else {
            console.warn('⚠️ Could not prefetch brand logo, proceeding without logo:', e.message);
        }
        brandLogoDataUrl = null; // Ensure it's null on failure
    }
}

// Global request interceptor to block wordmark requests from the start
(function() {
    console.log('🛡️ Setting up global wordmark request blocker');
    
    // Store original functions
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Block fetch requests globally
    window.fetch = function(url, options) {
        if (typeof url === 'string' && (url.includes('wordmark') || url.includes('/checkout/data'))) {
            console.log('🚫 Global fetch blocker - blocking:', url);
            return Promise.reject(new Error('Wordmark request blocked globally'));
        }
        return originalFetch.apply(this, arguments);
    };
    
    // Block XMLHttpRequest requests globally
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (typeof url === 'string' && (url.includes('wordmark') || url.includes('/checkout/data'))) {
            console.log('🚫 Global XHR blocker - blocking:', url);
            this._blocked = true;
            return;
        }
        return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
        if (this._blocked) {
            console.log('🚫 Global XHR send blocked');
            return;
        }
        return originalXHRSend.apply(this, arguments);
    };
    
    console.log('✅ Global wordmark request blocker activated');
})();

// Initialize checkout page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🛒 Checkout page initialized - Standalone');
    // Preload brand logo early so Razorpay can use a data URL (avoids external wordmark fetch noise)
    await prefetchBrandLogo();
    
    // Check if user is coming back from order confirmation (prevent resubmission)
    if (window.history.state && window.history.state.orderCompleted) {
        console.log('⚠️ User returned from order confirmation, redirecting to shop');
        showToast('Order already completed. Redirecting to shop...', 'info');
        setTimeout(() => {
            window.location.href = '/shop.html';
        }, 2000);
        return;
    }
    
    // Show loading state
    showLoadingState(true, 'Loading checkout page...');
    
    try {
        // Check if user is logged in
        if (!isCustomerLoggedIn()) {
            showToast('Please login to checkout', 'error');
            setTimeout(() => {
                window.location.href = '/customer-login.html';
            }, 2000);
            return;
        }
        
        // Load order items from cart
        await loadOrderItems();
        
        // Load customer information
        await loadCustomerInfo();
        
        // Load saved addresses
        await loadSavedAddresses();
        
        // Initialize address handlers (after addresses are loaded)
        initializeAddressHandlers();
        
        // Initialize payment handlers
        initializePaymentHandlers();
        
        // Initialize cart/wishlist counts
        initializeCounts();
        
        // Hide loading state
        showLoadingState(false);
        
        console.log('✅ Checkout page ready - Standalone');
    } catch (error) {
        console.error('❌ Error initializing checkout:', error);
        showToast('Error loading checkout page: ' + error.message, 'error');
        showLoadingState(false);
    }
});

// Initialize cart and wishlist counts
function initializeCounts() {
    try {
        // Cart count
        const cartCount = document.getElementById('cart-count');
        const cartCountMobile = document.getElementById('cart-count-mobile');
        const cartBtn = document.getElementById('cart-btn');
        const mobileCartLink = document.getElementById('mobile-cart-link');
        
        // Get cart data
        const token = localStorage.getItem('customerToken');
        let currentCart = [];
        
        if (token) {
            const userCartData = localStorage.getItem('userCart');
            currentCart = userCartData ? JSON.parse(userCartData) : [];
        } else {
            const guestCartData = localStorage.getItem('guestCart');
            currentCart = guestCartData ? JSON.parse(guestCartData) : [];
        }
        
        const cartLength = currentCart.length;
        
        // Update cart counts
        if (cartCount) cartCount.textContent = cartLength;
        if (cartCountMobile) cartCountMobile.textContent = cartLength;
        
        // Add cart click handlers
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                showToast('Cart functionality available on shop page', 'info');
            });
        }
        
        if (mobileCartLink) {
            mobileCartLink.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Cart functionality available on shop page', 'info');
            });
        }
        
        // Wishlist count
        const wishlistCount = document.getElementById('wishlist-count');
        const wishlistCountMobile = document.getElementById('wishlist-count-mobile');
        const wishlistBtn = document.getElementById('wishlist-btn');
        const mobileWishlistLink = document.getElementById('mobile-wishlist-link');
        
        // Get wishlist data
        let currentWishlist = [];
        
        if (token) {
            const userWishlistData = localStorage.getItem('userWishlist');
            currentWishlist = userWishlistData ? JSON.parse(userWishlistData) : [];
        } else {
            const guestWishlistData = localStorage.getItem('guestWishlist');
            currentWishlist = guestWishlistData ? JSON.parse(guestWishlistData) : [];
        }
        
        const wishlistLength = currentWishlist.length;
        
        // Update wishlist counts
        if (wishlistCount) wishlistCount.textContent = wishlistLength;
        if (wishlistCountMobile) wishlistCountMobile.textContent = wishlistLength;
        
        // Add wishlist click handlers
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => {
                showToast('Wishlist functionality available on shop page', 'info');
            });
        }
        
        if (mobileWishlistLink) {
            mobileWishlistLink.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Wishlist functionality available on shop page', 'info');
            });
        }
        
        console.log('✅ Counts initialized - Cart:', cartLength, 'Wishlist:', wishlistLength);
    } catch (error) {
        console.error('❌ Error initializing counts:', error);
    }
}

// Show/Hide loading state
function showLoadingState(show, message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
    
    if (loadingText && message) {
        loadingText.textContent = message;
    }
}

// Check if customer is logged in
function isCustomerLoggedIn() {
  const token = localStorage.getItem('customerToken');
  return !!(token && token !== 'undefined');
}

// Load order items from cart
async function loadOrderItems() {
    try {
        console.log('📦 Loading order items...');
        showLoadingState(true, 'Loading cart items...');
        
        // Get cart items from backend for logged in users
        const token = localStorage.getItem('customerToken');
        let currentCart = [];
        
        if (token) {
            // Logged in user - prioritize localStorage first, then backend
            const userCartData = localStorage.getItem('userCart');
            const localStorageCart = userCartData ? JSON.parse(userCartData) : [];
            
            console.log('👤 localStorage cart items:', localStorageCart);
            
            if (localStorageCart.length > 0) {
                // Use localStorage cart if it has items
                currentCart = localStorageCart;
                console.log('✅ Using localStorage cart with', currentCart.length, 'items');
                
                // Sync to backend in background (non-blocking)
                try {
                    console.log('🔄 Syncing localStorage cart to backend...');
                    const response = await api.getCart();
                    if (response.success && response.cart && response.cart.items) {
                        const backendCart = response.cart.items;
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
            } else {
                // localStorage is empty, try backend
                try {
                    const response = await api.getCart();
                    console.log('📦 Backend cart response:', response);
                    
                    if (response.success && response.cart && response.cart.items) {
                        currentCart = response.cart.items.map(item => ({
                            id: item.product?._id || item.product || item.productId || 'unknown',
                            name: item.name || item.product?.name || 'Unknown Product',
                            price: parseFloat(item.price) || parseFloat(item.product?.price) || 0,
                            qty: parseInt(item.quantity) || parseInt(item.qty) || 1,
                            image: item.image || item.product?.images?.[0]?.url || item.product?.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=',
                            color: item.color || null
                        })).filter(item => item.id !== 'unknown' && item.price > 0);
                        
                        console.log('👤 Backend cart items:', currentCart);
                    } else {
                        console.log('👤 Backend cart is empty');
                    }
                } catch (error) {
                    console.error('❌ Error loading cart from backend:', error);
                }
            }
        } else {
            // Guest user - get from guest cart
            const guestCartData = localStorage.getItem('guestCart');
            currentCart = guestCartData ? JSON.parse(guestCartData) : [];
            console.log('👻 Guest cart items:', currentCart);
        }
        
        // Validate and clean cart data
        currentCart = currentCart.filter(item => {
            if (!item || !item.id || !item.name || !item.price || (!item.qty && !item.quantity)) {
                console.warn('⚠️ Invalid cart item found:', item);
                return false;
            }
            return true;
        }).map(item => ({
            id: item.id || 'unknown',
            name: item.name || 'Unknown Product',
            price: parseFloat(item.price) || 0,
            qty: parseInt(item.qty || item.quantity) || 1,
            image: item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=',
            color: item.color || null,
        }));
        
        if (currentCart.length === 0) {
            showToast('Your cart is empty', 'error');
            setTimeout(() => {
                window.location.href = '/shop.html';
            }, 2000);
            return;
        }
        
        orderItems = currentCart;
        orderTotal = currentCart.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.qty) || 1;
            return sum + (price * qty);
        }, 0);
        
        console.log('📦 Order items loaded:', orderItems);
        console.log('💰 Order total:', orderTotal);
        
        // Render order items
        renderOrderItems();
        
        console.log('✅ Order items loaded:', orderItems.length, 'items');
    } catch (error) {
        console.error('❌ Error loading order items:', error);
        showToast('Error loading order items: ' + error.message, 'error');
        throw error;
    }
}

// Render order items
function renderOrderItems() {
    const container = document.getElementById('order-items');
    const totalElement = document.getElementById('order-total');
    
    if (!container) {
        console.error('❌ Order items container not found');
        return;
    }
    
    if (orderItems.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No items in cart</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orderItems.map(item => {
        // Ensure all values are properly defined
        const itemName = item.name || 'Unknown Product';
        const itemPrice = parseFloat(item.price) || 0;
        const itemQty = parseInt(item.qty) || 1;
        const itemImage = item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
        const itemColor = item.color?.name || item.color || null;
        const itemTotal = itemPrice * itemQty;
        
        return `
            <div class="flex items-center gap-4 border-b border-gray-200 pb-4 last:border-b-0">
                <img src="${itemImage}" alt="${itemName}" class="w-16 h-16 rounded-lg object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjc3NDhCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='" />
                <div class="flex-1">
                    <div class="font-semibold">${itemName}</div>
                    <div class="text-sm text-gray-600">
                        Quantity: ${itemQty}
                        ${itemColor ? `<br>Color: <span class="font-medium">${itemColor}</span>` : ''}
                    </div>
                    <div class="text-gold font-bold">₹${itemTotal.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
    
    if (totalElement) {
        totalElement.textContent = `₹${orderTotal.toLocaleString()}`;
    }
    
    console.log('✅ Order items rendered:', orderItems.length, 'items');
}

// Load customer information
async function loadCustomerInfo() {
    try {
        console.log('👤 Loading customer information...');
        showLoadingState(true, 'Loading customer info...');
        
        // Get customer user data from localStorage
        const customerUser = localStorage.getItem('customerUser');
        if (!customerUser) {
            console.error('❌ No customer user data found');
            showToast('Customer data not found', 'error');
            throw new Error('Customer data not found');
        }
        
        const user = JSON.parse(customerUser);
        console.log('👤 Customer user data:', user);
        
        customerInfo = user;
        renderCustomerInfo();
        console.log('✅ Customer info loaded');
    } catch (error) {
        console.error('❌ Error loading customer info:', error);
        showToast('Error loading customer info: ' + error.message, 'error');
        throw error;
    }
}

// Render customer information
function renderCustomerInfo() {
    const container = document.getElementById('customer-info');
    
    if (!container || !customerInfo) {
        console.error('❌ Customer info container or data not found');
        return;
    }
    
    container.innerHTML = `
        <div class="space-y-2">
            <div><span class="font-medium">Name:</span> ${customerInfo.name || 'N/A'}</div>
            <div><span class="font-medium">Email:</span> ${customerInfo.email || 'N/A'}</div>
            <div><span class="font-medium">Phone (profile):</span> ${customerInfo.phone || 'N/A'}</div>
            <div class="mt-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone for this order</label>
                <input type="tel" id="order-phone" inputmode="numeric" pattern="[0-9]{10,12}" maxlength="12" placeholder="10-12 digit number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold" value="${(customerInfo.phone && customerInfo.phone.match(/^[0-9]{10,12}$/)) ? customerInfo.phone : ''}">
                <p class="text-xs text-gray-500 mt-1">This phone will be saved with your order for delivery contact.</p>
            </div>
        </div>
    `;
    
    console.log('✅ Customer info rendered');
    try {
        const phoneInput = document.getElementById('order-phone');
        if (phoneInput) {
            const onChange = () => {
                updatePlaceOrderButton();
            };
            phoneInput.addEventListener('input', onChange);
            phoneInput.addEventListener('blur', onChange);
        }
    } catch (_) {}
}

// Load saved addresses
async function loadSavedAddresses() {
    try {
        console.log('📦 Loading saved addresses...');
        
        const response = await api.getCustomerAddresses();
        
        if (response.success) {
            savedAddresses = response.addresses;
            renderSavedAddresses();
            console.log('✅ Saved addresses loaded:', savedAddresses.length);
        } else {
            console.error('❌ Failed to load saved addresses:', response);
            // Don't show error toast for this, just log it
            savedAddresses = [];
            renderSavedAddresses();
        }
    } catch (error) {
        console.error('❌ Error loading saved addresses:', error);
        
        // Handle authentication errors gracefully
        if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            console.log('🔐 User not authenticated, skipping saved addresses');
            savedAddresses = [];
            renderSavedAddresses();
        } else {
            // Only show toast for non-auth errors
            showToast('Error loading saved addresses: ' + error.message, 'error');
            savedAddresses = [];
            renderSavedAddresses();
        }
    }
}

// Render saved addresses
function renderSavedAddresses() {
    const container = document.getElementById('saved-addresses');
    const noAddressesDiv = document.getElementById('no-saved-addresses');
    const addressForm = document.getElementById('address-form'); // Get address form
    
    if (!container) {
        console.error('❌ Saved addresses container not found');
        return;
    }

    if (savedAddresses.length === 0) {
        container.innerHTML = '';
        if (noAddressesDiv) {
            noAddressesDiv.classList.remove('hidden');
        }
        // Show address form when no saved addresses
        if (addressForm) {
            addressForm.style.display = 'block';
        }
        // Update button state
        updatePlaceOrderButton();
        return;
    }

    if (noAddressesDiv) {
        noAddressesDiv.classList.add('hidden');
    }

    container.innerHTML = savedAddresses.map((address, index) => `
        <div class="saved-address-item border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedAddress && selectedAddress._id === address._id ? 'bg-gold/10 border-gold' : ''}" 
             data-address-id="${address._id}">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <input type="radio" name="selected-address" value="${address._id}" 
                               ${selectedAddress && selectedAddress._id === address._id ? 'checked' : ''} 
                               class="text-gold focus:ring-gold">
                        <span class="font-medium">${address.street}, ${address.city}, ${address.state} - ${address.pincode}</span>
                        ${address.isDefault ? '<span class="text-xs bg-gold text-white px-2 py-1 rounded">Default</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-600 ml-6">${address.country}</p>
                </div>
                <button class="delete-address-btn ml-4 text-red-500 hover:text-red-700 p-1" 
                        data-address-id="${address._id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners for saved addresses
    document.querySelectorAll('.saved-address-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking on delete button
            if (e.target.closest('.delete-address-btn')) {
                return;
            }
            
            const addressId = item.dataset.addressId;
            selectAddress(addressId);
        });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-address-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent address item click
            const addressId = btn.dataset.addressId;
            deleteAddress(addressId);
        });
    });

    // Add event listeners for radio buttons
    document.querySelectorAll('input[name="selected-address"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const addressId = e.target.value;
            selectAddress(addressId);
        });
    });

    console.log('✅ Saved addresses rendered:', savedAddresses.length);
}

// Select address
function selectAddress(addressId) {
    selectedAddress = savedAddresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
        console.log('📍 Address selected:', selectedAddress);
        
        // Update UI to show selected address
        renderSavedAddresses(); // Re-render to update selection
        
        // Hide the address form since we have a selected address
        const addressForm = document.getElementById('address-form');
        if (addressForm) {
            addressForm.style.display = 'none';
        }
        
        // Show selected address summary
        showSelectedAddressSummary();
        
        // Update place order button
        updatePlaceOrderButton();
    }
}

// Show selected address summary
function showSelectedAddressSummary() {
    const container = document.getElementById('selected-address-summary');
    if (!container) {
        // Create container if it doesn't exist
        const addressSection = document.querySelector('.mb-6');
        if (addressSection) {
            const summaryDiv = document.createElement('div');
            summaryDiv.id = 'selected-address-summary';
            summaryDiv.className = 'mb-4 p-4 bg-green-50 border border-green-200 rounded-lg';
            addressSection.appendChild(summaryDiv);
        }
    }
    
    const summaryContainer = document.getElementById('selected-address-summary');
    if (summaryContainer && selectedAddress) {
        summaryContainer.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium text-green-800 mb-1">Selected Address</h4>
                    <p class="text-sm text-green-700">${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}</p>
                </div>
                <button id="change-address-btn" class="text-green-600 hover:text-green-800 text-sm font-medium">
                    Change
                </button>
            </div>
        `;
        
        // Add change address button handler
        const changeBtn = document.getElementById('change-address-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                selectedAddress = null;
                summaryContainer.remove();
                const addressForm = document.getElementById('address-form');
                if (addressForm) {
                    addressForm.style.display = 'block';
                }
                renderSavedAddresses();
                updatePlaceOrderButton();
            });
        }
    }
}

// Update place order button text
function updatePlaceOrderButton() {
    const placeOrderBtn = document.getElementById('place-order-btn');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
    
    if (placeOrderBtn) {
        // Check if we have a selected address OR if form is filled
        const hasSelectedAddress = selectedAddress !== null;
        const hasFormData = checkFormData();
        const phoneOk = validateOrderPhone(false);
        
        if ((hasSelectedAddress || hasFormData) && phoneOk) {
            if (paymentMethod === 'cod') {
                placeOrderBtn.textContent = 'Place Order (Cash on Delivery)';
            } else if (paymentMethod === 'razorpay') {
                placeOrderBtn.textContent = 'Pay with Razorpay';
            } else {
                placeOrderBtn.textContent = 'Place Order';
            }
            placeOrderBtn.disabled = false;
        } else {
            placeOrderBtn.textContent = 'Please Fill Address & Phone';
            placeOrderBtn.disabled = true;
        }
    }
}

// Check if form has valid data
function checkFormData() {
    const addressForm = document.getElementById('address-form');
    if (!addressForm) return false;
    
    const formData = new FormData(addressForm);
    const street = formData.get('street')?.trim();
    const city = formData.get('city')?.trim();
    const state = formData.get('state')?.trim();
    const pincode = formData.get('pincode')?.trim();
    const phoneOk = validateOrderPhone(false);
    
    return street && city && state && pincode && /^\d{6}$/.test(pincode) && phoneOk;
}

// Validate and get phone for this order. Returns phone string or false
function validateOrderPhone(showError = false) {
    try {
        const phoneInput = document.getElementById('order-phone');
        const inputVal = phoneInput ? String(phoneInput.value || '').trim() : '';
        const profilePhone = customerInfo && customerInfo.phone ? String(customerInfo.phone).trim() : '';
        const phoneToUse = inputVal || profilePhone;
        if (phoneToUse && /^[0-9]{10,12}$/.test(phoneToUse)) {
            return phoneToUse;
        }
        if (showError) {
            showToast('Please enter a valid contact phone (10-12 digits).', 'error');
        }
        return false;
    } catch (e) {
        if (showError) {
            showToast('Please enter a valid contact phone (10-12 digits).', 'error');
        }
        return false;
    }
}

// Add new address
async function addNewAddress() {
    const addressForm = document.getElementById('address-form');
    const formData = new FormData(addressForm);

    const newAddress = {
        street: formData.get('street')?.trim(),
        city: formData.get('city')?.trim(),
        state: formData.get('state')?.trim(),
        pincode: formData.get('pincode')?.trim(),
        phone: formData.get('phone')?.trim(),
        country: 'India'
    };

    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
        showToast('Please fill in all address fields', 'error');
        return;
    }

    if (!/^\d{6}$/.test(newAddress.pincode)) {
        showToast('Please enter a valid 6-digit pincode', 'error');
        return;
    }

    try {
        console.log('📦 Adding new address...');
        showLoadingState(true, 'Adding new address...');

        const response = await api.addCustomerAddress(newAddress);

        if (response.success) {
            showToast('Address added successfully!', 'success');
            savedAddresses.push(response.address);
            renderSavedAddresses();
            selectAddress(response.address._id); // Select the newly added address
        } else {
            showToast('Error adding address: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error adding new address:', error);
        showToast('Error adding address: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

// Delete address
async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }

    try {
        console.log('📦 Deleting address...');
        showLoadingState(true, 'Deleting address...');

        const response = await api.deleteCustomerAddress(addressId);

        if (response.success) {
            showToast('Address deleted successfully!', 'success');
            savedAddresses = savedAddresses.filter(addr => addr._id !== addressId);
            renderSavedAddresses();
            if (selectedAddress && selectedAddress._id === addressId) {
                selectedAddress = null;
                document.getElementById('address-form').style.display = 'none'; // Hide form
                document.getElementById('saved-addresses').style.display = 'block'; // Show saved addresses
                document.getElementById('place-order-btn').textContent = 'Place Order (Cash on Delivery)'; // Reset button text
            }
        } else {
            showToast('Error deleting address: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting address:', error);
        showToast('Error deleting address: ' + error.message, 'error');
    } finally {
        showLoadingState(false);
    }
}

// Initialize address handlers
function initializeAddressHandlers() {
    const addNewAddressBtn = document.getElementById('add-new-address-btn');
    const addressForm = document.getElementById('address-form');
    
    if (addNewAddressBtn) {
        addNewAddressBtn.addEventListener('click', () => {
            if (addressForm) {
                addressForm.style.display = 'block';
            }
            const savedAddressesContainer = document.getElementById('saved-addresses');
            if (savedAddressesContainer) {
                savedAddressesContainer.style.display = 'none';
            }
            const noAddressesDiv = document.getElementById('no-saved-addresses');
            if (noAddressesDiv) {
                noAddressesDiv.style.display = 'none';
            }
        });
    }
    
    // Add form submission handler for new address
    if (addressForm) {
        addressForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewAddress();
        });
        
        // Add real-time validation for form inputs
        const formInputs = addressForm.querySelectorAll('input[required]');
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                updatePlaceOrderButton();
            });
            input.addEventListener('blur', () => {
                updatePlaceOrderButton();
            });
        });
    }
    
    // Initially hide the address form if no saved addresses
    if (addressForm && savedAddresses.length === 0) {
        addressForm.style.display = 'block';
    }
    
    // Initial button state update
    updatePlaceOrderButton();
}

// Initialize payment handlers
function initializePaymentHandlers() {
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
    
    // Add payment method change handler
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', handlePaymentMethodChange);
    });
}

// Ensure we don't send giant base64 images in order payloads
function sanitizeOrderItemImage(image) {
    if (!image || typeof image !== 'string') {
        return 'assets/thumbnail.jpg';
    }
    if (image.startsWith('data:')) {
        return 'assets/thumbnail.jpg';
    }
    return image;
}

// Handle payment method change
function handlePaymentMethodChange() {
    updatePlaceOrderButton();
}

// Handle place order
async function handlePlaceOrder() {
    if (isProcessing) {
        showToast('Order is already being processed', 'warning');
        return;
    }
    
    try {
        console.log('💳 Processing order...');
        isProcessing = true;
        
        const placeOrderBtn = document.getElementById('place-order-btn');
        const originalText = placeOrderBtn.textContent;
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Processing...';
        
        // Validate payment method
        const paymentMethodElement = document.querySelector('input[name="payment-method"]:checked');
        if (!paymentMethodElement) {
            showToast('Please select a payment method', 'error');
            resetOrderButton(placeOrderBtn, originalText);
            isProcessing = false;
            return;
        }
        
        const paymentMethod = paymentMethodElement.value;
        console.log('💳 Selected payment method:', paymentMethod);
        
        // Validate and get shipping address
        const shippingAddress = validateAndGetAddress();
        if (!shippingAddress) {
            resetOrderButton(placeOrderBtn, originalText);
            isProcessing = false;
            return;
        }
        
        // Check if user wants to save the address (only for new addresses, not saved ones)
        const saveAddressCheckbox = document.getElementById('save-address');
        const shouldSaveAddress = !selectedAddress && saveAddressCheckbox && saveAddressCheckbox.checked;
        
        // Validate phone for this order
        const orderPhone = validateOrderPhone(true);
        if (!orderPhone) {
            resetOrderButton(placeOrderBtn, originalText);
            isProcessing = false;
            return;
        }

        // Create order data
        const orderData = {
            orderItems: orderItems.map(item => ({
                product: item.id,
                name: item.name,
                price: item.price,
                quantity: parseInt(item.qty) || 1,
                image: sanitizeOrderItemImage(item.image),
                color: item.color || { name: "N/A", code: "#000000" }
            })),
            shippingAddress,
            totalAmount: orderTotal,
            paymentMethod,
            saveAddress: shouldSaveAddress,
            contactInfo: {
                name: customerInfo?.name || null,
                email: customerInfo?.email || null,
                phone: orderPhone
            }
        };
        
        console.log('📋 Order data:', orderData);
        
        // Process payment based on method
        if (paymentMethod === 'razorpay') {
            await processRazorpayPayment(orderData);
        } else if (paymentMethod === 'cod') {
            await processCODOrder(orderData);
        } else {
            showToast('Invalid payment method selected', 'error');
            resetOrderButton(placeOrderBtn, originalText);
            isProcessing = false;
        }
        
    } catch (error) {
        console.error('❌ Error placing order:', error);
        showToast('Error placing order: ' + error.message, 'error');
        resetOrderButton(document.getElementById('place-order-btn'), 'Place Order');
        isProcessing = false;
    }
}

// Reset order button
function resetOrderButton(button, text) {
    if (button) {
        button.disabled = false;
        button.textContent = text;
    }
}

// Validate and get shipping address
function validateAndGetAddress() {
    // If a saved address is selected, use it
    if (selectedAddress) {
        return {
            street: selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            country: selectedAddress.country || 'India'
        };
    }
    
    // Otherwise, validate form input
    const addressForm = document.getElementById('address-form');
    const formData = new FormData(addressForm);
    
    const shippingAddress = {
        street: formData.get('street')?.trim(),
        city: formData.get('city')?.trim(),
        state: formData.get('state')?.trim(),
        pincode: formData.get('pincode')?.trim(),
        country: 'India'
    };
    
    // Validate all fields
    const requiredFields = ['street', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
        showToast(`Please fill in: ${missingFields.join(', ')}`, 'error');
        return null;
    }
    
    // Validate pincode
    if (!/^\d{6}$/.test(shippingAddress.pincode)) {
        showToast('Please enter a valid 6-digit pincode', 'error');
        return null;
    }
    
    return shippingAddress;
}

// Process Razorpay payment
async function processRazorpayPayment(orderData) {
    try {
        console.log('💳 Processing Razorpay payment...');
        showLoadingState(true, 'Processing Razorpay payment...');
        
        // Create Razorpay order first
        const razorpayResponse = await api.createRazorpayOrder(orderData.totalAmount);
        
        if (razorpayResponse.success) {
            console.log('✅ Razorpay order created:', razorpayResponse.order.id);
            
            // Store order data for after payment
            localStorage.setItem('pendingOrderData', JSON.stringify({
                ...orderData,
                razorpayOrderId: razorpayResponse.order.id
            }));
            
            // Get Razorpay key from server response
            const razorpayKey = razorpayResponse.razorpayKey;
            if (!razorpayKey) {
                console.error('❌ Razorpay public key missing from server response');
                showToast('Payment service unavailable. Please try again later.', 'error');
                showLoadingState(false);
                resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
                isProcessing = false;
                return;
            }
            
            // Configure Razorpay options - With animations and proper flow
            // In test mode, some instruments (e.g., certain netbanking banks, wallets)
            // frequently fail with a generic "Please use another method".
            // Detect test keys and only show Cards + UPI in that case for reliability.
            const isTestKey = typeof razorpayKey === 'string' && razorpayKey.startsWith('rzp_test_');

            // Build display blocks dynamically based on environment
            let blocksConfig = {};
            let sequenceList = [];

            if (isTestKey) {
                // For test mode, ONLY show cards as requested to ensure reliability
                blocksConfig = {
                    cards: {
                        name: "Pay using Card",
                        instruments: [{ method: "card" }]
                    }
                };
                sequenceList = ["block.cards"];
            } else {
                // For production, show all reliable methods
                blocksConfig = {
                    cards: {
                        name: "Pay using Card",
                        instruments: [{ method: "card" }]
                    },
                    upi: {
                        name: "Pay using UPI",
                        instruments: [{ method: "upi", flow: "collect" }]
                    },
                    banks: {
                        name: "Pay using Netbanking",
                        instruments: [{ method: "netbanking" }]
                    },
                    wallets: {
                        name: "Pay using Wallets",
                        instruments: [{ method: "wallet" }]
                    }
                };
                sequenceList = ["block.cards", "block.upi", "block.banks", "block.wallets"];
            }

            // Ensure brand logo is ready as a data URL (same-origin fetch avoids CORS)
            if (!brandLogoDataUrl) {
                try { 
                    await prefetchBrandLogo(); 
                } catch (e) {
                    console.warn('⚠️ Logo prefetch failed, proceeding without logo:', e.message);
                }
            }

            const options = {
                key: razorpayKey,
                amount: orderData.totalAmount * 100,
                currency: 'INR',
                name: 'Laiq Bags',
                description: 'Order Payment',
                order_id: razorpayResponse.order.id,
                prefill: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    contact: (document.getElementById('order-phone')?.value || customerInfo.phone || '').toString().trim()
                },
                theme: {
                    color: '#D4AF37'
                },
                // Use modal flow (no redirect) so handler runs on success
                // Dynamically show instruments. In test keys we avoid netbanking/wallets to reduce failures.
                config: {
                    display: {
                        blocks: blocksConfig,
                        sequence: sequenceList,
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                },
                // Additional options to prevent wordmark issues
                notes: {
                    merchant_order_id: razorpayResponse.order.id
                },
                // Disable automatic wordmark fetching
                readonly: {
                    email: false,
                    contact: false,
                    name: false
                },
                handler: async function(response) {
                    console.log('✅ Payment successful:', response);
                    
                    try {
                        // Verify payment signature first
                        const verificationResponse = await api.verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            expectedAmount: orderData.totalAmount
                        });
                        
                        if (!verificationResponse.success) {
                            throw new Error('Payment verification failed');
                        }
                        
                        // Create order with payment details
                        const orderResponse = await api.createCustomerOrder({
                            ...orderData,
                            paymentMethod: 'razorpay',
                            paymentStatus: 'paid',
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        });
                        
                        if (orderResponse.success) {
                            showToast('Payment successful! Order placed.', 'success');
                            
                            // Clear cart
                            const token = localStorage.getItem('customerToken');
                            if (token) {
                                localStorage.removeItem('userCart');
                            } else {
                                localStorage.removeItem('guestCart');
                            }
                            
                            // Clear pending order data
                            localStorage.removeItem('pendingOrderData');
                            
                            // Redirect to order confirmation
                            setTimeout(() => {
                                window.location.href = `/order-confirmation.html?id=${orderResponse.order._id}`;
                            }, 2000);
                        } else {
                            showToast('Error creating order: ' + orderResponse.message, 'error');
                            showLoadingState(false);
                            resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
                            isProcessing = false;
                        }
                    } catch (error) {
                        console.error('❌ Order creation error:', error);
                        showToast('Error creating order: ' + error.message, 'error');
                        showLoadingState(false);
                        resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
                        isProcessing = false;
                    }
                },
                modal: {
                    ondismiss: function() {
                        console.log('❌ Payment modal dismissed');
                        showToast('Payment cancelled', 'warning');
                        showLoadingState(false);
                        resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
                        isProcessing = false;
                        localStorage.removeItem('pendingOrderData');
                    },
                    escape: false,
                    handleback: true
                },
                // Add retry options
                retry: {
                    enabled: true,
                    max_count: 3
                }
            };
            
            // Do not set image property at all to prevent wordmark 404 errors
            // Razorpay's wordmark system has known issues with custom images
            console.log("ℹ️ Not setting image property to prevent Razorpay wordmark 404 errors");

            // Initialize Razorpay (global blocker is already active)
            const rzp = new Razorpay(options);
            
            // Add event listeners for better error handling
            rzp.on('payment.failed', function (resp) {
                const err = (resp && resp.error) || {};
                const friendly = err.description || (err.reason ? `Payment failed: ${err.reason}` : 'Payment failed. Please try a Card or UPI.');
                try {
                    console.error('❌ Payment failed:', {
                        code: err.code,
                        description: err.description,
                        source: err.source,
                        step: err.step,
                        reason: err.reason,
                        metadata: err.metadata
                    });
                } catch (_) {
                    console.error('❌ Payment failed (raw):', resp);
                }
                showToast(friendly, 'error');
                showLoadingState(false);
                resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
                isProcessing = false;
                localStorage.removeItem('pendingOrderData');
            });
            
            rzp.on('payment.cancelled', function (resp) {
                console.log('❌ Payment cancelled by user');
                showToast('Payment cancelled', 'warning');
                showLoadingState(false);
                resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
                isProcessing = false;
                localStorage.removeItem('pendingOrderData');
            });
            
            showLoadingState(false);
            console.log('🔄 Opening Razorpay modal...');
            
            // Open Razorpay modal
            rzp.open();
            
        } else {
            console.error('❌ Failed to create Razorpay order:', razorpayResponse);
            showToast('Error creating payment order: ' + (razorpayResponse.message || 'Unknown error'), 'error');
            showLoadingState(false);
            resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
            isProcessing = false;
        }
    } catch (error) {
        console.error('❌ Razorpay payment error:', error);
        showToast('Error processing payment: ' + error.message, 'error');
        showLoadingState(false);
        resetOrderButton(document.getElementById('place-order-btn'), 'Pay with Razorpay');
        isProcessing = false;
    }
}

// Process COD order
async function processCODOrder(orderData) {
    try {
        console.log('💵 Processing COD order...');
        showLoadingState(true, 'Placing COD order...');
        
        // Create order directly
        await createOrder(orderData);
    } catch (error) {
        console.error('❌ COD order error:', error);
        showToast('Error placing COD order: ' + error.message, 'error');
        showLoadingState(false);
        isProcessing = false; // Reset processing flag
        
        // Reset button
        const placeOrderBtn = document.getElementById('place-order-btn');
        resetOrderButton(placeOrderBtn, 'Place Order (Cash on Delivery)');
    }
}

// Create order
async function createOrder(orderData) {
    try {
        console.log('📦 Creating order...');
        showLoadingState(true, 'Creating order...');
        
        // SECURITY: Frontend validation before sending to server
        if (!orderData.totalAmount || orderData.totalAmount <= 0) {
            throw new Error('Invalid order amount');
        }
        
        if (!orderData.orderItems || orderData.orderItems.length === 0) {
            throw new Error('Order must contain items');
        }
        
        // Calculate expected total
        const expectedTotal = orderData.orderItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        if (Math.abs(expectedTotal - orderData.totalAmount) > 0.01) {
            throw new Error('Order amount mismatch detected');
        }
        
        console.log('✅ Frontend validation passed, sending to server...');
        console.log('📤 Sending order data to server:', JSON.stringify(orderData, null, 2));
        
        const response = await api.createCustomerOrder(orderData);
        console.log('📥 Server response:', response);
        
        if (response.success) {
            showToast('Order placed successfully!', 'success');
            
            // Clear cart from localStorage
            const token = localStorage.getItem('customerToken');
            if (token) {
                localStorage.removeItem('userCart');
                console.log('🧹 User cart cleared');
            } else {
                localStorage.removeItem('guestCart');
                console.log('🧹 Guest cart cleared');
            }
            
            // Prevent back button from resubmitting order
            // Replace current history entry to prevent form resubmission
            window.history.replaceState({ orderCompleted: true }, '', window.location.href);
            
            // Redirect to order confirmation
            setTimeout(() => {
                window.location.href = `/order-confirmation.html?id=${response.order._id}`;
            }, 2000);
        } else {
            showToast('Error creating order: ' + response.message, 'error');
            showLoadingState(false);
            isProcessing = false; // Reset processing flag
        }
    } catch (error) {
        console.error('❌ Create order error:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            orderData: orderData
        });
        showToast('Error creating order: ' + error.message, 'error');
        showLoadingState(false);
        isProcessing = false; // Reset processing flag
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 transform translate-x-full`;
    
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500');
            break;
        default:
            toast.classList.add('bg-charcoal');
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
} 

// Get current order data from form
function getCurrentOrderData() {
    try {
        // Validate and get shipping address
        const shippingAddress = validateAndGetAddress();
        if (!shippingAddress) {
            return null;
        }
        
        // Debug: Log the order items before creating order
        console.log('📦 Creating order with items:', orderItems);
        console.log('📊 Order items count:', orderItems.length);
        console.log('💰 Order total:', orderTotal);
        
        if (orderItems.length === 0) {
            console.error('❌ No items in order! This will cause stock update to fail.');
            showToast('No items in order. Please add items to cart first.', 'error');
            return null;
        }
        
        // Create order data with color information
        const orderData = {
            orderItems: orderItems.map(item => ({
                product: item.id,
                name: item.name,
                price: item.price,
                quantity: item.qty,
                image: sanitizeOrderItemImage(item.image),
                color: item.color || { name: "N/A", code: "#000000" } // Include color information
            })),
            shippingAddress,
            totalAmount: orderTotal,
            paymentMethod: 'razorpay'
        };
        
        console.log('📦 Order data prepared:', {
            itemCount: orderData.orderItems.length,
            totalAmount: orderData.totalAmount,
            itemsWithColors: orderData.orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                color: item.color?.name || 'N/A'
            }))
        });
        
        return orderData;
    } catch (error) {
        console.error('❌ Error preparing order data:', error);
        showToast('Error preparing order data: ' + error.message, 'error');
        return null;
    }
} 