// Script to check localStorage cart contents
console.log('🔍 Checking localStorage cart contents...\n');

// Simulate browser localStorage check
console.log('📋 To check your localStorage cart:');
console.log('1. Open browser developer tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Run this command:');
console.log('   localStorage.getItem("userCart")');
console.log('4. Or run this to see the parsed data:');
console.log('   JSON.parse(localStorage.getItem("userCart") || "[]")');
console.log('\n📋 To check guest cart:');
console.log('   localStorage.getItem("guestCart")');
console.log('   JSON.parse(localStorage.getItem("guestCart") || "[]")');

console.log('\n🔍 Expected behavior after the fix:');
console.log('- If you have items in localStorage, you should see:');
console.log('  "✅ Using localStorage cart with X items"');
console.log('- If localStorage is empty, you should see:');
console.log('  "📦 localStorage cart is empty, trying backend..."');

console.log('\n💡 If localStorage is empty, try:');
console.log('1. Add a product to cart on the website');
console.log('2. Check if it appears in localStorage');
console.log('3. Refresh the page');
console.log('4. Check if the cart count shows correctly');

console.log('\n🚀 The fix should now work on both shop page and checkout page!');
