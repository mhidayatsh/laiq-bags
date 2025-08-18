// Order Confirmation Page JavaScript
let orderData = null;

// Initialize order confirmation page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Order confirmation page initialized');
    
    try {
        // Get order ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id');
        
        if (!orderId) {
            showError('Order ID not found');
            return;
        }
        
        // Load order details
        await loadOrderDetails(orderId);
        
        // Render order information
        renderOrderDetails();
        
        console.log('✅ Order confirmation page ready');
    } catch (error) {
        console.error('❌ Error loading order confirmation:', error);
        showError('Failed to load order details. Please try again.');
    }
});

// Load order details
async function loadOrderDetails(orderId) {
    try {
        console.log('📦 Loading order details:', orderId);
        
        const response = await api.getCustomerOrder(orderId);
        if (response.success) {
            orderData = response.order;
            console.log('✅ Order details loaded:', orderData);
        } else {
            throw new Error(response.message || 'Failed to load order');
        }
    } catch (error) {
        console.error('❌ Error loading order details:', error);
        throw error;
    }
}

// Render order details
function renderOrderDetails() {
    if (!orderData) {
        showError('Order data not found');
        return;
    }
    
    renderOrderInfo();
    renderOrderItems();
    renderShippingInfo();
}

// Render order information
function renderOrderInfo() {
    const container = document.getElementById('order-details');
    if (!container) return;
    
    // Format payment method
    const paymentMethod = formatPaymentMethod(orderData.paymentMethod);
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <span class="font-medium text-gray-600">Order ID:</span>
                <span class="ml-2 font-semibold">${orderData._id}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">Order Date:</span>
                <span class="ml-2">${new Date(orderData.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">Order Status:</span>
                <span class="ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(orderData.status)}">${orderData.status}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">Payment Method:</span>
                <span class="ml-2 capitalize">${paymentMethod}</span>
            </div>
            <div class="md:col-span-2">
                <span class="font-medium text-gray-600">Total Amount:</span>
                <span class="ml-2 text-gold font-bold text-lg">₹${(orderData.totalAmount || 0).toLocaleString()}</span>
            </div>
        </div>
    `;
}

// Format payment method
function formatPaymentMethod(method) {
    if (!method) return 'N/A';
    
    switch (method.toLowerCase()) {
        case 'cod':
            return 'Cash on Delivery';
        case 'razorpay':
            return 'Razorpay';
        case 'stripe':
            return 'Stripe';
        default:
            return method.charAt(0).toUpperCase() + method.slice(1);
    }
}

// Render order items
function renderOrderItems() {
    const container = document.getElementById('order-items');
    if (!container) return;
    
    if (!orderData.orderItems || orderData.orderItems.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No items found</p>';
        return;
    }
    
    container.innerHTML = orderData.orderItems.map(item => `
        <div class="flex items-center gap-4 border-b border-gray-200 pb-4 last:border-b-0">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover" />
            <div class="flex-1">
                <div class="font-semibold">${item.name}</div>
                <div class="text-sm text-gray-600">
                    Quantity: ${item.quantity}
                    ${item.color ? `<br>Color: <span class="font-medium">${item.color.name}</span>` : ''}
                </div>
                <div class="text-gold font-bold">₹${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

// Render shipping information
function renderShippingInfo() {
    const container = document.getElementById('shipping-info');
    if (!container) return;
    
    const shippingAddress = orderData.shippingAddress;
    if (!shippingAddress) {
        container.innerHTML = '<p class="text-gray-500">Shipping information not available</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="space-y-2">
            <div>
                <span class="font-medium text-gray-600">Street:</span>
                <span class="ml-2">${shippingAddress.street || 'N/A'}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">City:</span>
                <span class="ml-2">${shippingAddress.city || 'N/A'}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">State:</span>
                <span class="ml-2">${shippingAddress.state || 'N/A'}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">Pincode:</span>
                <span class="ml-2">${shippingAddress.pincode || 'N/A'}</span>
            </div>
            <div>
                <span class="font-medium text-gray-600">Country:</span>
                <span class="ml-2">${shippingAddress.country || 'India'}</span>
            </div>
        </div>
    `;
}

// Get status color
function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'delivered':
            return 'bg-green-100 text-green-800';
        case 'shipped':
            return 'bg-blue-100 text-blue-800';
        case 'processing':
            return 'bg-yellow-100 text-yellow-800';
        case 'pending':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Show error message
function showError(message) {
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                <p class="text-gray-600 mb-6">${message}</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="shop.html" class="bg-gold text-white py-2 px-6 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                        Continue Shopping
                    </a>
                    <button onclick="location.reload()" class="bg-charcoal text-white py-2 px-6 rounded-lg font-semibold hover:bg-gold transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
} 