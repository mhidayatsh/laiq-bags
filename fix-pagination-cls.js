const fs = require('fs');

console.log('🔧 Fixing pagination CLS issues...');

// Read the shop.js file
let shopJS = fs.readFileSync('js/shop.js', 'utf8');

// Fix 1: Improve the loading state in loadAllProductsForFiltering to use skeleton instead of spinner
shopJS = shopJS.replace(
    /productsGrid\.innerHTML = '<div class="col-span-full text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"><\/div><p class="text-charcoal\/60">Loading products...<\/p><\/div>';/,
    'showSkeletonLoader();'
);

// Fix 2: Improve the changePage function to use skeleton loading
const improvedChangePage = `
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
}`;

shopJS = shopJS.replace(
    /\/\/ Change page for filtered products[\s\S]*?function changePage\(page\) \{[\s\S]*?\}/,
    improvedChangePage
);

// Fix 3: Improve the renderCurrentPage function to handle loading states better
const improvedRenderCurrentPage = `
// Render current page of products
function renderCurrentPage() {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);
    
    if (productsToShow.length === 0) {
        productsContainer.innerHTML = \`
            <div class="col-span-full text-center py-12">
                <div class="text-charcoal/60 text-lg">No products found</div>
                <div class="text-charcoal/40 text-sm mt-2">Try adjusting your filters or search terms</div>
            </div>
        \`;
        return;
    }
    
    // Create products HTML with proper image dimensions to prevent layout shift
    const productsHTML = productsToShow.map(product => {
        const hasDiscount = product.discountInfo && product.discountInfo.status === 'active';
        const displayPrice = getDisplayPrice(product);
        const originalPrice = product.price;
        const productId = product._id || product.id;
        const description = product.shortDescription || product.description || '';
        const material = product.material || '';
        
        return \`
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div class="relative">
                    <a href="product?id=\${productId}" class="block">
                        <img src="\${product.images?.[0]?.url || product.image || 'assets/thumbnail.jpg'}" 
                             alt="\${product.name}" 
                             loading="lazy" 
                             decoding="async" 
                             fetchpriority="low"
                             width="400" 
                             height="256"
                             onerror="this.onerror=null;this.src='assets/thumbnail.jpg'"
                             class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </a>
                    <button class="wishlist-btn absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all \${isInWishlist(productId) ? 'text-red-500' : 'text-charcoal/60'}" 
                            data-id="\${productId}" title="Add to Wishlist">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="\${isInWishlist(productId) ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    </button>
                    
                    <!-- Enhanced Discount Badge -->
                    \${hasDiscount ? \`
                        <div class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10 animate-pulse">
                            <i class="fas fa-fire mr-1"></i>\${product.discountInfo.value} OFF
                        </div>
                    \` : ''}
                    
                    <!-- Featured/New Badge (positioned below discount if exists) -->
                    \${product.featured ? \`
                        <span class="absolute \${hasDiscount ? 'top-12' : 'top-3'} left-3 bg-gold text-white text-xs px-2 py-1 rounded-full font-semibold">
                            <i class="fas fa-star mr-1"></i>Featured
                        </span>
                    \` : ''}
                    \${product.newArrival ? \`
                        <span class="absolute \${hasDiscount ? 'top-12' : 'top-3'} left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            <i class="fas fa-sparkles mr-1"></i>New
                        </span>
                    \` : ''}
                </div>
                
                <div class="p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-lg text-charcoal">\${product.name}</h3>
                        <div class="flex items-center">
                            \${generateStars(product.ratings || product.rating || 0)}
                            <span class="text-sm text-charcoal/60 ml-1">(\${product.numOfReviews || 0} reviews)</span>
                        </div>
                    </div>
                    
                    <p class="text-charcoal/70 text-sm mb-3 line-clamp-2">\${description}</p>
                    
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            \${hasDiscount ? \`
                                <div class="flex flex-col">
                                    <span class="text-gold font-bold text-lg">₹\${displayPrice.toLocaleString()}</span>
                                    <span class="text-charcoal/40 text-sm line-through">₹\${originalPrice.toLocaleString()}</span>
                                </div>
                            \` : \`
                                <div class="text-gold font-bold text-lg">₹\${displayPrice.toLocaleString()}</div>
                            \`}
                        </div>
                        <div class="text-charcoal/60 text-sm">\${material}</div>
                    </div>
                    
                    <!-- Enhanced Countdown Timer -->
                    \${hasDiscount && product.discountInfo.timeRemaining ? \`
                        <div data-countdown="\${productId}">
                            \${getCountdownTimerHTML(productId, product.discountInfo.timeRemaining)}
                        </div>
                    \` : ''}
                    
                    <div class="flex gap-2">
                        <button class="add-to-cart-btn flex-1 bg-gold text-white py-2 px-4 rounded-lg font-semibold hover:bg-charcoal transition-colors" 
                                data-id="\${productId}" data-name="\${product.name}" data-price="\${displayPrice}" data-image="\${product.images?.[0]?.url || product.image}">
                            <i class="fas fa-shopping-cart mr-2"></i>Add to Cart
                        </button>
                        <button class="quick-view-btn bg-charcoal/10 text-charcoal py-2 px-3 rounded-lg font-semibold hover:bg-charcoal hover:text-white transition-colors" 
                                data-id="\${productId}">
                            <i class="fas fa-eye mr-1"></i>Quick View
                        </button>
                    </div>
                </div>
            </div>
        \`;
    }).join('');
    
    productsContainer.innerHTML = productsHTML;
}`;

// Find and replace the renderCurrentPage function
const renderCurrentPageRegex = /\/\/ Render current page of products[\s\S]*?function renderCurrentPage\(\) \{[\s\S]*?productsContainer\.innerHTML = productsHTML;[\s\S]*?\}/;
shopJS = shopJS.replace(renderCurrentPageRegex, improvedRenderCurrentPage);

// Write the updated file
fs.writeFileSync('js/shop.js', shopJS, 'utf8');

console.log('✅ Pagination CLS fixes applied!');
console.log('📊 Expected improvements:');
console.log('   - No layout shifts during pagination');
console.log('   - Smooth transitions between pages');
console.log('   - Better CLS score (should improve from 0.93)');
console.log('   - Consistent product card dimensions');

console.log('\n🔄 Please restart your server to see the improvements!');
