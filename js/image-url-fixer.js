// Image URL Fixer - Replace Unsplash URLs with local placeholders
console.log('🖼️ Image URL fixer initialized');

// Function to replace Unsplash URLs with local placeholders
function replaceUnsplashUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Replace specific Unsplash URLs with local placeholders
    if (url.includes('images.unsplash.com')) {
        if (url.includes('photo-1517841905240-472988babdf9')) {
            return '/assets/placeholder-bag-1.jpg';
        } else if (url.includes('photo-1526178613658-3f1622045557')) {
            return '/assets/placeholder-bag-2.jpg';
        } else if (url.includes('photo-1465101046530-73398c7f28ca')) {
            return '/assets/placeholder-bag-3.jpg';
        } else if (url.includes('photo-1506744038136-46273834b3fb')) {
            return '/assets/placeholder-bag-4.jpg';
        } else if (url.includes('photo-1553062407-98eeb64c6a62')) {
            return '/assets/placeholder-bag-5.jpg';
        } else if (url.includes('photo-1548036328-c9fa89d128fa')) {
            return '/assets/placeholder-bag-6.jpg';
        } else {
            // Default fallback
            return '/assets/placeholder-bag-1.jpg';
        }
    }
    
    // Normalize site-relative URLs (strip origin if same-origin was saved)
    try {
        const loc = typeof window !== 'undefined' ? window.location.origin : null;
        if (loc && url.startsWith(loc + '/')) {
            return url.replace(loc, '');
        }
    } catch (_) {}
    return url;
}

// Function to process product data and replace image URLs
function fixProductImages(product) {
    if (!product) return product;
    
    // Handle single product
    if (product.image) {
        product.image = replaceUnsplashUrl(product.image);
    }
    
    // Handle product images array
    if (product.images && Array.isArray(product.images)) {
        product.images = product.images.map(img => {
            if (typeof img === 'string') {
                return replaceUnsplashUrl(img);
            } else if (img && typeof img === 'object' && img.url) {
                img.url = replaceUnsplashUrl(img.url);
                return img;
            }
            return img;
        });
    }
    
    // Handle color variants
    if (product.colors && Array.isArray(product.colors)) {
        product.colors = product.colors.map(color => {
            if (color && typeof color === 'object') {
                if (color.image) {
                    color.image = replaceUnsplashUrl(color.image);
                }
                if (color.images && Array.isArray(color.images)) {
                    color.images = color.images.map(img => replaceUnsplashUrl(img));
                }
            }
            return color;
        });
    }
    
    return product;
}

// Function to process array of products
function fixProductsImages(products) {
    if (!products) return products;
    
    if (Array.isArray(products)) {
        return products.map(product => fixProductImages(product));
    } else {
        return fixProductImages(products);
    }
}

// Override the original API methods to intercept and fix image URLs
function patchApiMethods() {
    if (typeof api !== 'undefined') {
        // Store original methods
        const originalGetProducts = api.getProducts;
        const originalGetProduct = api.getProduct;
        const originalGetFeaturedProducts = api.getFeaturedProducts;
        
        // Override getProducts
        if (originalGetProducts) {
            api.getProducts = async function(params) {
                try {
                    const response = await originalGetProducts.call(this, params);
                    if (response && response.products) {
                        response.products = fixProductsImages(response.products);
                    }
                    return response;
                } catch (error) {
                    console.error('Error in patched getProducts:', error);
                    throw error;
                }
            };
        }
        
        // Override getProduct
        if (originalGetProduct) {
            api.getProduct = async function(id) {
                try {
                    const response = await originalGetProduct.call(this, id);
                    if (response && response.product) {
                        response.product = fixProductImages(response.product);
                    }
                    return response;
                } catch (error) {
                    console.error('Error in patched getProduct:', error);
                    throw error;
                }
            };
        }
        
        // Override getFeaturedProducts
        if (originalGetFeaturedProducts) {
            api.getFeaturedProducts = async function() {
                try {
                    const response = await originalGetFeaturedProducts.call(this);
                    if (response && response.products) {
                        response.products = fixProductsImages(response.products);
                    }
                    return response;
                } catch (error) {
                    console.error('Error in patched getFeaturedProducts:', error);
                    throw error;
                }
            };
        }
        
        console.log('✅ API methods patched for image URL fixing');
    }
}

// Function to fix existing DOM elements
function fixExistingImages() {
    const images = document.querySelectorAll('img[src*="images.unsplash.com"]');
    images.forEach(img => {
        const newSrc = replaceUnsplashUrl(img.src);
        if (newSrc !== img.src) {
            console.log(`🔄 Fixing image URL: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖼️ Image URL fixer DOM ready');
    
    // Patch API methods
    patchApiMethods();
    
    // Fix any existing images
    fixExistingImages();
    
    // Set up a mutation observer to fix dynamically added images
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        const images = node.querySelectorAll ? node.querySelectorAll('img[src*="images.unsplash.com"]') : [];
                        images.forEach(img => {
                            const newSrc = replaceUnsplashUrl(img.src);
                            if (newSrc !== img.src) {
                                console.log(`🔄 Fixing dynamically added image: ${img.src} -> ${newSrc}`);
                                img.src = newSrc;
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Image URL fixer fully initialized');
});

// Export functions for use in other scripts
window.imageUrlFixer = {
    replaceUnsplashUrl,
    fixProductImages,
    fixProductsImages,
    fixExistingImages
};
