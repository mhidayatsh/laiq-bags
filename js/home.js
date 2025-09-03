// Home Page JavaScript
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
        
        return `
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div class="relative">
                    <a href="product?id=${productId}" class="block">
                        <img src="${product.images?.[0]?.url || product.image || 'assets/thumbnail.jpg'}" 
                             alt="${product.name}" 
                             loading="lazy" 
                             decoding="async" 
                             fetchpriority="low"
                             onerror="this.onerror=null;this.src='assets/thumbnail.jpg'"
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
                        <a href="product?id=${productId}" 
                           class="bg-charcoal/10 text-charcoal py-2 px-3 rounded-lg font-semibold hover:bg-charcoal hover:text-white transition-colors">
                            <i class="fas fa-eye mr-1"></i>View
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Initialize countdown timers for products with active discounts
    featuredProducts.forEach(product => {
        if (product.discountInfo && product.discountInfo.status === 'active' && product.discountInfo.timeRemaining) {
            initializeCountdownTimer(product._id || product.id, product.discountInfo.timeRemaining);
        }
    });
    
    // Add event listeners for add to cart buttons
    addCartEventListeners();
}

// Get display price (with discount if applicable)
function getDisplayPrice(product) {
    if (product.discountInfo && product.discountInfo.status === 'active') {
        const discountValue = parseFloat(product.discountInfo.value.replace('%', ''));
        return Math.round(product.price * (1 - discountValue / 100));
    }
    return product.price;
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
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

// Initialize countdown timer
function initializeCountdownTimer(productId, timeRemaining) {
    const countdownElement = document.querySelector(`[data-countdown="${productId}"]`);
    if (!countdownElement) return;
    
    let timeLeft = timeRemaining;
    
    const updateTimer = () => {
        if (timeLeft <= 0) {
            countdownElement.innerHTML = '<div class="text-red-500 text-sm font-semibold">Offer Expired!</div>';
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        countdownElement.innerHTML = `
            <div class="text-xs text-charcoal/60 mb-1">Offer ends in:</div>
            <div class="flex gap-1 text-xs">
                <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${days.toString().padStart(2, '0')}</div>
                <div class="text-charcoal/60 self-center">:</div>
                <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${hours.toString().padStart(2, '0')}</div>
                <div class="text-charcoal/60 self-center">:</div>
                <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${minutes.toString().padStart(2, '0')}</div>
                <div class="text-charcoal/60 self-center">:</div>
                <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${seconds.toString().padStart(2, '0')}</div>
            </div>
        `;
        
        timeLeft -= 1000;
    };
    
    updateTimer();
    countdownTimers[productId] = setInterval(updateTimer, 1000);
}

// Get countdown timer HTML
function getCountdownTimerHTML(productId, timeRemaining) {
    const timeLeft = timeRemaining;
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    return `
        <div class="text-xs text-charcoal/60 mb-1">Offer ends in:</div>
        <div class="flex gap-1 text-xs">
            <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${days.toString().padStart(2, '0')}</div>
            <div class="text-charcoal/60 self-center">:</div>
            <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${hours.toString().padStart(2, '0')}</div>
            <div class="text-charcoal/60 self-center">:</div>
            <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${minutes.toString().padStart(2, '0')}</div>
            <div class="text-charcoal/60 self-center">:</div>
            <div class="bg-red-500 text-white px-2 py-1 rounded font-mono">${seconds.toString().padStart(2, '0')}</div>
        </div>
    `;
}

// Add cart event listeners
function addCartEventListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            const productImage = this.getAttribute('data-image');
            
            // Add to cart using the shared cart module
            if (window.cartModule && window.cartModule.addToCart) {
                window.cartModule.addToCart({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            } else {
                console.error('Cart module not available');
            }
        });
    });
}

// Initialize testimonials carousel
function initializeTestimonialCarousel() {
    try {
        const wrapper = document.getElementById('testimonial-carousel');
        if (!wrapper) return;
        
        const track = document.getElementById('testimonial-track');
        const slides = track.querySelectorAll('div');
        const nextBtn = document.getElementById('testimonial-next');
        const prevBtn = document.getElementById('testimonial-prev');
        
        if (!track || slides.length === 0) return;
        
        let currentIndex = 0;
        let isAnimating = false;
        let autoTimer = null;
        
        const isMobile = window.innerWidth <= 768;
        
        const applySizes = () => {
            const slideWidth = wrapper.clientWidth;
            
            if (isMobile) {
                // Mobile: Show only first testimonial, hide others
                slides.forEach((slide, index) => {
                    slide.style.display = index === 0 ? 'flex' : 'none';
                    slide.style.boxSizing = 'border-box';
                    slide.style.flexDirection = 'column';
                    slide.style.alignItems = 'center';
                    slide.style.justifyContent = 'center';
                    slide.style.textAlign = 'center';
                    slide.style.width = '100%';
                    slide.style.minWidth = '100%';
                    slide.style.maxWidth = '100%';
                    slide.style.padding = '0 1rem';
                });
                
                // Reset track transform for mobile
                track.style.transform = 'none';
                track.style.width = '100%';
                track.style.display = 'flex';
                track.style.justifyContent = 'center';
                track.style.alignItems = 'center';
            } else {
                // Desktop: Carousel functionality
                slides.forEach(slide => {
                    slide.style.display = 'flex';
                    slide.style.boxSizing = 'border-box';
                    slide.style.flex = `0 0 ${slideWidth}px`;
                    slide.style.minWidth = slideWidth + 'px';
                    slide.style.maxWidth = slideWidth + 'px';
                    slide.style.flexDirection = 'column';
                    slide.style.alignItems = 'center';
                    slide.style.justifyContent = 'center';
                    slide.style.textAlign = 'center';
                });
                
                // Track width adjusts naturally from children; keep transform in sync
                track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            }
        };
        
        const goTo = (index) => {
            if (isAnimating) return;
            isAnimating = true;
            
            if (isMobile) {
                // Mobile: Simple show/hide navigation
                slides.forEach((slide, i) => {
                    slide.style.display = i === index ? 'flex' : 'none';
                });
                currentIndex = (index + slides.length) % slides.length;
            } else {
                // Desktop: Carousel transform
                const slideWidth = wrapper.clientWidth;
                currentIndex = (index + slides.length) % slides.length;
                track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
            }
            
            // Unlock after CSS transition
            setTimeout(() => { isAnimating = false; }, 520);
        };
        
        const next = () => goTo(currentIndex + 1);
        const prev = () => goTo(currentIndex - 1);
        
        const onManual = (fn) => {
            stopAuto();
            fn();
            if (!isMobile) startAuto(); // Only auto-rotate on desktop
        };
        
        nextBtn && nextBtn.addEventListener('click', () => onManual(next));
        prevBtn && prevBtn.addEventListener('click', () => onManual(prev));
        
        // Auto-rotate every 6s (desktop only)
        const startAuto = () => {
            if (!isMobile) {
                stopAuto();
                autoTimer = setInterval(next, 6000);
            }
        };
        const stopAuto = () => {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = null;
        };
        startAuto();
        
        // Pause on hover (desktop only)
        if (!isMobile) {
            wrapper.addEventListener('mouseenter', stopAuto);
            wrapper.addEventListener('mouseleave', startAuto);
        }
        
        // Touch swipe (mobile)
        let touchStartX = 0;
        let touchDeltaX = 0;
        wrapper.addEventListener('touchstart', (e) => {
            if (isMobile) {
                touchStartX = e.touches[0].clientX;
                touchDeltaX = 0;
            } else {
                stopAuto();
                touchStartX = e.touches[0].clientX;
                touchDeltaX = 0;
            }
        }, { passive: true });
        wrapper.addEventListener('touchmove', (e) => {
            touchDeltaX = e.touches[0].clientX - touchStartX;
        }, { passive: true });
        wrapper.addEventListener('touchend', () => {
            if (Math.abs(touchDeltaX) > 40) {
                if (touchDeltaX < 0) next(); else prev();
            }
            if (!isMobile) startAuto();
        });
        
        // Recalculate sizes on resize and keep position
        window.addEventListener('resize', () => {
            // Recalculate mobile state on resize
            const wasMobile = isMobile;
            isMobile = window.innerWidth <= 768;
            
            // If mobile state changed, reinitialize
            if (wasMobile !== isMobile) {
                applySizes();
                goTo(0);
            } else {
                applySizes();
            }
        });
        
        // Initial position
        applySizes();
        goTo(0);
    } catch (e) {
        console.warn('Testimonials carousel init failed:', e);
    }
}

// Initialize newsletter form
function initializeNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = form.querySelector('input[type="email"]').value.trim();
        if (!email) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Thank you for subscribing!', 'success');
                form.reset();
            } else {
                showNotification(data.message || 'Subscription failed', 'error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            showNotification('Subscription failed. Please try again.', 'error');
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.className += ' bg-green-500 text-white';
            break;
        case 'error':
            notification.className += ' bg-red-500 text-white';
            break;
        default:
            notification.className += ' bg-blue-500 text-white';
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
