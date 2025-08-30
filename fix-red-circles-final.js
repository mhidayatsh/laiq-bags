const fs = require('fs');

console.log('🔧 Final fix for red circles - simplifying image loading approach...');

// Read the home.js file
let homeJS = fs.readFileSync('js/home.js', 'utf8');

// Replace the entire renderFeaturedProducts function with a simpler, more reliable approach
const newRenderFunction = `// Render featured products with simplified image handling
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    if (featuredProducts.length === 0) {
        container.innerHTML = \`
            <div class="text-center py-8">
                <div class="text-charcoal/60 text-lg">No featured products available</div>
            </div>
        \`;
        return;
    }
    
    container.innerHTML = featuredProducts.map(product => {
        const hasDiscount = product.discountInfo && product.discountInfo.status === 'active';
        const displayPrice = getDisplayPrice(product);
        const originalPrice = product.price;
        const productId = product._id || product.id;
        
        // Use a reliable fallback chain
        const imgSrc = product.images?.[0]?.url || product.image || 'assets/thumbnail.jpg';
        
        return \`
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div class="relative">
                    <a href="product?id=\${productId}" class="block">
                        <img src="\${imgSrc}" alt="\${product.name}"
                             loading="lazy" decoding="async" fetchpriority="low"
                             width="400" height="256"
                             onerror="this.onerror=null; this.src='assets/thumbnail.jpg';"
                             class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </a>
                    
                    <!-- Discount Badge -->
                    \${hasDiscount ? \`
                        <div class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10 animate-pulse">
                            <i class="fas fa-fire mr-1"></i>\${product.discountInfo.value} OFF
                        </div>
                    \` : ''}
                    
                    <!-- Featured Badge (positioned below discount if exists) -->
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
                    <h3 class="font-semibold text-lg text-charcoal mb-2">\${product.name}</h3>
                    <div class="flex items-center gap-2 mb-2">
                        \${generateStars(product.ratings || product.rating || 0)}
                        <span class="text-sm text-charcoal/60">(\${product.numOfReviews || 0} reviews)</span>
                    </div>
                    <p class="text-charcoal/70 text-sm mb-3 line-clamp-2">\${product.shortDescription || product.description || ''}</p>
                    
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
                        <div class="text-charcoal/60 text-sm">\${product.material}</div>
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
                        <a href="product?id=\${productId}" 
                           class="bg-charcoal/10 text-charcoal py-2 px-3 rounded-lg font-semibold hover:bg-charcoal hover:text-white transition-colors">
                            <i class="fas fa-eye mr-1"></i>View
                        </a>
                    </div>
                </div>
            </div>
        \`;
    }).join('');
    
    // Add event listeners for add to cart buttons
    addFeaturedProductEventListeners();
}`;

// Replace the renderFeaturedProducts function
homeJS = homeJS.replace(
    /\/\/ Update the renderFeaturedProducts function to use better image handling[\s\S]*?addFeaturedProductEventListeners\(\);\s*\}/s,
    newRenderFunction
);

// Remove the complex image handling functions that aren't working
homeJS = homeJS.replace(
    /\/\/ Enhanced image loading handler[\s\S]*?function handleImageError\(img\) \{[\s\S]*?\}/s,
    '// Simplified image handling - using standard onerror fallback'
);

// Write the fixed file
fs.writeFileSync('js/home.js', homeJS, 'utf8');

console.log('✅ Red circles fix applied!');
console.log('🎯 Simplified approach should eliminate red circles completely!');
