// Product Detail Page JavaScript
let currentProduct = null;
let productCache = new Map();
const PRODUCT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Clear product page cache
function clearProductCache() {
    productCache.clear();
    console.log('🗑️ Cleared product page cache');
}

// Force refresh product details
async function forceRefreshProductDetails() {
    console.log('🔄 Force refreshing product details...');
    clearProductCache();
    
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const id = urlParams.get('id');
    
    if (slug) {
        await loadProductFromAPI(slug, 'slug');
        renderProductDetail();
    } else if (id) {
        await loadProductFromAPI(id, 'id');
        renderProductDetail();
    }
}

// Initialize product page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📦 Product detail page initialized');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL Search Params:', window.location.search);
    
    // Wait for DOM to be fully ready and all elements to be available
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Double-check that critical elements exist
    const criticalElements = ['product-content', 'loading-state', 'error-state'];
    const missingElements = criticalElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('❌ Critical elements missing:', missingElements);
        console.error('❌ Available elements:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    try {
        // Get product identifier from URL - support both slug and ID parameters
        let productIdentifier = null;
        let identifierType = null;
        
        // First try slug parameter format (?slug=...)
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        const id = urlParams.get('id');
        
        if (slug) {
            productIdentifier = slug;
            identifierType = 'slug';
            console.log('🔍 Found product slug:', slug);
        } else if (id) {
            productIdentifier = id;
            identifierType = 'id';
            console.log('🔍 Found product ID:', id);
        } else {
            // If not found, try SEO-friendly URL format (/product/product-name-id)
            const pathSegments = window.location.pathname.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];
            
            // Check if last segment contains a valid ObjectId (24 character hex string)
            if (lastSegment && /^[0-9a-fA-F]{24}$/.test(lastSegment)) {
                productIdentifier = lastSegment;
                identifierType = 'id';
            } else if (lastSegment && lastSegment.includes('-')) {
                // Extract ID from format: product-name-id
                const parts = lastSegment.split('-');
                const potentialId = parts[parts.length - 1];
                if (/^[0-9a-fA-F]{24}$/.test(potentialId)) {
                    productIdentifier = potentialId;
                    identifierType = 'id';
                }
            }
        }
        
        console.log('🔍 Product identifier from URL:', productIdentifier, 'Type:', identifierType);
        
        if (!productIdentifier) {
            console.error('❌ No product identifier found in URL');
            showError('Product not found');
            return;
        }
        
        // Show loading state
        console.log('⏳ Showing loading state');
        showLoading();
        
        // Load product from API with caching
        console.log('📡 Starting to load product from API');
        await loadProductFromAPI(productIdentifier, identifierType);
        
        // Render product details first, then hide loader after first paint (or main image load)
        console.log('🎨 Starting to render product details');
        renderProductDetail();
        
        // Wait for images to load or show fallbacks
        await waitForImagesOrFallbacks();
        
        await waitForFirstContentReady(5000);
        console.log('✅ Product content ready, hiding loading state');
        hideLoading();
        
        console.log('✅ Product detail page ready');
    } catch (error) {
        console.error('❌ Error loading product:', error);
        hideLoading();
        
        // Check if it's a "Product not found" error
        if (error.message && error.message.includes('Product not found')) {
            showProductNotFound();
        } else {
            showError('Failed to load product details. Please try again.');
        }
    }
});

// Show loading state
function showLoading() {
    const errorState = document.getElementById('error-state');
    if (errorState) errorState.classList.add('hidden');
    // Show a clean in-page skeleton loader instead of a full-screen overlay
    const inPageLoader = document.getElementById('loading-state');
    if (inPageLoader) {
        inPageLoader.classList.remove('hidden');
        inPageLoader.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center gap-3 text-charcoal/70">
                    <svg width="28" height="28" viewBox="0 0 50 50" aria-hidden="true">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#D4AF37" stroke-width="4" stroke-linecap="round" stroke-dasharray="31.4 188.4">
                            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                    <span class="text-sm">Loading product…</span>
                </div>
                <div class="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="space-y-4">
                        <div class="aspect-square rounded-lg bg-charcoal/5"></div>
                        <div class="grid grid-cols-4 gap-2">
                            <div class="h-20 bg-charcoal/5 rounded"></div>
                            <div class="h-20 bg-charcoal/5 rounded"></div>
                            <div class="h-20 bg-charcoal/5 rounded"></div>
                            <div class="h-20 bg-charcoal/5 rounded"></div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="h-8 bg-charcoal/10 rounded w-3/4"></div>
                        <div class="h-4 bg-charcoal/10 rounded w-full"></div>
                        <div class="h-4 bg-charcoal/10 rounded w-5/6"></div>
                        <div class="h-10 bg-charcoal/10 rounded w-1/2"></div>
                        <div class="h-10 bg-charcoal/10 rounded w-2/3"></div>
                        <div class="h-12 bg-charcoal/10 rounded w-full"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Hide loading state
function hideLoading() {
    const overlay = document.getElementById('product-loader-overlay');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.classList.add('hidden');
        loadingState.innerHTML = '';
    }
}

// Wait until the first significant content is ready (main image loaded or a short fallback)
function waitForFirstContentReady(timeoutMs = 5000) {
    return new Promise(resolve => {
        const settle = () => requestAnimationFrame(() => resolve());
        const img = document.getElementById('main-product-image');
        let finished = false;
        const finish = () => {
            if (finished) return; finished = true; settle();
        };
        if (img) {
            if (img.complete) {
                finish();
            } else {
                img.addEventListener('load', finish, { once: true });
                img.addEventListener('error', finish, { once: true });
                setTimeout(finish, timeoutMs);
            }
        } else {
            setTimeout(finish, 300); // No image found; brief delay then continue
        }
    });
}

// Wait for images to load or show fallbacks
async function waitForImagesOrFallbacks(timeout = 3000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkImages = () => {
            const mainImage = document.getElementById('main-product-image');
            const imageGallery = document.getElementById('image-gallery');
            
            if (mainImage && imageGallery) {
                // Check if main image has loaded or if fallbacks are set
                if (mainImage.src && mainImage.src !== '' && 
                    (mainImage.src.includes('placeholder') || mainImage.complete)) {
                    console.log('✅ Images ready or fallbacks set, resolving');
                    resolve();
                    return;
                }
            }
            
            if (Date.now() - startTime > timeout) {
                console.log('⏰ Image timeout reached, resolving anyway');
                resolve();
                return;
            }
            
            setTimeout(checkImages, 100);
        };
        
        checkImages();
    });
}

// Load product from API with caching
async function loadProductFromAPI(productIdentifier, identifierType = 'id') {
    try {
        console.log('📡 Loading product from API:', productIdentifier, 'Type:', identifierType);
        
        // Check cache first
        const cachedProduct = productCache.get(productIdentifier);
        if (cachedProduct && (Date.now() - cachedProduct.timestamp) < PRODUCT_CACHE_DURATION) {
            console.log('📦 Using cached product data');
            currentProduct = cachedProduct.data;
            return;
        }
        
        // Build API URL based on identifier type
        console.log('🌐 Loading product with ID:', productIdentifier, 'Type:', identifierType);
        
        // Use the correct API call method - pass just the ID, not the full URL
        let response;
        if (identifierType === 'slug') {
            // For slugs, we need to use the products endpoint with slug parameter
            response = await api.request(`/products?slug=${encodeURIComponent(productIdentifier)}`);
        } else {
            // For IDs, use the standard getProduct method
            response = await api.getProduct(productIdentifier);
        }
        console.log('📦 API Response:', response);
        
        if (!response || !response.product) {
            console.error('❌ Invalid API response:', response);
            throw new Error('Invalid API response');
        }
        
        currentProduct = response.product;
        console.log('📦 Current product data:', currentProduct);
        console.log('📝 Product description from API:', currentProduct.description);
        console.log('📝 Product reviews from API:', currentProduct.reviews);
        console.log('📝 Product numOfReviews from API:', currentProduct.numOfReviews);
        console.log('📝 Product ratings from API:', currentProduct.ratings);
        
        // Cache the product
        productCache.set(productIdentifier, {
            data: currentProduct,
            timestamp: Date.now()
        });
        
        console.log('✅ Product loaded from API:', currentProduct.name);
        console.log('📋 Product details:', {
            id: currentProduct._id,
            name: currentProduct.name,
            price: currentProduct.price,
            images: currentProduct.images?.length || 0,
            colorVariants: currentProduct.colorVariants?.length || 0
        });
    } catch (error) {
        console.error('❌ Failed to load product from API:', error);
        
        // Enhanced error handling for HTML responses
        if (error.message && error.message.includes('HTML')) {
            console.warn('⚠️ Server returned HTML instead of JSON - possible CDN/redirect issue');
            
            // Try alternative API call method
            try {
                console.log('🔄 Attempting alternative API call...');
                const alternativeResponse = await fetch(`https://www.laiq.shop/api/products/${productIdentifier}?_t=${Date.now()}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (alternativeResponse.ok) {
                    const responseText = await alternativeResponse.text();
                    if (responseText && !responseText.trim().startsWith('<!DOCTYPE')) {
                        const data = JSON.parse(responseText);
                        if (data && data.product) {
                            currentProduct = data.product;
                            console.log('✅ Product loaded via alternative API call:', currentProduct.name);
                            return;
                        }
                    }
                }
            } catch (altError) {
                console.error('❌ Alternative API call also failed:', altError);
            }
        }
        
        // Try cached data as fallback
        const cachedProduct = productCache.get(productIdentifier);
        if (cachedProduct) {
            console.log('⚠️ Using cached product data as fallback');
            currentProduct = cachedProduct.data;
            return;
        }
        
        // Final fallback to local data
        console.log('⚠️ Using local data as final fallback');
        const localProducts = PRODUCTS || [];
        
        // Try to find product by slug or ID
        if (identifierType === 'slug') {
            currentProduct = localProducts.find(p => p.slug === productIdentifier);
        } else {
            currentProduct = localProducts.find(p => p.id == productIdentifier);
        }
        
        // If not found, show product not found page
        if (!currentProduct) {
            console.warn('⚠️ Product not found in local data');
            showProductNotFound();
            return;
        }
        
        console.log('✅ Product loaded from local data:', currentProduct.name);
    }
}

// Render product detail
function renderProductDetail() {
    if (!currentProduct) {
        console.error('❌ No current product to render');
        showError('Product not found');
        return;
    }
    
    console.log('🎨 Rendering product details for:', currentProduct.name);
    
    // Show product details section
    let productDetails = document.getElementById('product-details');
    console.log('🔍 Looking for product-details element...');
    console.log('🔍 Document ready state:', document.readyState);
    
    // If element not found, try to create it
    if (!productDetails) {
        console.log('⚠️ Product details element not found, trying to create it...');
        const productContent = document.getElementById('product-content');
        if (!productContent) {
            console.error('❌ Product content element not found - cannot create product details');
            return;
        }
        
        productDetails = document.createElement('div');
        productDetails.id = 'product-details';
        productDetails.className = 'grid grid-cols-1 lg:grid-cols-2 gap-12';
            productDetails.innerHTML = `
                <!-- Product Images -->
                <div class="space-y-4">
                    <!-- Main Image -->
                    <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img id="main-product-image" src="" alt="" class="w-full h-full object-cover">
                    </div>
                    
                    <!-- Image Gallery -->
                    <div id="image-gallery" class="grid grid-cols-4 gap-2">
                        <!-- Thumbnail images will be loaded here -->
                    </div>
                </div>
                
                <!-- Product Info -->
                <div class="space-y-6">
                    <div>
                        <h1 id="product-name" class="text-3xl font-bold font-montserrat mb-2"></h1>
                        <p id="product-description" class="text-charcoal/70 text-lg"></p>
                    </div>
                    
                    <!-- Price -->
                    <div class="flex items-center gap-4">
                        <span id="product-price" class="text-3xl font-bold text-gold"></span>
                        <span id="product-original-price" class="text-xl text-charcoal/40 line-through hidden"></span>
                        <span id="product-discount" class="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold hidden"></span>
                    </div>
                    
                    <!-- Color Selection -->
                    <div id="color-selection" class="space-y-3">
                        <h3 class="text-lg font-semibold">Select Color</h3>
                        <div id="color-options" class="flex flex-wrap gap-3">
                            <!-- Color options will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Stock Status -->
                    <div id="stock-status" class="flex items-center gap-2">
                        <div id="stock-indicator" class="w-3 h-3 rounded-full"></div>
                        <span id="stock-text" class="text-sm font-medium"></span>
                    </div>
                    
                    <!-- Add to Cart Section -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-4">
                            <div class="flex items-center border border-gray-300 rounded-lg">
                                <button id="decrease-quantity" class="px-4 py-2 text-charcoal hover:text-gold transition-colors">-</button>
                                <input type="number" id="quantity" value="1" min="1" class="w-16 text-center border-none focus:ring-0">
                                <button id="increase-quantity" class="px-4 py-2 text-charcoal hover:text-gold transition-colors">+</button>
                            </div>
                            <button id="add-to-cart-btn" class="flex-1 bg-gold text-white py-3 px-6 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                                Add to Cart
                            </button>
                            <button id="add-to-wishlist-btn" class="wishlist-btn border border-charcoal/20 text-charcoal/60 p-3 rounded-lg hover:border-gold hover:text-gold transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Product Specifications -->
                    <div id="product-specifications" class="space-y-4">
                        <h3 class="text-lg font-semibold">Specifications</h3>
                        <div id="specs-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <!-- Specifications will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Features -->
                    <div id="product-features" class="space-y-3">
                        <h3 class="text-lg font-semibold">Features</h3>
                        <ul id="features-list" class="space-y-2 text-sm">
                            <!-- Features will be loaded here -->
                        </ul>
                    </div>
                </div>
            `;
            productContent.appendChild(productDetails);
            console.log('✅ Product details element created');
        }
    
    if (productDetails) {
        console.log('✅ Product details element found:', productDetails);
        productDetails.classList.remove('hidden');
        console.log('✅ Product details section shown');
        
        // Debug info removed - no need to show technical details to users
        
    } else {
        console.error('❌ Product details section not found and could not be created');
        console.error('❌ Available elements:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    const product = currentProduct;
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('product-name-breadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = product.name;
        console.log('✅ Breadcrumb updated');
    }
    
    // Fill basic product information
    fillProductInfo(product);
    
    // Fill product images
    fillProductImages(product);
    
    // Fill color selection
    fillColorSelection(product);
    
    // Fill specifications
    fillSpecifications(product);
    
    // Fill features
    fillFeatures(product);
    
    // Fill reviews section
    fillReviewsSection(product);
    
    // Add event listeners
    addProductEventListeners();
    
    // Update SEO meta tags and structured data
    updateProductSEO(product);
    
    console.log('✅ Product details rendering completed');
    
    // Update wishlist button state
    updateWishlistButton();
} // End of renderProductDetail function

// Fill basic product information
function fillProductInfo(product) {
    console.log('📝 Filling product info for:', product.name);
    
    // Product name and description
    const productName = document.getElementById('product-name');
    const productDescription = document.getElementById('product-description');
    
    if (productName) {
        productName.textContent = product.name;
        console.log('✅ Product name filled:', product.name);
    } else {
        console.error('❌ Product name element not found');
    }
    
    if (productDescription) {
        console.log('🔍 Product description value:', product.description);
        console.log('🔍 Product description type:', typeof product.description);
        console.log('🔍 Full product object:', product);
        
        // Handle different possible description fields
        let description = product.description || product.desc || product.productDescription || 'No description available';
        
        // If description is still undefined, try to get it from local data
        if (!description || description === 'undefined') {
            console.log('⚠️ Description not found in API response, trying local data...');
            const localProduct = PRODUCTS.find(p => p.id === product._id || p.id === product.id);
            if (localProduct) {
                description = localProduct.description;
                console.log('✅ Found description in local data:', description);
            }
        }
        
        productDescription.textContent = description;
        console.log('✅ Product description filled with:', description);
    } else {
        console.error('❌ Product description element not found');
    }
    
    // Price information
    const productPrice = document.getElementById('product-price');
    const productOriginalPrice = document.getElementById('product-original-price');
    const productDiscount = document.getElementById('product-discount');
    
    if (productPrice) {
        console.log('🔍 Discount check:', { 
            discount: product.discount, 
            isDiscountActive: product.isDiscountActive,
            discountInfo: product.discountInfo,
            shouldShowDiscount: product.discountInfo && product.discountInfo.status === 'active'
        });
        
        // Use discountInfo if available, otherwise fallback to manual calculation
        let finalPrice = product.price;
        if (product.discountInfo && product.discountInfo.status === 'active') {
            finalPrice = product.discountInfo.discountPrice;
        } else if (product.discount > 0) {
            // Fallback: check discount manually with real-time validation
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
                finalPrice = product.price * (1 - product.discount / 100);
            }
        }
        
        productPrice.textContent = `₹${finalPrice.toLocaleString()}`;
        console.log('✅ Product price filled:', `₹${finalPrice.toLocaleString()}`);
    } else {
        console.error('❌ Product price element not found');
    }
    
    // Check if discount should be shown using discountInfo
    let shouldShowDiscount = false;
    if (product.discountInfo && product.discountInfo.status === 'active') {
        shouldShowDiscount = true;
    } else if (product.discount > 0) {
        // Fallback: check discount manually with real-time validation
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
        
        shouldShowDiscount = isActive;
    }
    
    if (productOriginalPrice && shouldShowDiscount) {
        productOriginalPrice.textContent = `₹${product.price.toLocaleString()}`;
        productOriginalPrice.classList.remove('hidden');
        console.log('✅ Original price shown');
    } else if (productOriginalPrice) {
        productOriginalPrice.classList.add('hidden');
        console.log('✅ Original price hidden (no active discount)');
    }
    
    if (productDiscount && shouldShowDiscount) {
        productDiscount.textContent = `${product.discount}% OFF`;
        productDiscount.classList.remove('hidden');
        console.log('✅ Discount badge shown');
    } else if (productDiscount) {
        productDiscount.classList.add('hidden');
        console.log('✅ Discount badge hidden (no active discount)');
    }
    
    // Stock status
    updateStockStatus(product);
    
    console.log('✅ Product info filling completed');
}

// Fill product images
function fillProductImages(product) {
    console.log('🖼️ Filling product images for:', product.name);
    
    const mainImage = document.getElementById('main-product-image');
    const imageGallery = document.getElementById('image-gallery');
    
    if (!mainImage) {
        console.error('❌ Main product image element not found');
        return;
    }
    
    if (!imageGallery) {
        console.error('❌ Image gallery element not found');
        return;
    }
    
    const images = product.images || [];
    console.log('📸 Found', images.length, 'images');
    
    // If no images, use placeholder
    if (images.length === 0) {
        console.warn('⚠️ No images found for product, using placeholder');
        setFallbackImages(mainImage, imageGallery, product.name);
        return;
    }
    
    const primaryImage = images.find(img => img.isPrimary) || images[0];
    
    if (primaryImage && primaryImage.url) {
        mainImage.src = primaryImage.url;
        mainImage.alt = primaryImage.alt || product.name;
        console.log('✅ Main image set:', primaryImage.url);
        
        // Add error handling for main image
        mainImage.onerror = function() {
            console.warn('⚠️ Main image failed to load, using fallback');
            this.src = '/assets/placeholder-bag-1.jpg';
            this.alt = `${product.name} - Image not available`;
        };
    } else {
        console.warn('⚠️ Primary image has no URL, using fallback');
        setFallbackImages(mainImage, imageGallery, product.name);
        return;
    }
    
    // Create image gallery
    imageGallery.innerHTML = '';
    images.forEach((image, index) => {
        if (!image.url) {
            console.warn(`⚠️ Image ${index + 1} has no URL, skipping`);
            return;
        }
        
        const thumbnail = document.createElement('div');
        thumbnail.className = 'aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 hover:border-gold transition-colors';
        thumbnail.innerHTML = `
            <img src="${image.url}" alt="${image.alt || `Product Image ${index + 1}`}" 
                 class="w-full h-full object-cover"
                 onerror="this.src='/assets/placeholder-bag-1.jpg'; this.alt='Image not available';">
        `;
        
        thumbnail.addEventListener('click', () => {
            mainImage.src = image.url;
            mainImage.alt = image.alt || `Product Image ${index + 1}`;
            
            // Update active thumbnail
            imageGallery.querySelectorAll('div').forEach(thumb => {
                thumb.classList.remove('border-gold');
                thumb.classList.add('border-transparent');
            });
            thumbnail.classList.remove('border-transparent');
            thumbnail.classList.add('border-gold');
        });
        
        // Set first image as active
        if (index === 0) {
            thumbnail.classList.remove('border-transparent');
            thumbnail.classList.add('border-gold');
        }
        
        imageGallery.appendChild(thumbnail);
    });
    
    console.log('✅ Image gallery created with', images.length, 'thumbnails');
}

// Set fallback images when product has no images or images fail to load
function setFallbackImages(mainImage, imageGallery, productName) {
    console.log('🖼️ Setting fallback images for:', productName);
    
    // Set main image to placeholder
    mainImage.src = '/assets/placeholder-bag-1.jpg';
    mainImage.alt = `${productName} - Image not available`;
    
    // Create gallery with placeholder images
    imageGallery.innerHTML = '';
    
    // Add 2-3 placeholder images to gallery
    const placeholderImages = [
        '/assets/placeholder-bag-1.jpg',
        '/assets/placeholder-bag-2.jpg',
        '/assets/placeholder-bag-3.jpg'
    ];
    
    placeholderImages.forEach((placeholder, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 hover:border-gold transition-colors';
        thumbnail.innerHTML = `
            <img src="${placeholder}" alt="Placeholder Image ${index + 1}" 
                 class="w-full h-full object-cover">
        `;
        
        thumbnail.addEventListener('click', () => {
            mainImage.src = placeholder;
            mainImage.alt = `Placeholder Image ${index + 1}`;
            
            // Update active thumbnail
            imageGallery.querySelectorAll('div').forEach(thumb => {
                thumb.classList.remove('border-gold');
                thumb.classList.add('border-transparent');
            });
            thumbnail.classList.remove('border-transparent');
            thumbnail.classList.add('border-gold');
        });
        
        // Set first image as active
        if (index === 0) {
            thumbnail.classList.remove('border-transparent');
            thumbnail.classList.add('border-gold');
        }
        
        imageGallery.appendChild(thumbnail);
    });
    
    console.log('✅ Fallback images set');
}

// Fill color selection
function fillColorSelection(product) {
    const colorOptions = document.getElementById('color-options');
    const colorSelection = document.getElementById('color-selection');
    
    if (!colorOptions) return;
    
    const colorVariants = product.colorVariants || [];
    const colors = product.colors || [];
    
    colorOptions.innerHTML = '';
    
    // Hide color selection if no colors available
    if (colorSelection && colorVariants.length === 0 && colors.length === 0) {
        colorSelection.classList.add('hidden');
        return;
    }
    
    // If only one color variant, auto-select it and hide selection
    if (colorVariants.length === 1) {
        const singleColor = colorVariants[0];
        if (singleColor.isAvailable && singleColor.stock > 0) {
            currentProduct.selectedColor = singleColor;
            console.log('🎨 Auto-selected single color variant:', singleColor.name);
            
            // Hide color selection section for single color
            if (colorSelection) {
                colorSelection.classList.add('hidden');
            }
            
            // Update stock status
            updateStockStatus(product, singleColor);
            
            // Update product image for the selected color
            updateProductImageForColor(singleColor);
            
            return;
        }
    }
    
    // Show color selection for multiple colors
    if (colorSelection) {
        colorSelection.classList.remove('hidden');
    }
    
    if (colorVariants.length > 0) {
        // Use new color variants system with enhanced styling
        colorVariants.forEach((variant, index) => {
            if (variant.isAvailable && variant.stock > 0) {
                const colorOption = document.createElement('button');
                colorOption.className = 'color-option p-4 rounded-xl border-2 border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 transform hover:scale-105';
                colorOption.setAttribute('data-color', variant.name);
                colorOption.setAttribute('data-stock', variant.stock);
                colorOption.innerHTML = `
                    <div class="flex flex-col items-center gap-3">
                        <div class="relative">
                            <div class="w-12 h-12 rounded-full border-2 border-gray-300 shadow-md" 
                                 style="background-color: ${variant.code}"></div>
                            <div class="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full opacity-0 transition-opacity duration-300 color-check">
                                <svg class="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                        </div>
                        <div class="text-center">
                            <span class="text-sm font-semibold text-charcoal">${variant.name}</span>
                            <div class="text-xs text-gray-500 mt-1">${variant.stock} left</div>
                        </div>
                    </div>
                `;
                
                colorOption.addEventListener('click', () => selectColor(variant));
                colorOptions.appendChild(colorOption);
            }
        });
    } else if (colors.length > 0) {
        // If only one legacy color, auto-select it
        if (colors.length === 1) {
            const singleColor = colors[0];
            currentProduct.selectedColor = { name: singleColor, stock: product.stock };
            console.log('🎨 Auto-selected single legacy color:', singleColor);
            
            // Hide color selection section for single color
            if (colorSelection) {
                colorSelection.classList.add('hidden');
            }
            
            // Update stock status
            updateStockStatus(product, currentProduct.selectedColor);
            
            // Update product image for the selected color (using legacy color object)
            updateProductImageForColor({ name: singleColor, stock: product.stock });
            
            return;
        }
        
        // Show color selection for multiple legacy colors
        if (colorSelection) {
            colorSelection.classList.remove('hidden');
        }
        
        // Fallback to legacy colors system with enhanced styling
        colors.forEach((color, index) => {
            const colorOption = document.createElement('button');
            colorOption.className = 'color-option p-4 rounded-xl border-2 border-gray-200 hover:border-gold hover:shadow-lg transition-all duration-300 transform hover:scale-105';
            colorOption.setAttribute('data-color', color);
            colorOption.innerHTML = `
                <div class="flex flex-col items-center gap-3">
                    <div class="relative">
                        <div class="w-12 h-12 rounded-full border-2 border-gray-300 shadow-md bg-gray-800"></div>
                        <div class="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full opacity-0 transition-opacity duration-300 color-check">
                            <svg class="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="text-center">
                        <span class="text-sm font-semibold text-charcoal">${color}</span>
                    </div>
                </div>
            `;
            
            colorOption.addEventListener('click', () => selectColor({ name: color, stock: product.stock }));
            colorOptions.appendChild(colorOption);
        });
    }
    
    // Hide color selection if no colors available after processing
    if (colorSelection && colorOptions.children.length === 0) {
        colorSelection.classList.add('hidden');
    }
}

// Select color with enhanced visual feedback and image update
function selectColor(colorVariant) {
    console.log('🎨 Color selected:', colorVariant);
    console.log('📦 Current product before selection:', currentProduct);
    
    // Update active color with enhanced styling
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('border-gold', 'bg-gold/5', 'shadow-lg', 'scale-105');
        option.classList.add('border-gray-200');
        
        // Hide all check marks
        const checkMark = option.querySelector('.color-check');
        if (checkMark) {
            checkMark.classList.remove('opacity-100');
            checkMark.classList.add('opacity-0');
        }
    });
    
    const selectedOption = document.querySelector(`[data-color="${colorVariant.name}"]`);
    if (selectedOption) {
        selectedOption.classList.remove('border-gray-200');
        selectedOption.classList.add('border-gold', 'bg-gold/5', 'shadow-lg', 'scale-105');
        
        // Show check mark for selected color
        const checkMark = selectedOption.querySelector('.color-check');
        if (checkMark) {
            checkMark.classList.remove('opacity-0');
            checkMark.classList.add('opacity-100');
        }
    }
    
    // Update stock status
    updateStockStatus(currentProduct, colorVariant);
    
    // Store selected color
    currentProduct.selectedColor = colorVariant;
    
    console.log('✅ Color stored in currentProduct:', currentProduct.selectedColor);
    
    // Update product image if color variant has specific images
    updateProductImageForColor(colorVariant);
    
    // Show success feedback
    showToast(`Selected ${colorVariant.name} color!`, 'success');
}

// Update product image based on selected color
function updateProductImageForColor(colorVariant) {
    console.log('🎨 Updating product image for color:', colorVariant);
    
    const mainImage = document.getElementById('main-product-image');
    if (!mainImage) {
        console.log('❌ Main image element not found');
        return;
    }
    
    // Check if color variant has specific images
    if (colorVariant.images && colorVariant.images.length > 0) {
        console.log('🎨 Color variant has specific images:', colorVariant.images);
        
        // Use the first image from the color variant
        const newImageUrl = colorVariant.images[0].url;
        
        // Add fade transition
        mainImage.style.opacity = '0';
        mainImage.style.transition = 'opacity 0.3s ease-in-out';
        
        setTimeout(() => {
            mainImage.src = newImageUrl;
            mainImage.alt = `${currentProduct.name} - ${colorVariant.name}`;
            mainImage.style.opacity = '1';
            console.log('✅ Main image updated to:', newImageUrl);
        }, 150);
        
        // Update thumbnail images if they exist
        updateThumbnailImages(colorVariant.images);
    } else {
        console.log('ℹ️ No specific images for this color, using default product images');
        
        // If no color-specific images, use the main product images
        // but we can still update the alt text to reflect the color
        mainImage.alt = `${currentProduct.name} - ${colorVariant.name}`;
        
        // Update thumbnails with main product images
        if (currentProduct.images && currentProduct.images.length > 0) {
            updateThumbnailImages(currentProduct.images);
        }
    }
}

// Update thumbnail images for selected color
function updateThumbnailImages(colorImages) {
    const thumbnailContainer = document.querySelector('.product-thumbnails');
    if (!thumbnailContainer) return;
    
    // Clear existing thumbnails
    thumbnailContainer.innerHTML = '';
    
    // Add new thumbnails for the selected color
    colorImages.forEach((image, index) => {
        const thumbnail = document.createElement('button');
        thumbnail.className = 'thumbnail-btn w-20 h-20 rounded-lg border-2 border-gray-200 hover:border-gold transition-colors overflow-hidden';
        thumbnail.innerHTML = `
            <img src="${image.url}" alt="${image.alt || 'Product thumbnail'}" 
                 class="w-full h-full object-cover">
        `;
        
        // Add click handler to update main image
        thumbnail.addEventListener('click', () => {
            const mainImage = document.querySelector('.product-main-image');
            if (mainImage) {
                mainImage.style.opacity = '0';
                setTimeout(() => {
                    mainImage.src = image.url;
                    mainImage.alt = image.alt || 'Product image';
                    mainImage.style.opacity = '1';
                }, 150);
            }
            
            // Update active thumbnail
            document.querySelectorAll('.thumbnail-btn').forEach(btn => {
                btn.classList.remove('border-gold');
                btn.classList.add('border-gray-200');
            });
            thumbnail.classList.remove('border-gray-200');
            thumbnail.classList.add('border-gold');
        });
        
        thumbnailContainer.appendChild(thumbnail);
        
        // Set first thumbnail as active
        if (index === 0) {
            thumbnail.classList.remove('border-gray-200');
            thumbnail.classList.add('border-gold');
        }
    });
}

// Update stock status
function updateStockStatus(product, selectedColor = null) {
    const stockIndicator = document.getElementById('stock-indicator');
    const stockText = document.getElementById('stock-text');
    
    if (!stockIndicator || !stockText) return;
    
    let stock = 0;
    let isInStock = false;
    
    if (selectedColor) {
        stock = selectedColor.stock;
        isInStock = stock > 0;
    } else if (product.colorVariants && product.colorVariants.length > 0) {
        stock = product.colorVariants.reduce((total, variant) => total + variant.stock, 0);
        isInStock = stock > 0;
    } else {
        stock = product.stock || 0;
        isInStock = stock > 0;
    }
    
    if (isInStock) {
        stockIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
        stockText.textContent = `${stock} in stock`;
        stockText.className = 'text-sm font-medium text-green-600';
    } else {
        stockIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
        stockText.textContent = 'Out of stock';
        stockText.className = 'text-sm font-medium text-red-600';
    }
}

// Fill specifications
function fillSpecifications(product) {
    const specsList = document.getElementById('specs-list');
    if (!specsList || !product.specifications) return;
    
    const specs = product.specifications;
    specsList.innerHTML = '';
    
    const specItems = [
        { label: 'Dimensions', value: specs.dimensions?.display || 'N/A' },
        { label: 'Weight', value: specs.weight || 'N/A' },
        { label: 'Capacity', value: specs.capacity || 'N/A' },
        { label: 'Material', value: product.material || 'N/A' },
        { label: 'Closure', value: specs.closure || 'N/A' },
        { label: 'Pockets', value: specs.pockets || 'N/A' },
        { label: 'Care', value: specs.care || 'N/A' },
        { label: 'Warranty', value: specs.warranty || 'N/A' }
    ];
    
    specItems.forEach(item => {
        if (item.value !== 'N/A') {
            const specItem = document.createElement('div');
            specItem.className = 'flex justify-between py-2 border-b border-gray-100';
            specItem.innerHTML = `
                <span class="font-medium text-gray-600">${item.label}</span>
                <span class="text-gray-800">${item.value}</span>
            `;
            specsList.appendChild(specItem);
        }
    });
    
    // Hide specifications if no specs available
    const productSpecifications = document.getElementById('product-specifications');
    if (productSpecifications && specsList.children.length === 0) {
        productSpecifications.classList.add('hidden');
    }
}

// Fill features
function fillFeatures(product) {
    const featuresList = document.getElementById('features-list');
    if (!featuresList || !product.specifications?.features) return;
    
    featuresList.innerHTML = '';
    
    product.specifications.features.forEach(feature => {
        const featureItem = document.createElement('li');
        featureItem.className = 'flex items-center gap-2';
        featureItem.innerHTML = `
            <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>${feature}</span>
        `;
        featuresList.appendChild(featureItem);
    });
    
    // Hide features if no features available
    const productFeatures = document.getElementById('product-features');
    if (productFeatures && featuresList.children.length === 0) {
        productFeatures.classList.add('hidden');
    }
}

// Fill reviews section
function fillReviewsSection(product) {
    console.log('📝 Filling reviews section for:', product.name);
    console.log('🔍 Product reviews:', product.reviews);
    console.log('🔍 Product numOfReviews:', product.numOfReviews);
    console.log('🔍 Product ratings:', product.ratings);
    
    const reviewsSection = document.getElementById('reviews-section');
    if (!reviewsSection) {
        console.error('❌ Reviews section not found');
        return;
    }
    
    const reviews = product.reviews || [];
    const numOfReviews = product.numOfReviews || reviews.length;
    const averageRating = product.ratings || 0;
    
    console.log('📊 Reviews data:', { reviews, numOfReviews, averageRating });
    
    // Generate the complete reviews section HTML
    let reviewsHTML = '';
    
    // Review Stats Section
    reviewsHTML += `
        <div class="flex items-center gap-8 mb-8">
            <div class="flex items-center gap-2">
                <div class="flex text-gold">
                    ${generateStars(averageRating)}
                </div>
                <span class="text-lg font-semibold">${averageRating.toFixed(1)}</span>
            </div>
            <div class="text-charcoal/60">
                <span>${numOfReviews}</span> reviews
            </div>
        </div>
        
        <!-- Write Review Button -->
        <div class="mb-8">
            <button id="write-review-btn" class="bg-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                Write a Review
            </button>
        </div>
    `;
    
    // Reviews Content
    if (numOfReviews === 0) {
        console.log('📝 No reviews found, showing empty state');
        reviewsHTML += `
            <div class="text-center py-8">
                <div class="text-charcoal/60 text-lg mb-4">No Reviews Yet</div>
                <p class="text-charcoal/40 mb-6">Be the first to review this product!</p>
                <button class="bg-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                    Write First Review
                </button>
            </div>
        `;
    } else {
        console.log('📝 Rendering', numOfReviews, 'reviews');
        reviewsHTML += `
            <div class="space-y-6" id="reviews-list">
                <div class="text-center py-4">
                    <div class="text-charcoal/60">Loading reviews...</div>
                </div>
            </div>
        `;
        
        // Load actual reviews from API
        loadProductReviews(product._id);
    }
    
    // Load More Reviews Button (hidden for now)
    reviewsHTML += `
        <div class="text-center mt-8">
            <button id="load-more-reviews" class="text-gold hover:text-charcoal transition-colors font-semibold hidden">
                Load More Reviews
            </button>
        </div>
    `;
    
    // Update the entire reviews section
    reviewsSection.innerHTML = reviewsHTML;
    
    // Re-attach event listeners for the write review button
    const writeReviewBtn = document.getElementById('write-review-btn');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', () => {
            if (typeof openReviewModal === 'function') {
                openReviewModal();
            } else {
                console.error('❌ openReviewModal function not found');
            }
        });
    }
    
    console.log('✅ Reviews section filled');
}

// Generate star rating HTML
function generateStars(rating) {
    try {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24"><defs><linearGradient id="half-star"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half-star)"/></svg>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<svg class="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
        
        return starsHTML;
    } catch (error) {
        console.error('❌ Error generating stars for rating:', rating, error);
        return '<svg class="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'.repeat(5);
    }
}

// Render reviews section
function renderReviewsSection() {
    const reviews = currentProduct.reviews || [];
    
    if (reviews.length === 0) {
        return `
            <div class="text-center py-8">
                <div class="text-charcoal/60 text-lg mb-4">No reviews yet</div>
                <p class="text-charcoal/40">Be the first to review this product!</p>
            </div>
        `;
    }
    
    return `
        <div class="space-y-6">
            ${reviews.map(review => `
                <div class="bg-beige/30 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-semibold">
                                ${review.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div class="font-semibold text-charcoal">${review.user?.name || 'Anonymous'}</div>
                                <div class="text-sm text-charcoal/60">${new Date(review.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="flex items-center">
                            ${generateStars(review.rating)}
                        </div>
                    </div>
                    <p class="text-charcoal/70">${review.comment}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// Load suggested products
async function loadSuggestedProducts() {
    try {
        const response = await api.getProducts({ 
            limit: 3,
            category: currentProduct.category 
        } + (query.includes('?') ? '&' : '?') + '_t=' + Date.now());
        
        const suggestedProducts = response.products
            .filter(p => (p._id || p.id) !== (currentProduct._id || currentProduct.id))
            .slice(0, 3);
        
        renderSuggestedProducts(suggestedProducts);
    } catch (error) {
        console.error('Failed to load suggested products:', error);
    }
}

// Render suggested products
function renderSuggestedProducts(products) {
    const container = document.getElementById('suggested-products');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-charcoal/60">No suggested products available</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <a href="product.html?id=${product._id || product.id}" class="block">
                <img src="${product.images?.[0]?.url || product.image}" alt="${product.name}" 
                     class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
            </a>
            <div class="p-4">
                <h3 class="font-semibold text-lg text-charcoal mb-2">${product.name}</h3>
                <div class="flex items-center gap-2 mb-2">
                    ${generateStars(product.ratings || product.rating || 0)}
                    <span class="text-sm text-charcoal/60">(${product.numOfReviews || 0})</span>
                </div>
                <div class="text-gold font-bold text-lg mb-3">₹${product.price.toLocaleString()}</div>
                <button class="w-full bg-gold text-white py-2 px-4 rounded-lg font-semibold hover:bg-charcoal transition-colors" 
                        onclick="window.location.href='product.html?id=${product._id || product.id}'">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Add product event listeners
function addProductEventListeners() {
    // Quantity controls
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('quantity');
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            const maxStock = getMaxStock();
            if (currentValue < maxStock) {
                quantityInput.value = currentValue + 1;
            }
        });
    }
    
    if (quantityInput) {
        quantityInput.addEventListener('change', () => {
            const value = parseInt(quantityInput.value) || 1;
            const maxStock = getMaxStock();
            if (value < 1) {
                quantityInput.value = 1;
            } else if (value > maxStock) {
                quantityInput.value = maxStock;
            }
        });
    }
    
    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
    
    // Add to wishlist button
    const addToWishlistBtn = document.getElementById('add-to-wishlist-btn');
    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', handleWishlistToggle);
        updateWishlistButton();
    }
    
    // Add share button event listener
    const shareProductBtn = document.getElementById('share-product-btn');
    if (shareProductBtn) {
        shareProductBtn.addEventListener('click', shareProduct);
    }
}

// Get maximum stock based on selected color
function getMaxStock() {
    if (currentProduct.selectedColor) {
        return currentProduct.selectedColor.stock;
    } else if (currentProduct.colorVariants && currentProduct.colorVariants.length > 0) {
        return currentProduct.colorVariants.reduce((total, variant) => total + variant.stock, 0);
    } else {
        return currentProduct.stock || 0;
    }
}

// Handle add to cart with enhanced UX
async function handleAddToCart(e) {
    e.preventDefault();
    
    console.log('🛒 Add to cart clicked');
    console.log('📦 Current product:', currentProduct);
    console.log('🎨 Color variants:', currentProduct?.colorVariants);
    console.log('🎨 Selected color:', currentProduct?.selectedColor);
    
    if (!currentProduct) {
        showToast('Product not found', 'error');
        return;
    }
    
    // Auto-select first color if only one color variant exists
    if (currentProduct.colorVariants && currentProduct.colorVariants.length === 1 && !currentProduct.selectedColor) {
        currentProduct.selectedColor = currentProduct.colorVariants[0];
        console.log('🎨 Auto-selected single color:', currentProduct.selectedColor.name);
    }
    
    // Check if color is selected (if multiple color variants exist)
    if (currentProduct.colorVariants && currentProduct.colorVariants.length > 1 && !currentProduct.selectedColor) {
        console.log('❌ No color selected for multi-color product');
        showToast('Please select a color', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
    const selectedColor = currentProduct.selectedColor;
    
    console.log('📊 Quantity:', quantity);
    console.log('🎨 Final selected color:', selectedColor);
    
    // Check stock
    const maxStock = getMaxStock();
    if (quantity > maxStock) {
        showToast(`Only ${maxStock} items available in stock`, 'error');
        return;
    }
    
    // Get add to cart button and show loading state
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const originalText = addToCartBtn?.textContent || 'Add to Cart';
    
    if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
        `;
    }
    
    try {
        // Get product image
        const productImage = currentProduct.images?.[0]?.url || currentProduct.image;
        
        // Prepare color object for cart
        const colorObject = selectedColor ? {
            name: selectedColor.name,
            code: selectedColor.code || '#000000'
        } : null;
        
        console.log('🛒 Calling addToCart with:', {
            productId: currentProduct._id || currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: productImage,
            color: colorObject
        });
        
        // Calculate final price with real-time discount validation
        let finalPrice = currentProduct.price;
        if (currentProduct.discount > 0) {
            const now = new Date();
            let isActive = true;
            
            // Check start date
            if (currentProduct.discountStartDate && now < new Date(currentProduct.discountStartDate)) {
                isActive = false;
            }
            // Check end date
            else if (currentProduct.discountEndDate && now > new Date(currentProduct.discountEndDate)) {
                isActive = false;
            }
            
            if (isActive) {
                finalPrice = currentProduct.price * (1 - currentProduct.discount / 100);
            }
        }
        
        console.log('💰 Product price calculation for cart:', {
            originalPrice: currentProduct.price,
            discount: currentProduct.discount,
            isDiscountActive: currentProduct.isDiscountActive,
            finalPrice: finalPrice
        });
        
        // Add to cart with color information (optimistic UI)
        await addToCart(
            currentProduct._id || currentProduct.id,
            currentProduct.name,
            finalPrice,
            productImage,
            colorObject
        );
        // Ensure counts and drawer reflect changes instantly
        updateCartCount();
        renderCartDrawer();
        
        console.log('✅ Add to cart completed successfully');
        
        // Show success animation
        if (addToCartBtn) {
            addToCartBtn.innerHTML = `
                <svg class="w-5 h-5 text-white inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Added!
            `;
            addToCartBtn.classList.add('bg-green-500');
        }
        
        // Create confetti effect
        createConfetti();
        
        showToast('Added to cart successfully! 🎉', 'success');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = originalText;
                addToCartBtn.classList.remove('bg-green-500');
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showToast('Failed to add to cart. Please try again.', 'error');
        
        // Reset button on error
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = originalText;
        }
    }
}

// Handle wishlist toggle
function handleWishlistToggle(e) {
    e.preventDefault();
    
    if (!currentProduct) {
        console.error('❌ No current product available');
        return;
    }
    
    const productId = currentProduct._id || currentProduct.id;
    
    if (isInWishlist(productId)) {
        removeFromWishlist(productId);
        showToast('Removed from wishlist', 'info');
    } else {
        // Calculate final price with real-time discount validation
        let finalPrice = currentProduct.price;
        if (currentProduct.discount > 0) {
            const now = new Date();
            let isActive = true;
            
            // Check start date
            if (currentProduct.discountStartDate && now < new Date(currentProduct.discountStartDate)) {
                isActive = false;
            }
            // Check end date
            else if (currentProduct.discountEndDate && now > new Date(currentProduct.discountEndDate)) {
                isActive = false;
            }
            
            if (isActive) {
                finalPrice = currentProduct.price * (1 - currentProduct.discount / 100);
            }
        }
        
        // Create product data with discounted price
        const productData = {
            name: currentProduct.name,
            price: finalPrice, // Use discounted price
            image: currentProduct.images?.[0]?.url || currentProduct.image,
            discount: currentProduct.discount,
            isDiscountActive: currentProduct.isDiscountActive,
            discountInfo: currentProduct.discountInfo
        };
        
        addToWishlist(productId, productData);
        showToast('Added to wishlist', 'success');
    }
    
    updateWishlistButton();
}

// Update wishlist button appearance
function updateWishlistButton() {
    const wishlistBtn = document.getElementById('add-to-wishlist-btn');
    if (!wishlistBtn || !currentProduct) return;
    
    const productId = currentProduct._id || currentProduct.id;
    const isWishlisted = isInWishlist(productId);
    
    if (isWishlisted) {
        wishlistBtn.classList.add('border-gold', 'text-gold');
        wishlistBtn.classList.remove('border-charcoal/20', 'text-charcoal/60');
        wishlistBtn.querySelector('svg').innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" fill="currentColor"></path>
        `;
    } else {
        wishlistBtn.classList.remove('border-gold', 'text-gold');
        wishlistBtn.classList.add('border-charcoal/20', 'text-charcoal/60');
        wishlistBtn.querySelector('svg').innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        `;
    }
}

// Share product functionality
function shareProduct() {
    if (!currentProduct) {
        showToast('Product not loaded yet', 'error');
        return;
    }
    
    const productId = currentProduct._id || currentProduct.id;
    const productUrl = `${window.location.origin}/product.html?id=${productId}`;
    const productName = currentProduct.name || 'Amazing Product';
    const productDescription = currentProduct.description || 'Check out this amazing product from Laiq Bags!';
    
    // Create share text
    const shareText = `Check out this amazing product: ${productName}\n\n${productDescription}\n\n${productUrl}\n\n#LaiqBags #Fashion #Bags`;
    
    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
        navigator.share({
            title: productName,
            text: productDescription,
            url: productUrl
        }).then(() => {
            showToast('Product shared successfully!', 'success');
        }).catch((error) => {
            // Check if it's a user cancellation (normal behavior)
            if (error.name === 'AbortError' || error.message.includes('cancel')) {
                console.log('✅ Share cancelled by user (normal behavior)');
                return; // Don't show fallback for user cancellation
            } else {
                console.log('⚠️ Share failed:', error);
                fallbackShare(productUrl, shareText);
            }
        });
    } else {
        // Fallback for desktop browsers
        fallbackShare(productUrl, shareText);
    }
}

// Fallback share method for desktop browsers
function fallbackShare(productUrl, shareText) {
    // Create a temporary textarea to copy the URL
    const textarea = document.createElement('textarea');
    textarea.value = productUrl;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Show success message with options
    showToast('Product URL copied to clipboard!', 'success');
    
    // Show additional share options
    setTimeout(() => {
        showShareOptions(productUrl, shareText);
    }, 1000);
}

// Show share options modal
function showShareOptions(productUrl, shareText) {
    // Remove existing modal if any
    const existingModal = document.getElementById('share-options-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'share-options-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Share Product</h3>
                <button onclick="this.closest('#share-options-modal').remove()" class="text-2xl hover:text-gold transition-colors">&times;</button>
            </div>
            <div class="space-y-3">
                <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(shareText)}', '_blank')" class="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Share on WhatsApp
                </button>
                <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}', '_blank')" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Share on Facebook
                </button>
                <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}', '_blank')" class="w-full bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Share on Twitter
                </button>
                <button onclick="copyToClipboard('${productUrl}')" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    Copy Link
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Copy to clipboard function
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    showToast('Link copied to clipboard!', 'success');
    
    // Close modal
    const modal = document.getElementById('share-options-modal');
    if (modal) {
        modal.remove();
    }
}

// Show error message
function showError(message) {
    const errorState = document.getElementById('error-state');
    const loadingState = document.getElementById('loading-state');
    const productContent = document.getElementById('product-content');
    
    if (errorState) {
        errorState.classList.remove('hidden');
        // Update error message
        const errorMessage = errorState.querySelector('h3');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }
    
    if (loadingState) loadingState.classList.add('hidden');
    if (productContent) productContent.innerHTML = '';
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

// Create confetti effect
function createConfetti() {
    const colors = ['#d4af37', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (document.body.contains(confetti)) {
                document.body.removeChild(confetti);
            }
        }, 5000);
    }
}

// Add confetti animation CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(confettiStyle); 

// Update SEO meta tags and structured data
function updateProductSEO(product) {
    console.log('🔍 Updating SEO for product:', product.name);
    
    // Update page title with better SEO structure
    const seoTitle = product.seoTitle || product.name;
    const priceText = product.price ? ` - ₹${product.price}` : '';
    const categoryText = product.category ? ` | ${product.category}` : '';
    document.title = `${seoTitle}${priceText}${categoryText} - Laiq Bags`;
    
    // Update meta description with product-specific content
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    
    const productDesc = product.metaDescription || product.description?.substring(0, 120) || `Buy ${product.name}`;
    const priceInfo = product.price ? ` at ₹${product.price}` : '';
    const stockInfo = product.stock > 0 ? '. Free shipping available.' : '. Check availability.';
    metaDescription.content = `${productDesc}${priceInfo} from Laiq Bags${stockInfo}`;
    
    // Update keywords with product-specific terms
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
    }
    
    const baseKeywords = 'bags, backpacks, handbags, premium bags, Laiq Bags';
    const productKeywords = product.category ? `, ${product.category}` : '';
    const brandKeywords = ', LAIQ brand, fashion accessories';
    metaKeywords.content = `${baseKeywords}${productKeywords}${brandKeywords}`;
    
    // Update Open Graph tags
    updateOpenGraphTags(product);
    
    // Update Twitter Card tags
    updateTwitterCardTags(product);
    
    // Update canonical URL
    updateCanonicalURL(product);
    
    // Add product structured data
    addProductStructuredData(product);
    
    console.log('✅ SEO updated for product:', product.name);
}

// Update Open Graph tags
function updateOpenGraphTags(product) {
    const ogTags = {
        'og:title': `${product.seoTitle || product.name} - Laiq Bags`,
        'og:description': product.metaDescription || product.description?.substring(0, 160) || `Buy ${product.name} from Laiq Bags. Premium quality bags and accessories.`,
        'og:type': 'product',
        'og:url': `${window.location.origin}/product.html?id=${product._id}`,
        'og:image': product.images?.[0]?.url || 'https://www.laiq.shop/assets/laiq-logo.png',
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:alt': `${product.name} - Laiq Bags`,
        'og:site_name': 'Laiq Bags',
        'og:locale': 'en_US',
        'product:price:amount': product.price,
        'product:price:currency': 'INR',
        'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        'product:retailer_item_id': product._id,
        'product:brand': 'LAIQ'
    };
    
    Object.entries(ogTags).forEach(([property, content]) => {
        if (content) {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.content = content;
        }
    });
}

// Update Twitter Card tags
function updateTwitterCardTags(product) {
    const twitterTags = {
        'twitter:card': 'summary_large_image',
        'twitter:title': `${product.seoTitle || product.name} - Laiq Bags`,
        'twitter:description': product.metaDescription || product.description?.substring(0, 160) || `Buy ${product.name} from Laiq Bags. Premium quality bags and accessories.`,
        'twitter:image': product.images?.[0]?.url || 'https://www.laiq.shop/assets/laiq-logo.png',
        'twitter:image:alt': `${product.name} - Laiq Bags`,
        'twitter:site': '@laiq_bags_',
        'twitter:creator': '@laiq_bags_',
        'twitter:label1': 'Price',
        'twitter:data1': `₹${product.price}`,
        'twitter:label2': 'Availability',
        'twitter:data2': product.stock > 0 ? 'In Stock' : 'Out of Stock'
    };
    
    Object.entries(twitterTags).forEach(([name, content]) => {
        if (content) {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.content = content;
        }
    });
}

// Update canonical URL
function updateCanonicalURL(product) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/product.html?id=${product._id}`;
    
    // Update hreflang URLs
    updateHreflangURLs(product);
    
    // Update breadcrumb URLs
    updateBreadcrumbURLs(product);
}

// Update hreflang URLs
function updateHreflangURLs(product) {
    const productURL = `${window.location.origin}/product.html?id=${product._id}`;
    
    // Update en hreflang
    let enHreflang = document.querySelector('link[hreflang="en"]');
    if (enHreflang) {
        enHreflang.href = productURL;
    }
    
    // Update en-IN hreflang
    let enINHreflang = document.querySelector('link[hreflang="en-IN"]');
    if (enINHreflang) {
        enINHreflang.href = productURL;
    }
    
    // Update x-default hreflang
    let xDefaultHreflang = document.querySelector('link[hreflang="x-default"]');
    if (xDefaultHreflang) {
        xDefaultHreflang.href = productURL;
    }
}

// Update breadcrumb URLs
function updateBreadcrumbURLs(product) {
    const productURL = `${window.location.origin}/product.html?id=${product._id}`;
    
    // Find and update breadcrumb structured data
    const breadcrumbScript = document.querySelector('script[type="application/ld+json"]');
    if (breadcrumbScript) {
        try {
            const breadcrumbData = JSON.parse(breadcrumbScript.textContent);
            if (breadcrumbData["@type"] === "BreadcrumbList" && breadcrumbData.itemListElement) {
                // Update the product breadcrumb item
                const productBreadcrumb = breadcrumbData.itemListElement.find(item => item.position === 3);
                if (productBreadcrumb) {
                    productBreadcrumb.name = product.name;
                    productBreadcrumb.item = productURL;
                }
                
                // Update the script content
                breadcrumbScript.textContent = JSON.stringify(breadcrumbData, null, 2);
            }
        } catch (e) {
            console.warn('Could not update breadcrumb structured data:', e);
        }
    }
}

// Add product structured data
function addProductStructuredData(product) {
    // Remove existing product structured data
    const existingScript = document.querySelector('script[data-product-schema]');
    if (existingScript) {
        existingScript.remove();
    }
    
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "brand": {
            "@type": "Brand",
            "name": "LAIQ"
        },
        "category": product.category,
        "image": product.images?.map(img => img.url) || [],
        "url": `${window.location.origin}/product.html?id=${product._id}`,
        "sku": product._id,
        "mpn": product._id,
        "gtin": product._id,
        "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "INR",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "seller": {
                "@type": "Organization",
                "name": "Laiq Bags",
                "url": "https://www.laiq.shop"
            },
            "deliveryLeadTime": {
                "@type": "QuantitativeValue",
                "value": "3",
                "unitCode": "DAY"
            },
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": "0",
                    "currency": "INR"
                },
                "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "handlingTime": {
                        "@type": "QuantitativeValue",
                        "value": "1",
                        "unitCode": "DAY"
                    },
                    "transitTime": {
                        "@type": "QuantitativeValue",
                        "value": "2",
                        "unitCode": "DAY"
                    }
                }
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "IN",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 30,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
            }
        }
    };
    
    // Add product specifications
    if (product.specifications) {
        structuredData.additionalProperty = [];
        
        if (product.specifications.dimensions) {
            structuredData.additionalProperty.push({
                "@type": "PropertyValue",
                "name": "Dimensions",
                "value": product.specifications.dimensions
            });
        }
        
        if (product.specifications.weight) {
            structuredData.additionalProperty.push({
                "@type": "PropertyValue",
                "name": "Weight",
                "value": product.specifications.weight
            });
        }
        
        if (product.specifications.material) {
            structuredData.additionalProperty.push({
                "@type": "PropertyValue",
                "name": "Material",
                "value": product.specifications.material
            });
        }
        
        if (product.specifications.capacity) {
            structuredData.additionalProperty.push({
                "@type": "PropertyValue",
                "name": "Capacity",
                "value": product.specifications.capacity
            });
        }
    }
    
    // Add reviews if available
    if (product.reviews && product.reviews.length > 0) {
        structuredData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": product.ratings || 0,
            "reviewCount": product.numOfReviews || 0,
            "bestRating": "5",
            "worstRating": "1"
        };
        
        structuredData.review = product.reviews.slice(0, 5).map(review => ({
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": review.name
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating,
                "bestRating": "5",
                "worstRating": "1"
            },
            "reviewBody": review.comment,
            "datePublished": review.createdAt || new Date().toISOString().split('T')[0]
        }));
    }
    
    // Add organization data
    const organizationData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Laiq Bags",
        "url": "https://www.laiq.shop",
        "logo": "https://www.laiq.shop/assets/laiq-logo.png",
        "description": "Premium bags and accessories - Carry Style with Confidence",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": "English"
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-schema', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    // Add organization schema separately
    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.setAttribute('data-organization-schema', 'true');
    orgScript.textContent = JSON.stringify(organizationData);
    document.head.appendChild(orgScript);
} 

// Show product not found error
function showProductNotFound() {
    console.log('❌ Showing product not found error');
    
    // Hide loading state
    hideLoading();
    
    // Get the product content container
    const productContent = document.getElementById('product-content');
    if (!productContent) {
        console.error('❌ Product content container not found');
        return;
    }
    
    // Clear existing content and show error
    productContent.innerHTML = `
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-center space-y-6">
                <div class="text-6xl mb-4">😕</div>
                <h1 class="text-3xl font-bold text-charcoal mb-4">Product Not Found</h1>
                <p class="text-lg text-charcoal/70 mb-8 max-w-md mx-auto">
                    Sorry, the product you're looking for doesn't exist or may have been removed.
                </p>
                <div class="space-x-4">
                    <a href="shop.html" class="inline-block bg-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                        Browse All Products
                    </a>
                    <a href="index.html" class="inline-block border border-charcoal/20 text-charcoal px-6 py-3 rounded-lg font-semibold hover:border-gold hover:text-gold transition-colors">
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Update page title
    document.title = 'Product Not Found - LAIQ BAGS';
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Product not found. Browse our collection of premium bags and accessories.';
} 

// Load category-specific products
async function loadCategoryProducts(category) {
    console.log(`🛍️ Loading products for category: ${category}`);
    
    try {
        // Show loading state
        const productsGrid = document.getElementById('category-products');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                    <p class="text-charcoal/70">Loading ${category} products...</p>
                </div>
            `;
        }
        
        // Fetch products from API
        const response = await fetch(`https://www.laiq.shop/api/products?category=${category}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Enhanced JSON parsing with error handling
        const responseText = await response.text();
        let data;
        
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
            
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error in category products:', parseError);
            console.error('📄 Response content:', responseText.substring(0, 1000));
            throw new Error(`Failed to parse products data: ${parseError.message}`);
        }
        const products = data.products || [];
        
        console.log(`📦 Found ${products.length} products for category: ${category}`);
        
        // Render products
        if (productsGrid) {
            if (products.length === 0) {
                productsGrid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <div class="text-6xl mb-4">👜</div>
                        <h2 class="text-2xl font-bold text-charcoal mb-4">No ${category} found</h2>
                        <p class="text-charcoal/70 mb-6">We're currently updating our ${category} collection.</p>
                        <a href="/shop.html" class="inline-block bg-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                            Browse All Products
                        </a>
                    </div>
                `;
            } else {
                productsGrid.innerHTML = products.map(product => `
                    <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div class="relative">
                            <img src="${product.images[0] || '/assets/placeholder-bag-1.jpg'}" 
                                 alt="${product.name}" 
                                 class="w-full h-64 object-cover"
                                 loading="lazy">
                            ${product.discount > 0 ? `
                                <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                                    -${product.discount}% OFF
                                </div>
                            ` : ''}
                        </div>
                        <div class="p-4">
                            <h3 class="font-semibold text-lg text-charcoal mb-2">${product.name}</h3>
                            <p class="text-charcoal/70 text-sm mb-3 line-clamp-2">${product.description}</p>
                            <div class="flex justify-between items-center">
                                <div class="price-info">
                                    ${product.discount > 0 ? `
                                        <span class="text-lg font-bold text-charcoal">₹${product.discountedPrice}</span>
                                        <span class="text-sm text-charcoal/50 line-through ml-2">₹${product.price}</span>
                                    ` : `
                                        <span class="text-lg font-bold text-charcoal">₹${product.price}</span>
                                    `}
                                </div>
                                <a href="/product.html?id=${product._id}" 
                                   class="bg-gold text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-charcoal transition-colors">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Update page title and meta description
        const categoryName = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        document.title = `${categoryName} Collection | Laiq Bags`;
        
        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = `Shop premium ${categoryName.toLowerCase()} with free shipping across India. Discover our collection of ${products.length} ${categoryName.toLowerCase()}.`;
        }
        
        // Update product count
        const productCountElement = document.getElementById('product-count');
        if (productCountElement) {
            productCountElement.textContent = products.length;
        }
        
        console.log(`✅ Successfully loaded ${products.length} products for category: ${category}`);
        
    } catch (error) {
        console.error(`❌ Error loading category products:`, error);
        
        const productsGrid = document.getElementById('category-products');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">⚠️</div>
                    <h2 class="text-2xl font-bold text-charcoal mb-4">Unable to load products</h2>
                    <p class="text-charcoal/70 mb-6">Please try again later or browse our main shop.</p>
                    <a href="/shop.html" class="inline-block bg-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                        Browse All Products
                    </a>
                </div>
            `;
        }
    }
}

// Review Modal Functions
let currentProductId = null;

// Get product ID from URL
function getCurrentProductId() {
    if (!currentProductId) {
        const urlParams = new URLSearchParams(window.location.search);
        currentProductId = urlParams.get('id');
        console.log('🔍 Product ID from URL:', currentProductId);
    }
    return currentProductId;
}

// Initialize review modal
function initializeReviewModal() {
    console.log('📝 Initializing review modal...');
    
    // Get product ID from URL
    currentProductId = getCurrentProductId();
    
    if (!currentProductId) {
        console.error('❌ No product ID found in URL');
        return;
    }
    
    // Add event listeners for review modal
    const modal = document.getElementById('review-modal');
    const form = document.getElementById('review-form');
    const closeButtons = document.querySelectorAll('.close-review-modal');
    const ratingStars = document.querySelectorAll('.rating-star');
    const commentInput = document.getElementById('review-comment');
    
    if (!modal || !form) {
        console.error('❌ Review modal elements not found');
        return;
    }
    
    // Close modal event listeners
    closeButtons.forEach(button => {
        button.addEventListener('click', closeReviewModal);
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeReviewModal();
        }
    });
    
    // Rating stars event listeners
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
        });
    });
    
    // Comment character count
    if (commentInput) {
        commentInput.addEventListener('input', () => {
            const count = commentInput.value.length;
            document.getElementById('comment-count').textContent = count;
        });
    }
    
    // Form submit
    form.addEventListener('submit', handleReviewSubmit);
    
    console.log('✅ Review modal initialized');
}

// Open review modal
function openReviewModal(review = null) {
    if (!isCustomerLoggedIn()) {
        showToast('Please login to write a review', 'error');
        return;
    }
    
    const modal = document.getElementById('review-modal');
    const form = document.getElementById('review-form');
    const ratingInput = document.getElementById('review-rating');
    const titleInput = document.getElementById('review-title');
    const commentInput = document.getElementById('review-comment');
    
    console.log('📝 Opening review modal:', {
        review,
        reviewId: review?._id,
        mode: review ? 'edit' : 'new',
        currentProductId
    });
    
    if (review && review._id) {
        // Edit mode
        document.querySelector('#review-modal h3').textContent = 'Edit Review';
        ratingInput.value = review.rating;
        titleInput.value = review.title;
        commentInput.value = review.comment;
        setRating(review.rating);
        form.dataset.reviewId = review._id;
        form.dataset.mode = 'edit';
        
        // Update character count
        document.getElementById('comment-count').textContent = commentInput.value.length;
        
        console.log('✅ Edit mode set:', {
            reviewId: form.dataset.reviewId,
            mode: form.dataset.mode,
            rating: ratingInput.value,
            title: titleInput.value,
            comment: commentInput.value
        });
    } else {
        // New review mode
        document.querySelector('#review-modal h3').textContent = 'Write a Review';
        form.reset();
        ratingInput.value = '';
        setRating(0);
        delete form.dataset.reviewId;
        form.dataset.mode = 'new';
        
        // Reset character count
        document.getElementById('comment-count').textContent = '0';
        
        console.log('✅ New review mode set:', {
            reviewId: form.dataset.reviewId,
            mode: form.dataset.mode,
            currentProductId
        });
    }
    
    modal.classList.remove('opacity-0', 'pointer-events-none');
}

// Close review modal
function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    const form = document.getElementById('review-form');
    
    // Clear form data
    form.reset();
    delete form.dataset.reviewId;
    delete form.dataset.mode;
    
    // Reset rating
    setRating(0);
    
    // Reset character count
    document.getElementById('comment-count').textContent = '0';
    
    console.log('🔒 Modal closed, form reset:', {
        reviewId: form.dataset.reviewId,
        mode: form.dataset.mode
    });
    
    modal.classList.add('opacity-0', 'pointer-events-none');
}

// Set rating
function setRating(rating) {
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('review-rating');
    
    ratingInput.value = rating;
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-gold');
            star.classList.remove('text-charcoal/20');
        } else {
            star.classList.remove('text-gold');
            star.classList.add('text-charcoal/20');
        }
    });
}

// Handle review submit
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const mode = form.dataset.mode;
    const reviewId = form.dataset.reviewId;
    
    const rating = parseInt(formData.get('rating'));
    const title = formData.get('title').trim();
    const comment = formData.get('comment').trim();
    
    console.log('📝 Review submission data:', {
        mode,
        reviewId,
        currentProductId,
        rating,
        title,
        comment,
        formDataset: form.dataset
    });
    
    // Validate product ID
    if (!currentProductId) {
        console.error('❌ No product ID available');
        showToast('Product information not found. Please refresh the page.', 'error');
        return;
    }
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        showToast('Please select a valid rating (1-5 stars)', 'error');
        return;
    }
    
    // Validate title
    if (!title || title.length < 3) {
        showToast('Please enter a review title (minimum 3 characters)', 'error');
        return;
    }
    
    // Validate comment
    if (!comment || comment.length < 10) {
        showToast('Please enter a review comment (minimum 10 characters)', 'error');
        return;
    }
    
    const reviewData = {
        rating,
        title,
        comment,
        productId: currentProductId
    };
    
    try {
        let response;
        
        if (mode === 'edit') {
            if (!reviewId || reviewId === 'undefined') {
                console.error('❌ Review ID is undefined or invalid in edit mode:', reviewId);
                showToast('Review ID not found. Please try again.', 'error');
                return;
            }
            console.log('🔄 Updating review:', reviewId);
            response = await api.updateReview(reviewId, reviewData);
        } else {
            console.log('➕ Creating new review');
            response = await api.createReview(reviewData);
        }
        
        console.log('✅ Review response:', response);
        
        if (response.success) {
            showToast(mode === 'edit' ? 'Review updated successfully' : 'Review submitted successfully', 'success');
            closeReviewModal();
            // Reload reviews for this product
            if (currentProductId) {
                loadProductReviews(currentProductId);
            }
        }
    } catch (error) {
        console.error('❌ Error submitting review:', error);
        console.error('❌ Error details:', {
            message: error.message,
            status: error.message.includes('400') ? '400' : 'Other',
            reviewData,
            mode,
            reviewId,
            currentProductId
        });
        
        if (error.message.includes('400')) {
            // Check for specific error messages
            if (error.message.includes('already reviewed')) {
                showToast('You have already reviewed this product. You can edit your existing review.', 'warning');
            } else {
                showToast('Please check your review data', 'error');
            }
        } else if (error.message.includes('403')) {
            showToast('You can only edit your own reviews', 'error');
        } else if (error.message.includes('404')) {
            showToast('Review not found', 'error');
        } else if (error.message.includes('409')) {
            showToast('You have already reviewed this product. You can edit your existing review.', 'warning');
        } else {
            showToast('Failed to submit review', 'error');
        }
    }
}

// Initialize review modal when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeReviewModal();
});

// Load product reviews from API
async function loadProductReviews(productId) {
    try {
        console.log('📝 Loading reviews for product:', productId);
        
        const response = await fetch(`https://www.laiq.shop/api/review/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Enhanced JSON parsing with error handling
        const responseText = await response.text();
        let data;
        
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
            
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error in reviews:', parseError);
            console.error('📄 Response content:', responseText.substring(0, 1000));
            throw new Error(`Failed to parse reviews data: ${parseError.message}`);
        }
        const reviews = data.reviews || [];
        
        console.log('📝 Loaded reviews:', reviews);
        
        const reviewsList = document.getElementById('reviews-list');
        if (!reviewsList) {
            console.error('❌ Reviews list container not found');
            return;
        }
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-charcoal/60 text-lg mb-4">No Reviews Yet</div>
                    <p class="text-charcoal/40 mb-6">Be the first to review this product!</p>
                    <button id="write-first-review-btn" class="bg-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                        Write First Review
                    </button>
                </div>
            `;
            
            // Add event listener for the "Write First Review" button
            const writeFirstReviewBtn = document.getElementById('write-first-review-btn');
            if (writeFirstReviewBtn && typeof openReviewModal === 'function') {
                writeFirstReviewBtn.addEventListener('click', () => {
                    openReviewModal();
                });
            }
        } else {
            reviewsList.innerHTML = reviews.map((review, index) => {
                console.log(`📝 Rendering review ${index + 1}:`, review);
                
                // Check if current user owns this review
                const currentUserId = getCurrentUserId();
                const isOwnReview = review.user?._id === currentUserId;
                
                return `
                    <div class="bg-beige/30 rounded-xl p-6" data-review-id="${review._id}">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-semibold">
                                    ${review.user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <div class="font-semibold text-charcoal">${review.user?.name || 'Anonymous'}</div>
                                    <div class="text-sm text-charcoal/60">${new Date(review.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex items-center">
                                    ${generateStars(review.rating)}
                                </div>
                                ${isOwnReview ? `
                                    <div class="flex gap-2 ml-4">
                                        <button class="edit-review-btn text-sm text-gold hover:text-charcoal transition-colors" data-review-id="${review._id}">
                                            Edit
                                        </button>
                                        <button class="delete-review-btn text-sm text-red-500 hover:text-red-700 transition-colors" data-review-id="${review._id}">
                                            Delete
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="mb-4">
                            <h4 class="font-semibold text-lg mb-2">${review.title}</h4>
                            <p class="text-charcoal/80">${review.comment}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add event listeners for edit and delete buttons
            addReviewActionListeners();
        }
        
        console.log('✅ Reviews loaded and displayed');
        
        // Initialize reviews system to ensure proper functionality
        if (typeof initializeReviews === 'function') {
            initializeReviews();
        }
        
    } catch (error) {
        console.error('❌ Error loading reviews:', error);
        
        const reviewsList = document.getElementById('reviews-list');
        if (reviewsList) {
            reviewsList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-charcoal/60 text-lg mb-4">Unable to load reviews</div>
                    <p class="text-charcoal/40 mb-6">Please try refreshing the page.</p>
                </div>
            `;
        }
        
        // Initialize reviews system even if loading failed
        if (typeof initializeReviews === 'function') {
            initializeReviews();
        }
    }
}

// Add event listeners for review action buttons
function addReviewActionListeners() {
    // Edit review buttons
    const editButtons = document.querySelectorAll('.edit-review-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const reviewId = button.dataset.reviewId;
            console.log('📝 Edit review clicked:', reviewId);
            
            try {
                // Fetch review data using the correct endpoint
                const response = await fetch(`https://www.laiq.shop/api/review/single/${reviewId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const review = data.review;
                
                // Open review modal in edit mode
                if (typeof openReviewModal === 'function') {
                    openReviewModal(review);
                } else {
                    console.error('❌ openReviewModal function not found');
                    showToast('Review editing is not available', 'error');
                }
                
            } catch (error) {
                console.error('❌ Error fetching review for edit:', error);
                showToast('Failed to load review for editing', 'error');
            }
        });
    });
    
    // Delete review buttons
    const deleteButtons = document.querySelectorAll('.delete-review-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const reviewId = button.dataset.reviewId;
            console.log('🗑️ Delete review clicked:', reviewId);
            
            if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                try {
                    // Get authentication token
                    const token = localStorage.getItem('customerToken') || localStorage.getItem('token');
                    const headers = {
                        'Content-Type': 'application/json'
                    };
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const response = await fetch(`https://www.laiq.shop/api/review/${reviewId}`, {
                        method: 'DELETE',
                        headers: headers
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast('Review deleted successfully', 'success');
                        // Reload reviews for this product
                        const productId = getCurrentProductId();
                        if (productId) {
                            loadProductReviews(productId);
                        }
                    } else {
                        showToast(data.message || 'Failed to delete review', 'error');
                    }
                    
                } catch (error) {
                    console.error('❌ Error deleting review:', error);
                    showToast('Failed to delete review', 'error');
                }
            }
        });
    });
}

// Get current user ID
function getCurrentUserId() {
    try {
        // Use the existing isCustomerLoggedIn function to check authentication
        if (typeof isCustomerLoggedIn === 'function' && isCustomerLoggedIn()) {
            // Check if customer user data is available in localStorage
            const customerUserData = localStorage.getItem('customerUser');
            if (customerUserData) {
                const user = JSON.parse(customerUserData);
                return user._id;
            }
            
            // Check if user data is available in localStorage (fallback)
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user._id;
            }
            
            // Check if user data is available in sessionStorage
            const sessionUserData = sessionStorage.getItem('user');
            if (sessionUserData) {
                const user = JSON.parse(sessionUserData);
                return user._id;
            }
            
            // Check if user data is available in the global user object
            if (typeof window.currentUser !== 'undefined' && window.currentUser) {
                return window.currentUser._id;
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error getting current user ID:', error);
        return null;
    }
}