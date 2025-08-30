// Home Page JavaScript

// Add skeleton loader to prevent layout shift - IMMEDIATE execution
(function() {
    // Show skeleton immediately, don't wait for DOMContentLoaded
    const container = document.getElementById('featured-products');
    if (container) {
        const skeletonHTML = Array(4).fill(0).map(() => `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div class="relative">
                    <div class="w-full h-64 bg-gray-200"></div>
                    <div class="absolute top-3 left-3 w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div class="p-4">
                    <div class="h-6 bg-gray-200 rounded mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        `).join('');
        container.innerHTML = skeletonHTML;
        console.log('🔄 Skeleton loader applied immediately');
    }
})();

// Also show skeleton on DOMContentLoaded as backup
function showHomeSkeletonLoader() {
    const container = document.getElementById('featured-products');
    if (container && container.children.length === 0) {
        const skeletonHTML = Array(4).fill(0).map(() => `
            <div class="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div class="relative">
                    <div class="w-full h-64 bg-gray-200"></div>
                    <div class="absolute top-3 left-3 w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div class="p-4">
                    <div class="h-6 bg-gray-200 rounded mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-4 bg-gray-200 rounded mb-3"></div>
                    <div class="h-8 bg-gray-200 rounded"></div>
                </div>
            </div>
        `).join('');
        container.innerHTML = skeletonHTML;
        console.log('🔄 Skeleton loader applied on DOMContentLoaded');
    }
}

// Show skeleton loader immediately when page loads
document.addEventListener('DOMContentLoaded', function() {
    showHomeSkeletonLoader();
});

let featuredProducts = [];
let countdownTimers = {};

// Initialize home page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Home page initializing...');
    
    // Initialize video error handling
    initializeVideoErrorHandling();
    
    // Load featured products
    loadFeaturedProducts();
    
    // Initialize testimonials carousel
    initializeTestimonialCarousel();
    
    // Initialize newsletter form
    initializeNewsletter();
    
    console.log('✅ Home page ready');
});

// Video error handling
function initializeVideoErrorHandling() {
    const video = document.querySelector('video');
    if (video) {
        video.addEventListener('error', function(e) {
            console.log('❌ Video failed to load:', e);
            // Hide video and show fallback image
            this.style.display = 'none';
            const fallbackImage = this.nextElementSibling;
            if (fallbackImage && fallbackImage.tagName === 'IMG') {
                fallbackImage.style.display = 'block';
                console.log('🖼️ Showing fallback image');
            }
        });
        
        video.addEventListener('loadstart', function() {
            console.log('🎥 Video loading started');
        });
        
        video.addEventListener('canplay', function() {
            console.log('✅ Video ready to play');
        });
    }
}

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

// Enhanced image loading handler
function handleImageLoad(img) {
    const fallback = img.nextElementSibling;
    if (fallback && fallback.tagName === 'DIV') {
        fallback.style.display = 'none';
    }
    img.style.display = 'block';
}

// Enhanced image error handler
function handleImageError(img) {
    img.onerror = null;
    img.src = 'assets/thumbnail.jpg';
    img.style.display = 'block';
    const fallback = img.nextElementSibling;
    if (fallback && fallback.tagName === 'DIV') {
        fallback.style.display = 'none';
    }
}

// Update the renderFeaturedProducts function to use better image handling
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
                    <a href="product?id=${productId}" class="block">
                        <img src="${imgSrc}" alt="${product.name}"
                             loading="lazy" decoding="async" fetchpriority="low"
                             width="400" height="256"
                             onload="handleImageLoad(this)"
                             onerror="handleImageError(this)"
                             style="display: none;"
                             class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <!-- Fallback div that shows while image loads -->
                        <div class="w-full h-64 bg-gray-200 flex items-center justify-center" style="display: block;">
                            <div class="text-gray-400 text-sm">Loading...</div>
                        </div>
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
                        <a href="product?id=${productId}" 
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
        window.location.href = `/product?id=${productId}`;
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

// Testimonials carousel
function initializeTestimonialCarousel() {
    try {
        const track = document.getElementById('testimonial-track');
        const prevBtn = document.getElementById('testimonial-prev');
        const nextBtn = document.getElementById('testimonial-next');
        const wrapper = document.getElementById('testimonial-carousel');
        if (!track || !wrapper) return;

        const slides = Array.from(track.children);
        if (slides.length === 0) return;

        let currentIndex = 0;
        let autoTimer = null;
        let isAnimating = false;

        // Enforce one-slide-per-view sizing
        const applySizes = () => {
            const slideWidth = wrapper.clientWidth;
            const isMobile = window.innerWidth <= 640;
            
            // Set each slide to exactly the wrapper width
            slides.forEach(slide => {
                slide.style.boxSizing = 'border-box';
                slide.style.flex = `0 0 ${slideWidth}px`;
                slide.style.minWidth = slideWidth + 'px';
                slide.style.maxWidth = slideWidth + 'px';
                slide.style.display = 'flex';
                slide.style.flexDirection = 'column';
                slide.style.alignItems = 'center';
                slide.style.justifyContent = 'center';
                slide.style.textAlign = 'center';
                
                // Mobile-specific adjustments
                if (isMobile) {
                    slide.style.width = '100%';
                    slide.style.maxWidth = '100%';
                    slide.style.padding = '0 1rem';
                }
            });
            
            // Track width adjusts naturally from children; keep transform in sync
            // Keep current slide in view after resize
            track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            
            // Ensure track is properly centered on mobile
            if (isMobile) {
                track.style.width = '100%';
                track.style.maxWidth = '100%';
                track.style.display = 'flex';
                track.style.justifyContent = 'center';
                track.style.alignItems = 'center';
            }
        };

        const goTo = (index) => {
            if (isAnimating) return;
            isAnimating = true;
            const slideWidth = wrapper.clientWidth;
            currentIndex = (index + slides.length) % slides.length;
            track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            // Unlock after CSS transition
            setTimeout(() => { isAnimating = false; }, 520);
        };

        const next = () => goTo(currentIndex + 1);
        const prev = () => goTo(currentIndex - 1);

        const onManual = (fn) => {
            stopAuto();
            fn();
            startAuto();
        };

        nextBtn && nextBtn.addEventListener('click', () => onManual(next));
        prevBtn && prevBtn.addEventListener('click', () => onManual(prev));

        // Auto-rotate every 6s
        const startAuto = () => {
            stopAuto();
            autoTimer = setInterval(next, 6000);
        };
        const stopAuto = () => {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = null;
        };
        startAuto();

        // Pause on hover (desktop)
        wrapper.addEventListener('mouseenter', stopAuto);
        wrapper.addEventListener('mouseleave', startAuto);

        // Touch swipe (mobile)
        let touchStartX = 0;
        let touchDeltaX = 0;
        wrapper.addEventListener('touchstart', (e) => {
            stopAuto();
            touchStartX = e.touches[0].clientX;
            touchDeltaX = 0;
        }, { passive: true });
        wrapper.addEventListener('touchmove', (e) => {
            touchDeltaX = e.touches[0].clientX - touchStartX;
        }, { passive: true });
        wrapper.addEventListener('touchend', () => {
            if (Math.abs(touchDeltaX) > 40) {
                if (touchDeltaX < 0) next(); else prev();
            }
            startAuto();
        });

        // Recalculate sizes on resize and keep position
        window.addEventListener('resize', applySizes);

        // Initial position
        applySizes();
        goTo(0);
    } catch (e) {
        console.warn('Testimonials carousel init failed:', e);
    }
}