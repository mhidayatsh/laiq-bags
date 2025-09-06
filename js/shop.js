
// Shop Page JavaScript

// Enhanced skeleton loader to prevent layout shift
function showSkeletonLoader() {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        const skeletonHTML = Array(8).fill(0).map(() => `
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100">
                <div class="relative aspect-[4/5] overflow-hidden">
                    <div class="w-full h-full bg-gray-200"></div>
                    <div class="absolute top-4 right-4 w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div class="absolute top-4 left-4 w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div class="p-5 space-y-3">
                    <div class="space-y-2">
                        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <div class="h-4 bg-gray-200 rounded w-20"></div>
                                <div class="h-4 bg-gray-200 rounded w-8"></div>
                            </div>
                            <div class="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                    </div>
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div class="flex items-center justify-between">
                        <div class="h-6 bg-gray-200 rounded w-20"></div>
                        <div class="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div class="flex gap-3 pt-2">
                        <div class="flex-1 h-12 bg-gray-200 rounded-xl"></div>
                        <div class="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        `).join('');
        productsGrid.innerHTML = skeletonHTML;
    }
}

// Show skeleton loader immediately when page loads
document.addEventListener('DOMContentLoaded', function() {
    showSkeletonLoader();
});

let products = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 8;
let countdownTimers = {};
let productsCache = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear shop page cache
function clearShopCache() {
    productsCache = null;
    lastLoadTime = 0;
    console.log('🗑️ Cleared shop page cache');
}

// Force refresh shop products
async function forceRefreshShopProducts() {
    console.log('🔄 Force refreshing shop products...');
    clearShopCache();
    await loadProductsFromAPI(currentPage, productsPerPage);
}

// Pagination variables
let totalPages = 1;
let totalProducts = 0;
let isLoading = false;

// Show loader on the products grid (used for initial load and pagination)
function showShopLoader() {
    showSkeletonLoader();
}

// Hide the loader if it is present
function hideShopLoader() {
    const loader = document.getElementById('products-loading-state');
    if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
    }
}

// Initialize shop page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🛍️ Shop page initialized');
    
    try {
        // Load products from API with pagination
        await loadProductsFromAPI();
        
        // Initialize filters and search
        initializeFilters();
        initializeSearch();
        
        // Initialize pagination
        initializePagination();
        
        // Render products
        renderProducts();
        
        // Start countdown timers
        startCountdownTimers();
        
        console.log('✅ Shop page ready');
    } catch (error) {
        console.error('❌ Error initializing shop:', error);
        showError('Failed to load products. Please try again.');
    }
});

// Build query params based on current UI controls
function buildQueryParams(page, limit) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    const filterValue = document.getElementById('filter-select')?.value || 'all';
    const sortValue = document.getElementById('sort-select')?.value || 'newest';
    const searchValue = document.getElementById('search-input')?.value || '';

    if (filterValue && filterValue !== 'all') params.set('category', filterValue);
    if (searchValue && searchValue.trim()) params.set('keyword', searchValue.trim());

    const sortMap = {
        'price-low': 'price_asc',
        'price-high': 'price_desc',
        'newest': 'newest',
        'oldest': 'oldest',
        'name': 'name',
        'discount': 'discount'
    };
    params.set('sort', sortMap[sortValue] || 'newest');
    return `?${params.toString()}`;
}

// Load products from API with pagination
async function loadProductsFromAPI(page = 1, limit = productsPerPage) {
    if (isLoading) {
        console.log('⚠️ Products loading already in progress, skipping...');
        return;
    }
    
    isLoading = true;
    const start = performance.now();
    // Show loader for initial load and pagination
    showShopLoader();
    
    try {
        const query = buildQueryParams(page, limit);
        console.log(`📡 Loading products from API (page: ${page}, limit: ${limit})...`);
        
        // Progressive timeout strategy: 8s → 6s → 4s → fallback
        let response = null;
        let timeoutAttempts = [8000, 6000, 4000];
        
        for (let i = 0; i < timeoutAttempts.length; i++) {
            try {
                const timeout = timeoutAttempts[i];
                console.log(`⏱️ Attempt ${i + 1}: Loading products with ${timeout}ms timeout...`);
                
                // Add cache-busting parameter
                const cacheBustQuery = query + (query.includes('?') ? '&' : '?') + '_t=' + Date.now();
                response = await api.getProducts(cacheBustQuery, { timeoutMs: timeout } + (query.includes('?') ? '&' : '?') + '_t=' + Date.now());
                const end = performance.now();
                console.log(`✅ Products API success in ${(end - start).toFixed(0)} ms with ${timeout}ms timeout`);
                break;
                
            } catch (error) {
                if (error.message && error.message.includes('timeout')) {
                    console.log(`⏰ Timeout after ${timeoutAttempts[i]}ms, ${i < timeoutAttempts.length - 1 ? 'trying shorter timeout...' : 'using fallback...'}`);
                    
                    if (i === timeoutAttempts.length - 1) {
                        // All timeouts failed, use fallback
                        throw new Error('All timeout attempts failed');
                    }
                } else {
                    // Non-timeout error, re-throw
                    throw error;
                }
            }
        }
        
        if (response && response.success) {
            // Progressive rendering to avoid main-thread jank
            products = (response.products || []).map(p => ({
                ...p,
                // Ensure single image to avoid layout jank
                images: p.images && p.images.length ? [p.images[0]] : [],
            }));
            // In server-side mode, keep filteredProducts empty to trigger server pagination
            filteredProducts = [];
            
            // Debug: Check first product's data
            if (products.length > 0) {
                console.log('🔍 First product data:', products[0]);
                console.log('🔍 First product description:', products[0].description);
                console.log('🔍 First product ratings:', products[0].ratings);
                console.log('🔍 First product numOfReviews:', products[0].numOfReviews);
            }
            
            // Update pagination info
            totalProducts = response.totalProducts || products.length;
            totalPages = response.totalPages || Math.ceil(totalProducts / limit);
            currentPage = page;
            
            console.log(`✅ Loaded ${products.length} products (Page ${page}/${totalPages}, Total: ${totalProducts})`);
            if (response.cache) {
                console.log(`⚠️ Using ${response.cache} cache data`);
            }
            
            // Update pagination UI
            updatePaginationUI();
            updateProductCount();

            // Yield to frame before heavy DOM updates
            setTimeout(() => renderProducts(), 0);
        } else {
            throw new Error(response?.message || 'Failed to load products');
        }
        
    } catch (error) {
        console.error('❌ Failed to load products from API:', error);
        
        // Handle different error types
        if (error.message && error.message.includes('timeout')) {
            showTimeoutError();
        } else if (error.message && error.message.includes('Failed to fetch')) {
            showNetworkError();
        } else {
            showGenericError(error.message);
        }
    } finally {
        isLoading = false;
        // Ensure loader is removed if still present
        hideShopLoader();
    }
}

// Initialize filters
function initializeFilters() {
    const filterSelect = document.getElementById('filter-select');
    const sortSelect = document.getElementById('sort-select');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            currentPage = 1;
            filteredProducts = [];
            loadProductsFromAPI(currentPage, productsPerPage);
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentPage = 1;
            filteredProducts = [];
            loadProductsFromAPI(currentPage, productsPerPage);
        });
    }
}

// Initialize search
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            filteredProducts = [];
            loadProductsFromAPI(currentPage, productsPerPage);
        }, 300));
    }
}

// Initialize pagination
function initializePagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1 && !isLoading) {
                if (filteredProducts.length > 0) {
                    // Client-side pagination for filtered results
                    changePage(currentPage - 1);
                } else {
                    // Server-side pagination for unfiltered results
                    loadProductsFromAPI(currentPage - 1, productsPerPage);
                }
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages && !isLoading) {
                if (filteredProducts.length > 0) {
                    // Client-side pagination for filtered results
                    changePage(currentPage + 1);
                } else {
                    // Server-side pagination for unfiltered results
                    loadProductsFromAPI(currentPage + 1, productsPerPage);
                }
            }
        });
    }
    
    if (pageNumbers) {
        pageNumbers.addEventListener('click', handlePageNumberClick);
    }
}

// Handle page number clicks
function handlePageNumberClick(e) {
    if (e.target.classList.contains('page-number')) {
        const page = parseInt(e.target.dataset.page);
        if (page && page !== currentPage && !isLoading) {
            if (filteredProducts.length > 0) {
                // Client-side pagination for filtered results
                changePage(page);
            } else {
                // Server-side pagination for unfiltered results
                loadProductsFromAPI(page, productsPerPage);
            }
        }
    }
}


// Change page for filtered products
function changePage(page) {
    if (page < 1 || page > totalPages || isLoading) return;
    
    currentPage = page;
    
    // Show skeleton loader before rendering to prevent layout shift
    showSkeletonLoader();
    
    // Small delay to ensure skeleton is visible
    setTimeout(() => {
        renderCurrentPage();
        updatePaginationUI();
        
        // Scroll to top of products section
        const productsSection = document.querySelector('#products-grid');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// Update pagination UI
function updatePaginationUI() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    
    // Update page info
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    // Update prev/next buttons
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    // Generate page numbers
    if (pageNumbers) {
        pageNumbers.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pageNumbers.appendChild(createPageNumber(1));
            if (startPage > 2) {
                pageNumbers.appendChild(createEllipsis());
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.appendChild(createPageNumber(i));
        }
        
        // Add last page and ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.appendChild(createEllipsis());
            }
            pageNumbers.appendChild(createPageNumber(totalPages));
        }
    }
}

// Create page number button
function createPageNumber(page) {
    const button = document.createElement('button');
    button.className = `page-number px-4 py-2 text-sm rounded-xl transition-all duration-200 font-medium ${
        page === currentPage 
            ? 'bg-gold text-white shadow-lg' 
            : 'text-charcoal bg-white border border-charcoal/20 hover:bg-gold hover:text-white hover:border-gold hover:shadow-md'
    }`;
    button.textContent = page;
    button.dataset.page = page;
    return button;
}

// Create ellipsis
function createEllipsis() {
    const span = document.createElement('span');
    span.className = 'px-3 py-2 text-charcoal/60';
    span.textContent = '...';
    return span;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter and sort products
function filterAndSortProducts() {
    const filterValue = document.getElementById('filter-select')?.value || 'all';
    const sortValue = document.getElementById('sort-select')?.value || 'newest';
    const searchValue = document.getElementById('search-input')?.value || '';
    
    console.log('🔍 Filtering products:', { filterValue, sortValue, searchValue });
    
    // For filtering and searching, we need to load all products first
    // Then filter locally and implement client-side pagination
    loadAllProductsForFiltering(filterValue, sortValue, searchValue);
}

// Load all products for filtering and searching
async function loadAllProductsForFiltering(filterValue, sortValue, searchValue) {
    try {
        if (isLoading) return;
        isLoading = true;
        
        console.log('📡 Loading products for filtering...');
        
        // Show loading state
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            showSkeletonLoader();
        }
        
        // Load products with maximum allowed limit (20)
        // Add cache-busting parameter
        const cacheBustQuery = '?limit=20&_t=' + Date.now();
        const response = await api.getProducts(cacheBustQuery + (query.includes('?') ? '&' : '?') + '_t=' + Date.now());
        
        if (response.success) {
            const allProducts = response.products || [];
            
            // Filter by category
            let filtered = allProducts;
            if (filterValue !== 'all') {
                filtered = allProducts.filter(product => product.category === filterValue);
            }
            
            // Filter by search
            if (searchValue.trim()) {
                const searchLower = searchValue.toLowerCase();
                filtered = filtered.filter(product => {
                    const name = product.name || '';
                    const description = product.description || '';
                    const material = product.material || '';
                    
                    return name.toLowerCase().includes(searchLower) ||
                           description.toLowerCase().includes(searchLower) ||
                           material.toLowerCase().includes(searchLower);
                });
            }
            
            // Sort products
            switch (sortValue) {
                case 'price-low':
                    filtered.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
                    break;
                case 'price-high':
                    filtered.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
                    break;
                case 'newest':
                    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
                case 'oldest':
                    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    break;
                case 'name':
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'discount':
                    filtered.sort((a, b) => {
                        const discountA = getDiscountPercentage(a);
                        const discountB = getDiscountPercentage(b);
                        return discountB - discountA;
                    });
                    break;
            }
            
            // Update global variables
            products = allProducts;
            filteredProducts = filtered;
            totalProducts = filtered.length;
            totalPages = Math.ceil(totalProducts / productsPerPage);
            currentPage = 1;
            
            console.log(`✅ Filtered ${filtered.length} products from ${allProducts.length} total`);
            
            // Render current page
            renderCurrentPage();
            updatePaginationUI();
            updateProductCount();
            
        } else {
            throw new Error(response.message || 'Failed to load products');
        }
        
    } catch (error) {
        console.error('❌ Failed to load products for filtering:', error);
        showError('Failed to filter products. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Render current page from filtered products
function renderCurrentPage() {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentPageProducts = filteredProducts.slice(startIndex, endIndex);
    
    products = currentPageProducts; // Update products for rendering
    renderProducts();
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

// Get discount percentage
function getDiscountPercentage(product) {
    if (product.discountInfo && product.discountInfo.status === 'active') {
        return product.discount || 0;
    }
    return 0;
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
    
    products.forEach(product => {
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

// Render products
function renderProducts() {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;
    
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.length > 0 
        ? filteredProducts.slice(startIndex, endIndex)
        : products;
    
    if (productsToShow.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-charcoal/60 text-lg">No products found</div>
                <div class="text-charcoal/40 text-sm mt-2">Try adjusting your filters or search terms</div>
            </div>
        `;
        return;
    }
    
    const productsHTML = productsToShow.map(product => {
        const hasDiscount = product.discountInfo && product.discountInfo.status === 'active';
        const displayPrice = getDisplayPrice(product);
        const originalPrice = product.price;
        const productId = product._id || product.id;
        const description = product.shortDescription || product.description || '';
        const material = product.material || '';
        
        return `
            <div class="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100">
                <div class="relative aspect-[4/5] overflow-hidden">
                    <a href="product?id=${productId}" class="block h-full">
                        <img src="${product.images?.[0]?.url || product.image || 'assets/thumbnail.jpg'}" alt="${product.name}" loading="lazy" decoding="async" fetchpriority="low" width="400" height="500"
                             onerror="this.onerror=null;this.src='assets/thumbnail.jpg'"
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </a>
                    
                    <!-- Enhanced Wishlist Button -->
                    <button class="wishlist-btn absolute top-4 right-4 bg-white/95 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 ${isInWishlist(productId) ? 'text-red-500 scale-110' : 'text-charcoal/60 hover:text-red-500'}" 
                            data-id="${productId}" title="Add to Wishlist">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="${isInWishlist(productId) ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    </button>
                    
                    <!-- Enhanced Discount Badge -->
                    ${hasDiscount ? `
                        <div class="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-3 py-2 rounded-full font-bold shadow-lg z-10">
                            <i class="fas fa-fire mr-1"></i>${product.discountInfo.value} OFF
                        </div>
                    ` : ''}
                    
                    <!-- Featured/New Badge -->
                    ${product.featured ? `
                        <span class="absolute ${hasDiscount ? 'top-16' : 'top-4'} left-4 bg-gradient-to-r from-gold to-yellow-500 text-white text-sm px-3 py-2 rounded-full font-bold shadow-lg">
                            <i class="fas fa-star mr-1"></i>Featured
                        </span>
                    ` : ''}
                    ${product.newArrival ? `
                        <span class="absolute ${hasDiscount ? 'top-16' : 'top-4'} left-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-3 py-2 rounded-full font-bold shadow-lg">
                            <i class="fas fa-sparkles mr-1"></i>New
                        </span>
                    ` : ''}
                </div>
                
                <div class="p-5 space-y-3">
                    <!-- Product Title and Rating -->
                    <div class="space-y-2">
                        <h3 class="font-bold text-lg text-charcoal leading-tight line-clamp-2">${product.name}</h3>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                ${generateStars(product.ratings || product.rating || 0)}
                                <span class="text-sm text-charcoal/60 ml-2">${formatReviewText(product.numOfReviews || 0)}</span>
                            </div>
                            <div class="text-charcoal/60 text-sm font-medium">${material}</div>
                        </div>
                    </div>
                    
                    <!-- Product Description -->
                    <p class="text-charcoal/70 text-sm line-clamp-2 leading-relaxed">${description}</p>
                    
                    <!-- Price Section -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            ${hasDiscount ? `
                                <div class="space-y-1">
                                    <div class="text-gold font-bold text-xl">₹${displayPrice.toLocaleString()}</div>
                                    <div class="text-charcoal/40 text-sm line-through">₹${originalPrice.toLocaleString()}</div>
                                </div>
                            ` : `
                                <div class="text-gold font-bold text-xl">₹${displayPrice.toLocaleString()}</div>
                            `}
                            ${(product.freeDelivery === undefined || product.freeDelivery === true) ? `
                                <span class="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    <i class="fas fa-truck mr-1"></i>Free Delivery
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Enhanced Countdown Timer -->
                    ${hasDiscount && product.discountInfo.timeRemaining ? `
                        <div data-countdown="${productId}">
                            ${getCountdownTimerHTML(productId, product.discountInfo.timeRemaining)}
                        </div>
                    ` : ''}
                    
                    <!-- Action Buttons -->
                    <div class="flex gap-3 pt-2">
                        <button class="add-to-cart-btn flex-1 bg-gradient-to-r from-gold to-yellow-500 text-white py-3 px-4 rounded-xl font-bold hover:from-charcoal hover:to-charcoal/80 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                                data-id="${productId}" data-name="${product.name}" data-price="${displayPrice}" data-image="${product.images?.[0]?.url || product.image}">
                            <i class="fas fa-shopping-cart mr-2"></i>Add to Cart
                        </button>
                        <button class="quick-view-btn bg-charcoal/10 text-charcoal py-3 px-4 rounded-xl font-bold hover:bg-charcoal hover:text-white transition-all duration-200 shadow-md hover:shadow-lg" 
                                data-id="${productId}">
                            <i class="fas fa-eye mr-2"></i>Quick View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    productsContainer.innerHTML = productsHTML;
    
    // Add event listeners
    addProductEventListeners();
}

// Add event listeners to product buttons
function addProductEventListeners() {
    // Add to Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', handleAddToCart);
    });
    
    // Wishlist buttons
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', handleWishlistToggle);
    });
    
    // Quick View buttons
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickView);
    });
}

// Handle Add to Cart
function handleAddToCart(e) {
    const btn = e.currentTarget;
    const productId = btn.dataset.id;
    const productName = btn.dataset.name;
    const productPrice = parseInt(btn.dataset.price);
    const productImage = btn.dataset.image;
    
    console.log('🛒 Adding to cart:', productName);
    
    // Find the product to check color variants
    const product = products.find(p => (p._id || p.id) === productId);
    
    if (!product) {
        console.error('❌ Product not found:', productId);
        showToast('Product not found', 'error');
        return;
    }
    
    console.log('🎨 Product color variants:', product.colorVariants);
    
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

// Handle Wishlist Toggle
function handleWishlistToggle(e) {
    const btn = e.currentTarget;
    const productId = btn.dataset.id;
    
    console.log('❤️ Toggling wishlist for product:', productId);
    
    if (isInWishlist(productId)) {
        removeFromWishlist(productId);
        showToast('Removed from wishlist', 'info');
    } else {
        // Find product data to store in wishlist
        const product = products.find(p => (p._id || p.id) === productId);
        if (product) {
            addToWishlist(productId, product);
            showToast('Added to wishlist!', 'success');
        }
    }
    
    // Update wishlist count immediately
    if (typeof updateWishlistCount === 'function') {
        updateWishlistCount();
    }
}

// Handle Quick View
function handleQuickView(e) {
    const btn = e.currentTarget;
    const productId = btn.dataset.id;
    
    console.log('👁️ Quick view for product:', productId);
    
    // Find product data
    const product = products.find(p => (p._id || p.id) === productId);
    if (product) {
        console.log('Opening quick view for:', product.name);
        openQuickViewModal(product);
    } else {
        console.error('Product not found for quick view:', productId);
    }
}

// Update product count
function updateProductCount() {
    const countElement = document.getElementById('product-count');
    if (countElement) {
        countElement.textContent = totalProducts || products.length || 0;
    }
}

// Show error message
function showError(message) {
    const productsContainer = document.getElementById('products-grid');
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-red-500 text-lg">${message}</div>
                <button onclick="location.reload()" class="mt-4 bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors">
                    Try Again
                </button>
            </div>
        `;
    }
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
    try {
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
    } catch (error) {
        console.error('❌ Error generating stars for rating:', rating, error);
        return '<i class="far fa-star text-yellow-400"></i><i class="far fa-star text-yellow-400"></i><i class="far fa-star text-yellow-400"></i><i class="far fa-star text-yellow-400"></i><i class="far fa-star text-yellow-400"></i>';
    }
} 

// Format review text like "(1 review)" or "(3 reviews)"
function formatReviewText(count) {
    try {
        const n = Number(count) || 0;
        const label = n === 1 ? 'review' : 'reviews';
        return `(${n} ${label})`;
    } catch (e) {
        return '(0 reviews)';
    }
}

// Error handling functions
function showTimeoutError() {
    const errorMessage = 'Products are taking longer than usual to load. Please try again in a moment.';
    showError(errorMessage);
    console.warn('⏰ Products loading timeout - showing user-friendly message');
}

function showNetworkError() {
    const errorMessage = 'Network connection issue. Please check your internet connection and try again.';
    showError(errorMessage);
    console.warn('🌐 Network error - showing user-friendly message');
}

function showGenericError(message) {
    const errorMessage = `Error loading products: ${message}. Please try refreshing the page.`;
    showError(errorMessage);
    console.warn('❌ Generic error - showing user-friendly message:', message);
} 