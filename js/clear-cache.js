// Clear cache and replace Unsplash URLs
console.log('🧹 Clearing cache and replacing Unsplash URLs...');

// Function to replace Unsplash URLs with local placeholders
function replaceUnsplashUrls(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => replaceUnsplashUrls(item));
    }
    
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.includes('images.unsplash.com')) {
            // Replace Unsplash URLs with local placeholders
            if (value.includes('photo-1517841905240-472988babdf9')) {
                newObj[key] = '/assets/placeholder-bag-1.jpg';
            } else if (value.includes('photo-1526178613658-3f1622045557')) {
                newObj[key] = '/assets/placeholder-bag-2.jpg';
            } else if (value.includes('photo-1465101046530-73398c7f28ca')) {
                newObj[key] = '/assets/placeholder-bag-3.jpg';
            } else {
                newObj[key] = '/assets/placeholder-bag-1.jpg';
            }
            console.log(`🔄 Replaced Unsplash URL: ${value} -> ${newObj[key]}`);
        } else if (typeof value === 'object') {
            newObj[key] = replaceUnsplashUrls(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

// Clear and update localStorage
try {
    // Get cart data
    const cartData = localStorage.getItem('guestCart');
    if (cartData) {
        const cart = JSON.parse(cartData);
        const updatedCart = replaceUnsplashUrls(cart);
        localStorage.setItem('guestCart', JSON.stringify(updatedCart));
        console.log('✅ Updated cart data');
    }
    
    // Get wishlist data
    const wishlistData = localStorage.getItem('guestWishlist');
    if (wishlistData) {
        const wishlist = JSON.parse(wishlistData);
        const updatedWishlist = replaceUnsplashUrls(wishlist);
        localStorage.setItem('guestWishlist', JSON.stringify(updatedWishlist));
        console.log('✅ Updated wishlist data');
    }
    
    // Get guest data
    const guestData = localStorage.getItem('guestData');
    if (guestData) {
        const guest = JSON.parse(guestData);
        const updatedGuest = replaceUnsplashUrls(guest);
        localStorage.setItem('guestData', JSON.stringify(updatedGuest));
        console.log('✅ Updated guest data');
    }
    
    console.log('✅ Cache cleared and URLs replaced successfully');
} catch (error) {
    console.error('❌ Error clearing cache:', error);
}

// Also clear any other potential cache
try {
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ Session storage cleared');
    
    // Clear any cached images
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
            console.log('✅ Browser cache cleared');
        });
    }
} catch (error) {
    console.error('❌ Error clearing additional cache:', error);
}
