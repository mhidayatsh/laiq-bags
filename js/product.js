// Product Detail Page JavaScript
let currentProduct = null;
let productCache = new Map();
const PRODUCT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Initialize product page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📦 Product detail page initialized');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL Search Params:', window.location.search);
    
    // Wait a bit for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Get product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        console.log('🔍 Product ID from URL:', productId);
        
        if (!productId) {
            console.error('❌ No product ID found in URL');
            showError('Product ID not found');
            return;
        }
        
        // Show loading state
        console.log('⏳ Showing loading state');
        showLoading();
        
        // Load product from API with caching
        console.log('📡 Starting to load product from API');
        await loadProductFromAPI(productId);
        
        // Render product details first, then hide loader after first paint (or main image load)
        console.log('🎨 Starting to render product details');
        renderProductDetail();
        await waitForFirstContentReady(5000);
        console.log('✅ Product content ready, hiding loading state');
        hideLoading();
        
        console.log('✅ Product detail page ready');
    } catch (error) {
        console.error('❌ Error loading product:', error);
        hideLoading();
        showError('Failed to load product details. Please try again.');
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

// Load product from API with caching
async function loadProductFromAPI(productId) {
    try {
        console.log('📡 Loading product from API:', productId);
        console.log('🌐 API URL:', `${api.baseURL}/products/${productId}`);
        
        // Check cache first
        const cachedProduct = productCache.get(productId);
        if (cachedProduct && (Date.now() - cachedProduct.timestamp) < PRODUCT_CACHE_DURATION) {
            console.log('📦 Using cached product data');
            currentProduct = cachedProduct.data;
            return;
        }
        
        const response = await api.getProduct(productId);
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
        productCache.set(productId, {
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
        
        // Try cached data as fallback
        const cachedProduct = productCache.get(productId);
        if (cachedProduct) {
            console.log('⚠️ Using cached product data as fallback');
            currentProduct = cachedProduct.data;
            return;
        }
        
        // Final fallback to local data
        console.log('⚠️ Using local data as final fallback');
        const localProducts = PRODUCTS || [];
        currentProduct = localProducts.find(p => p.id == productId);
        
        if (!currentProduct) {
            console.error('❌ Product not found in local data either');
            throw new Error('Product not found');
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
    console.log('🔍 All elements with id:', document.querySelectorAll('[id]'));
    
    // If element not found, try to create it
    if (!productDetails) {
        console.log('⚠️ Product details element not found, trying to create it...');
        const productContent = document.getElementById('product-content');
        if (productContent) {
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
}

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
        shouldShowDiscount: product.discount > 0 && product.isDiscountActive
    });
        
        const finalPrice = product.discount > 0 && product.isDiscountActive ? 
            product.price * (1 - product.discount / 100) : product.price;
        productPrice.textContent = `₹${finalPrice.toLocaleString()}`;
        console.log('✅ Product price filled:', `₹${finalPrice.toLocaleString()}`);
    } else {
        console.error('❌ Product price element not found');
    }
    
    if (productOriginalPrice && product.discount > 0 && product.isDiscountActive) {
        productOriginalPrice.textContent = `₹${product.price.toLocaleString()}`;
        productOriginalPrice.classList.remove('hidden');
        console.log('✅ Original price shown');
    } else if (productOriginalPrice) {
        productOriginalPrice.classList.add('hidden');
        console.log('✅ Original price hidden (no active discount)');
    }
    
    if (productDiscount && product.discount > 0 && product.isDiscountActive) {
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
    
    const primaryImage = images.find(img => img.isPrimary) || images[0];
    
    if (primaryImage) {
        mainImage.src = primaryImage.url;
        mainImage.alt = primaryImage.alt || product.name;
        console.log('✅ Main image set:', primaryImage.url);
    } else {
        console.error('❌ No images found for product');
        return;
    }
    
    // Create image gallery
    imageGallery.innerHTML = '';
    images.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 hover:border-gold transition-colors';
        thumbnail.innerHTML = `
            <img src="${image.url}" alt="${image.alt || `Product Image ${index + 1}`}" 
                 class="w-full h-full object-cover">
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
    
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) {
        console.error('❌ Reviews container not found');
        return;
    }
    
    const reviews = product.reviews || [];
    const numOfReviews = product.numOfReviews || reviews.length;
    const averageRating = product.ratings || 0;
    
    console.log('📊 Reviews data:', { reviews, numOfReviews, averageRating });
    
    // Update review stats
    const averageRatingElement = document.getElementById('average-rating');
    const totalReviewsElement = document.getElementById('total-reviews');
    
    if (averageRatingElement) {
        averageRatingElement.textContent = averageRating.toFixed(1);
    }
    
    if (totalReviewsElement) {
        totalReviewsElement.textContent = numOfReviews;
    }
    
    // Update the star display in review stats
    const reviewStatsStars = document.querySelector('.flex.text-gold');
    if (reviewStatsStars) {
        console.log('⭐ Updating review stats stars with rating:', averageRating);
        reviewStatsStars.innerHTML = generateStars(averageRating);
        console.log('✅ Review stats stars updated');
    } else {
        console.error('❌ Review stats stars container not found');
    }
    
    // Update reviews content
    if (reviews.length === 0) {
        console.log('📝 No reviews found, showing empty state');
        reviewsContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="text-charcoal/60 text-lg mb-4">No Reviews Yet</div>
                <p class="text-charcoal/40 mb-6">Be the first to review this product!</p>
                <button class="bg-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                    Write First Review
                </button>
            </div>
        `;
    } else {
        console.log('📝 Rendering', reviews.length, 'reviews');
        reviewsContainer.innerHTML = `
            <div class="space-y-6">
                ${reviews.map((review, index) => {
                    console.log(`📝 Rendering review ${index + 1}:`, review);
                    return `
                        <div class="bg-beige/30 rounded-xl p-6">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-semibold">
                                        ${review.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div class="font-semibold text-charcoal">${review.name || 'Anonymous'}</div>
                                        <div class="text-sm text-charcoal/60">${new Date(review.createdAt || Date.now()).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    ${generateStars(review.rating)}
                                </div>
                            </div>
                            <p class="text-charcoal/70">${review.comment}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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
        });
        
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
        
        // Calculate final price with discount
        const finalPrice = currentProduct.discount > 0 && currentProduct.isDiscountActive ? 
            currentProduct.price * (1 - currentProduct.discount / 100) : currentProduct.price;
        
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
        // Calculate final price with discount
        const finalPrice = currentProduct.discount > 0 && currentProduct.isDiscountActive ? 
            currentProduct.price * (1 - currentProduct.discount / 100) : currentProduct.price;
        
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
    
    // Update page title
    const seoTitle = product.seoTitle || product.name;
    document.title = `${seoTitle} - Laiq Bags`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = product.metaDescription || product.description?.substring(0, 160) || `Buy ${product.name} from Laiq Bags. Premium quality bags and accessories.`;
    
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
        'og:title': product.seoTitle || product.name,
        'og:description': product.metaDescription || product.description?.substring(0, 160),
        'og:type': 'product',
        'og:url': `${window.location.origin}/product.html?id=${product._id}`,
        'og:image': product.images?.[0]?.url || '/assets/laiq-logo.png',
        'og:site_name': 'Laiq Bags',
        'product:price:amount': product.price,
        'product:price:currency': 'INR'
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
        'twitter:card': 'product',
        'twitter:title': product.seoTitle || product.name,
        'twitter:description': product.metaDescription || product.description?.substring(0, 160),
        'twitter:image': product.images?.[0]?.url || '/assets/laiq-logo.png',
        'twitter:site': '@laiq_bags_'
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
        "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "INR",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "Laiq Bags"
            }
        }
    };
    
    // Add reviews if available
    if (product.reviews && product.reviews.length > 0) {
        structuredData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": product.ratings || 0,
            "reviewCount": product.numOfReviews || 0
        };
        
        structuredData.review = product.reviews.slice(0, 5).map(review => ({
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": review.name
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating
            },
            "reviewBody": review.comment
        }));
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-schema', 'true');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
} 