// Home Page JavaScript
let featuredProducts = [];
let countdownTimers = {};

// Initialize home page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🏠 Home page initialized');
    
    try {
        // Check if API is available
        if (typeof api === 'undefined') {
            console.warn('⚠️ API not available, using local data');
            loadLocalFeaturedProducts();
            return;
        }
        
        // Load featured products from API
        await loadFeaturedProducts();
        
        // Initialize newsletter
        initializeNewsletter();
        
        // Start countdown timers
        startCountdownTimers();
        
        console.log('✅ Home page ready');
    } catch (error) {
        console.error('❌ Error initializing home:', error);
        
        // Show user-friendly error message
        if (typeof showToast === 'function') {
            showToast('Unable to load products. Please refresh the page.', 'error');
        }
        
        // Fallback to local data
        loadLocalFeaturedProducts();
        
        // Initialize other components even if API fails
        try {
            initializeNewsletter();
            startCountdownTimers();
        } catch (fallbackError) {
            console.error('❌ Error in fallback initialization:', fallbackError);
        }
    }
});

// Load featured products from API
async function loadFeaturedProducts() {
    try {
        console.log('📡 Loading featured products from API...');
        
        // Add timeout to API call
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API request timeout')), 15000); // 15 seconds
        });
        
        const apiPromise = api.getProducts({ featured: true, limit: 4 });
        const response = await Promise.race([apiPromise, timeoutPromise]);
        
        featuredProducts = (response && response.products) ? response.products : [];
        console.log(`✅ Loaded ${featuredProducts.length} featured products from API`);
        
        // Render featured products
        renderFeaturedProducts();
    } catch (error) {
        console.error('❌ Failed to load featured products from API:', error);
        throw error;
    }
}

// Load local featured products as fallback
function loadLocalFeaturedProducts() {
    console.log('⚠️ Using local data as fallback');
    const localProducts = window.products || [];
    featuredProducts = localProducts.filter(p => p.featured).slice(0, 4);
    renderFeaturedProducts();
}

// Get display price (with discount if applicable)
function getDisplayPrice(product) {
    if (product.discountInfo && product.discountInfo.status === 'active') {
        return product.discountInfo.discountPrice;
    }
    return product.price;
}

// Format time remaining for better display
function formatTimeRemaining(timeRemaining) {
    if (!timeRemaining) return null;
    
    const { days, hours, minutes } = timeRemaining;
    
    if (days > 0) {
        return `${days} days ${hours} hours`;
    } else if (hours > 0) {
        return `${hours} hours ${minutes} minutes`;
    } else {
        return `${minutes} minutes`;
    }
}

// Get countdown timer HTML
function getCountdownTimerHTML(productId, timeRemaining) {
    if (!timeRemaining) return '';
    
    const formattedTime = formatTimeRemaining(timeRemaining);
    const urgencyClass = timeRemaining.days === 0 && timeRemaining.hours < 24 ? 'bg-red-500' : 'bg-orange-500';
    
    return `
        <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-red-600 font-medium">
                    <i class="fas fa-clock mr-1"></i>Offer ends in:
                </div>
                <div class="text-xs text-red-500 font-bold">${formattedTime}</div>
            </div>
            <div class="flex items-center space-x-1 text-xs">
                ${timeRemaining.days > 0 ? `
                    <div class="flex flex-col items-center">
                        <span class="${urgencyClass} text-white px-2 py-1 rounded font-bold">${timeRemaining.days}</span>
                        <span class="text-red-600 text-xs mt-1">Days</span>
                    </div>
                ` : ''}
                ${timeRemaining.hours > 0 ? `
                    <div class="flex flex-col items-center">
                        <span class="${urgencyClass} text-white px-2 py-1 rounded font-bold">${timeRemaining.hours}</span>
                        <span class="text-red-600 text-xs mt-1">Hours</span>
                    </div>
                ` : ''}
                <div class="flex flex-col items-center">
                    <span class="${urgencyClass} text-white px-2 py-1 rounded font-bold">${timeRemaining.minutes}</span>
                    <span class="text-red-600 text-xs mt-1">Mins</span>
                </div>
            </div>
        </div>
    `;
}

// Start countdown timers for all products
function startCountdownTimers() {
    // Clear existing timers
    Object.values(countdownTimers).forEach(timer => clearInterval(timer));
    countdownTimers = {};
    
    featuredProducts.forEach(product => {
        if (product.discountInfo && product.discountInfo.status === 'active' && product.discountInfo.timeRemaining) {
            const productId = product._id || product.id;
            countdownTimers[productId] = setInterval(() => {
                updateCountdownTimer(productId, product.discountInfo.timeRemaining);
            }, 60000); // Update every minute
        }
    });
}

// Update countdown timer for specific product
function updateCountdownTimer(productId, timeRemaining) {
    if (!timeRemaining) return;
    
    const timerContainer = document.querySelector(`[data-countdown="${productId}"]`);
    if (!timerContainer) return;
    
    // Calculate new time remaining
    const now = new Date();
    const endDate = new Date(now.getTime() + 
        (timeRemaining.days * 24 * 60 * 60 * 1000) + 
        (timeRemaining.hours * 60 * 60 * 1000) + 
        (timeRemaining.minutes * 60 * 1000));
    
    const diff = endDate - now;
    
    if (diff <= 0) {
        // Timer expired
        timerContainer.innerHTML = `
            <div class="mb-3 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                <div class="text-xs text-gray-600 font-medium text-center">
                    <i class="fas fa-clock mr-1"></i>Offer Expired
                </div>
            </div>
        `;
        clearInterval(countdownTimers[productId]);
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const newTimeRemaining = { days, hours, minutes };
    const formattedTime = formatTimeRemaining(newTimeRemaining);
    const urgencyClass = days === 0 && hours < 24 ? 'bg-red-500' : 'bg-orange-500';
    
    timerContainer.innerHTML = `
        <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-red-600 font-medium">
                    <i class="fas fa-clock mr-1"></i>Offer ends in:
                </div>
                <div class="text-xs text-red-500 font-bold">${formattedTime}</div>
            </div>
            <div class="flex items-center space-x-1 text-xs">
                ${days > 0 ? `
                    <div class="flex flex-col items-center">
                        <span class="${urgencyClass} text-white px-2 py-1 rounded font-bold">${days}</span>
                        <span class="text-red-600 text-xs mt-1">Days</span>
                    </div>
                ` : ''}
                ${hours > 0 ? `
                    <div class="flex flex-col items-center">
                        <span class="${urgencyClass} text-white px-2 py-1 rounded font-bold">${hours}</span>
                        <span class="text-red-600 text-xs mt-1">Hours</span>
                    </div>
                ` : ''}
                <div class="flex flex-col items-center">
                    <span class="${urgencyClass} text-white px-2 py-1 rounded font-bold">${minutes}</span>
                    <span class="text-red-600 text-xs mt-1">Mins</span>
                </div>
            </div>
        </div>
    `;
}

// Render featured products
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    if (featuredProducts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-charcoal/60 text-lg">No featured products available</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = featuredProducts.map(product => {
        const hasDiscount = product.discountInfo && product.discountInfo.status === 'active';
        const displayPrice = getDisplayPrice(product);
        const originalPrice = product.price;
        const productId = product._id || product.id;
        
        const imgSrc = product.images?.[0]?.url || product.image || 'assets/thumbnail.jpg';
        return `
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div class="relative">
                    <a href="product.html?id=${productId}" class="block">
                        <img src="${imgSrc}" alt="${product.name}" 
                             class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </a>
                    
                    <!-- Discount Badge -->
                    ${hasDiscount ? `
                        <div class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10 animate-pulse">
                            <i class="fas fa-fire mr-1"></i>${product.discountInfo.value} OFF
                        </div>
                    ` : ''}
                    
                    <!-- Featured Badge (positioned below discount if exists) -->
                    ${product.featured ? `
                        <span class="absolute ${hasDiscount ? 'top-12' : 'top-3'} left-3 bg-gold text-white text-xs px-2 py-1 rounded-full font-semibold">
                            <i class="fas fa-star mr-1"></i>Featured
                        </span>
                    ` : ''}
                    ${product.newArrival ? `
                        <span class="absolute ${hasDiscount ? 'top-12' : 'top-3'} left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            <i class="fas fa-sparkles mr-1"></i>New
                        </span>
                    ` : ''}
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-lg text-charcoal mb-2">${product.name}</h3>
                    <div class="flex items-center gap-2 mb-2">
                        ${generateStars(product.ratings || product.rating || 0)}
                        <span class="text-sm text-charcoal/60">(${product.numOfReviews || 0} reviews)</span>
                    </div>
                    <p class="text-charcoal/70 text-sm mb-3 line-clamp-2">${product.shortDescription || product.description || ''}</p>
                    
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            ${hasDiscount ? `
                                <div class="flex flex-col">
                                    <span class="text-gold font-bold text-lg">₹${displayPrice.toLocaleString()}</span>
                                    <span class="text-charcoal/40 text-sm line-through">₹${originalPrice.toLocaleString()}</span>
                                </div>
                            ` : `
                                <div class="text-gold font-bold text-lg">₹${displayPrice.toLocaleString()}</div>
                            `}
                        </div>
                        <div class="text-charcoal/60 text-sm">${product.material}</div>
                    </div>
                    
                    <!-- Enhanced Countdown Timer -->
                    ${hasDiscount && product.discountInfo.timeRemaining ? `
                        <div data-countdown="${productId}">
                            ${getCountdownTimerHTML(productId, product.discountInfo.timeRemaining)}
                        </div>
                    ` : ''}
                    
                    <div class="flex gap-2">
                        <button class="add-to-cart-btn flex-1 bg-gold text-white py-2 px-4 rounded-lg font-semibold hover:bg-charcoal transition-colors" 
                                data-id="${productId}" data-name="${product.name}" data-price="${displayPrice}" data-image="${product.images?.[0]?.url || product.image}">
                            <i class="fas fa-shopping-cart mr-2"></i>Add to Cart
                        </button>
                        <a href="product.html?id=${productId}" 
                           class="bg-charcoal/10 text-charcoal py-2 px-3 rounded-lg font-semibold hover:bg-charcoal hover:text-white transition-colors">
                            <i class="fas fa-eye mr-1"></i>View
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners for add to cart buttons
    addFeaturedProductEventListeners();
}

// Add event listeners to featured product buttons
function addFeaturedProductEventListeners() {
    // Add to Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });
}

// Handle Add to Cart
function handleAddToCart(e) {
    const btn = e.currentTarget;
    const productId = btn.dataset.id;
    const productName = btn.dataset.name;
    const productPrice = parseInt(btn.dataset.price);
    const productImage = btn.dataset.image;
    
    console.log('🛒 Adding to cart from home page:', productName);
    
    // Find the product to check color variants
    const product = featuredProducts.find(p => (p._id || p.id) === productId);
    
    if (!product) {
        console.error('❌ Product not found:', productId);
        showToast('Product not found', 'error');
        return;
    }
    
    // Check if product has multiple color variants
    const hasMultipleColors = product.colorVariants && product.colorVariants.length > 1;
    const hasLegacyColors = product.colors && product.colors.length > 1;
    
    if (hasMultipleColors || hasLegacyColors) {
        // Multi-color product - redirect to product detail page
        console.log('🎨 Multi-color product detected, redirecting to product detail');
        showToast('Please select a color on the product page', 'info');
        
        // Redirect to product detail page
        window.location.href = `product.html?id=${productId}`;
        return;
    }
    
    // Single color or no color variants - auto-add to cart
    let selectedColor = null;
    
    if (product.colorVariants && product.colorVariants.length === 1) {
        // Single color variant
        const colorVariant = product.colorVariants[0];
        if (colorVariant.isAvailable && colorVariant.stock > 0) {
            selectedColor = { name: colorVariant.name, code: colorVariant.code || '#000000' };
            console.log('🎨 Auto-selected single color variant:', selectedColor);
        }
    } else if (product.colors && product.colors.length === 1) {
        // Single legacy color
        selectedColor = { name: product.colors[0], code: '#000000' };
        console.log('🎨 Auto-selected single legacy color:', selectedColor);
    }
    
    console.log('🎨 Final selected color for cart:', selectedColor);
    
    // Add to cart with color information
    addToCart(productId, productName, productPrice, productImage, selectedColor);
    
    // Show success message
    showToast('Added to cart!', 'success');
    
    // Update cart count
    updateCartCount();
}

// Initialize newsletter
function initializeNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput.value.trim();
        
        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }
        
        try {
            console.log('📧 Subscribing to newsletter:', email);
            
            // Try API first
            try {
                await api.subscribeNewsletter(email);
                showToast('Successfully subscribed to newsletter!', 'success');
            } catch (apiError) {
                console.log('⚠️ API failed, using localStorage fallback');
                // Fallback to localStorage
                const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
                if (!subscribers.includes(email)) {
                    subscribers.push(email);
                    localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
                }
                showToast('Successfully subscribed to newsletter!', 'success');
            }
            
            emailInput.value = '';
        } catch (error) {
            console.error('❌ Newsletter subscription failed:', error);
            showToast('Failed to subscribe. Please try again.', 'error');
        }
    });
}

// Show toast notification
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
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
} 

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star text-yellow-400"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star text-yellow-400"></i>';
    }
    
    return starsHTML;
} 