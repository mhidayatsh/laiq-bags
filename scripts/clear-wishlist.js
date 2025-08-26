// Quick fix script to clear wishlist after rollback
// Run this in browser console to clear all wishlist data

console.log('🧹 Clearing wishlist data...');

// Clear guest wishlist
localStorage.removeItem('guestWishlist');
console.log('✅ Guest wishlist cleared');

// Clear user wishlist (if logged in)
localStorage.removeItem('userWishlist');
console.log('✅ User wishlist cleared');

// Clear any other wishlist-related data
localStorage.removeItem('wishlist');
console.log('✅ Additional wishlist data cleared');

console.log('🎉 Wishlist cleanup completed!');
console.log('🔄 Please refresh the page to see the clean wishlist.');

// Optional: Show current localStorage state
console.log('📊 Current localStorage state:');
Object.keys(localStorage).forEach(key => {
    if (key.includes('wishlist') || key.includes('cart')) {
        console.log(key + ':', localStorage.getItem(key));
    }
});
