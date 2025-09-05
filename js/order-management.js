// Order Management JavaScript
let currentOrder = null;

// Initialize order management page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📦 Order management page initialized');
    
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
        showToast('Order ID not found', 'error');
        setTimeout(() => {
            window.location.href = 'customer-profile.html';
        }, 2000);
        return;
    }
    
    // Load order details
    await loadOrderDetails(orderId);
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Start auto-refresh for real-time updates
    startAutoRefresh(orderId);
});

// Load order details
async function loadOrderDetails(orderId) {
    try {
        console.log('📦 Loading order details:', orderId);
        
        if (!orderId) {
            showToast('Order ID is required', 'error');
            return;
        }
        
        const response = await api.getCustomerOrder(orderId);
        
        if (response.success && response.order) {
            currentOrder = response.order;
            console.log('📦 Order data loaded:', currentOrder);
            renderOrderDetails();
            renderOrderHistory();
            updateActionButtons();
        } else {
            console.error('❌ Invalid order response:', response);
            showToast('Error loading order details: ' + (response.message || 'Invalid order data'), 'error');
        }
    } catch (error) {
        console.error('❌ Error loading order details:', error);
        showToast('Error loading order details: ' + error.message, 'error');
    }
}

// Render order details
function renderOrderDetails() {
    const container = document.getElementById('order-details');
    if (!container) {
        console.error('❌ Order details container not found');
        return;
    }
    
    if (!currentOrder) {
        console.error('❌ No order data available');
        container.innerHTML = '<p class="text-red-500 text-center py-8">No order data available</p>';
        return;
    }
    
    console.log('📦 Rendering order details for:', currentOrder._id);
    
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-blue-100 text-blue-800',
        'processing': 'bg-purple-100 text-purple-800',
        'shipped': 'bg-indigo-100 text-indigo-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'refunded': 'bg-gray-100 text-gray-800',
        'returned': 'bg-orange-100 text-orange-800'
    };
    
    container.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <h2 class="text-xl font-semibold text-charcoal mb-4">Order Information</h2>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="font-medium">Order ID:</span>
                        <span class="text-gray-600">${currentOrder._id || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Order Date:</span>
                        <span class="text-gray-600">${currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Status:</span>
                        <span class="px-2 py-1 rounded-full text-sm font-medium ${statusColors[currentOrder.status] || 'bg-gray-100 text-gray-800'}">
                            ${(currentOrder.status || 'unknown').charAt(0).toUpperCase() + (currentOrder.status || 'unknown').slice(1)}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Total Amount:</span>
                        <span class="text-gold font-bold">₹${(currentOrder.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="font-medium">Payment Method:</span>
                        <span class="text-gray-600">${formatPaymentMethod(currentOrder.paymentMethod)}</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h2 class="text-xl font-semibold text-charcoal mb-4">Shipping Information</h2>
                <div class="space-y-3">
                    <div>
                        <span class="font-medium">Address:</span>
                        <p class="text-gray-600">
                            ${currentOrder.shippingInfo ? 
                                `${currentOrder.shippingInfo.street || 'N/A'}, ${currentOrder.shippingInfo.city || 'N/A'}, ${currentOrder.shippingInfo.state || 'N/A'} - ${currentOrder.shippingInfo.pincode || 'N/A'}` : 
                                'Address not available'
                            }
                        </p>
                    </div>
                    ${currentOrder.trackingInfo?.trackingNumber ? `
                        <div class="flex justify-between">
                            <span class="font-medium">Tracking Number:</span>
                            <span class="text-gray-600">${currentOrder.trackingInfo.trackingNumber}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-medium">Courier:</span>
                            <span class="text-gray-600">${currentOrder.trackingInfo.courierName || 'N/A'}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <h3 class="text-lg font-semibold text-charcoal mb-3">Order Items</h3>
            <div class="space-y-3">
                ${(currentOrder.orderItems || []).map(item => `
                    <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <img src="${item.image || 'https://via.placeholder.com/64x64?text=Product'}" alt="${item.name || 'Product'}" class="w-16 h-16 rounded-lg object-cover" />
                        <div class="flex-1">
                            <div class="font-semibold">${item.name || 'Product Name Not Available'}</div>
                            <div class="text-sm text-gray-600">Quantity: ${item.quantity || 0}</div>
                            ${item.color && item.color.name ? `<div class="text-sm text-gray-600">Color: <span class="font-medium">${item.color.name}</span></div>` : ''}
                            <div class="text-gold font-bold">₹${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${currentOrder.cancellationDetails?.cancelledBy ? `
            <div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 class="text-lg font-semibold text-red-800 mb-2">Cancellation Details</h3>
                <div class="space-y-2 text-sm">
                    <div><span class="font-medium">Cancelled by:</span> ${currentOrder.cancellationDetails.cancelledBy || 'Unknown'}</div>
                    <div><span class="font-medium">Cancelled on:</span> ${currentOrder.cancellationDetails.cancelledAt ? new Date(currentOrder.cancellationDetails.cancelledAt).toLocaleDateString() : 'N/A'}</div>
                    <div><span class="font-medium">Reason:</span> ${currentOrder.cancellationDetails.cancellationReason || 'Not specified'}</div>
                    <div><span class="font-medium">Refund Status:</span> ${currentOrder.cancellationDetails.refundStatus || 'Pending'}</div>
                    ${(currentOrder.cancellationDetails.refundAmount || 0) > 0 ? `
                        <div><span class="font-medium">Refund Amount:</span> ₹${(currentOrder.cancellationDetails.refundAmount || 0).toLocaleString()}</div>
                    ` : ''}
                </div>
            </div>
        ` : ''}
    `;

    // After-sales section visibility
    try {
        const afterSalesSection = document.getElementById('after-sales-section');
        const status = currentOrder?.status;
        if (afterSalesSection) {
            // Only show for delivered orders and when no cancellation is applied
            afterSalesSection.style.display = status === 'delivered' ? 'block' : 'none';
        }
        updateAfterSalesStatusUI();
    } catch (_) {}
}

// Render order history
function renderOrderHistory() {
    const container = document.getElementById('history-timeline');
    if (!container || !currentOrder) return;
    
    const history = [
        {
            date: currentOrder.createdAt,
            title: 'Order Placed',
            description: 'Your order has been placed successfully',
            status: 'completed'
        }
    ];
    
    // Add status-specific history
    if (currentOrder.status === 'confirmed' || ['processing', 'shipped', 'delivered'].includes(currentOrder.status)) {
        history.push({
            date: currentOrder.createdAt,
            title: 'Order Confirmed',
            description: 'Your order has been confirmed',
            status: 'completed'
        });
    }
    
    if (['processing', 'shipped', 'delivered'].includes(currentOrder.status)) {
        history.push({
            date: currentOrder.createdAt,
            title: 'Processing',
            description: 'Your order is being processed',
            status: 'completed'
        });
    }
    
    if (['shipped', 'delivered'].includes(currentOrder.status) && currentOrder.trackingInfo?.shippedAt) {
        history.push({
            date: currentOrder.trackingInfo.shippedAt,
            title: 'Shipped',
            description: `Your order has been shipped via ${currentOrder.trackingInfo.courierName || 'Courier'}`,
            status: 'completed'
        });
    }
    
    if (currentOrder.status === 'delivered' && currentOrder.trackingInfo?.deliveredAt) {
        history.push({
            date: currentOrder.trackingInfo.deliveredAt,
            title: 'Delivered',
            description: 'Your order has been delivered',
            status: 'completed'
        });
    }
    
    if (currentOrder.status === 'cancelled' && currentOrder.cancellationDetails?.cancelledAt) {
        history.push({
            date: currentOrder.cancellationDetails.cancelledAt,
            title: 'Cancelled',
            description: `Order cancelled by ${currentOrder.cancellationDetails.cancelledBy || 'Unknown'}`,
            status: 'cancelled'
        });
    }
    
    if (currentOrder.status === 'refunded' && currentOrder.cancellationDetails?.refundedAt) {
        history.push({
            date: currentOrder.cancellationDetails.refundedAt,
            title: 'Refunded',
            description: 'Refund has been processed',
            status: 'completed'
        });
    }
    
    container.innerHTML = history.map(item => `
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-8 h-8 rounded-full ${item.status === 'completed' ? 'bg-green-500' : item.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-300'} flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-charcoal">${item.title}</h4>
                <p class="text-gray-600 text-sm">${item.description}</p>
                <p class="text-gray-500 text-xs mt-1">${new Date(item.date).toLocaleDateString()} at ${new Date(item.date).toLocaleTimeString()}</p>
            </div>
        </div>
    `).join('');
}

// Update action buttons based on order status
function updateActionButtons() {
    const cancelSection = document.getElementById('cancel-section');
    const cancelBtn = document.getElementById('cancel-order-btn');
    
    if (!currentOrder) return;
    
    // Show/hide cancel button based on order status - Updated to include shipped
    if (['delivered', 'cancelled', 'refunded', 'shipped'].includes(currentOrder.status)) {
        if (cancelSection) {
            cancelSection.style.display = 'none';
            
            // Show special message for shipped orders
            if (currentOrder.status === 'shipped') {
                const shippedMessage = document.createElement('div');
                shippedMessage.className = 'mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg';
                shippedMessage.innerHTML = `
                    <h3 class="text-lg font-semibold text-blue-800 mb-2">Order Status</h3>
                    <p class="text-sm text-blue-700">
                        <strong>Order Status:</strong> Shipped<br>
                        <strong>Message:</strong> This order has been shipped and cannot be cancelled. Please contact customer support if you need assistance.
                    </p>
                    ${currentOrder.trackingInfo?.trackingNumber ? `
                        <div class="mt-2">
                            <strong>Tracking Number:</strong> ${currentOrder.trackingInfo.trackingNumber}<br>
                            <strong>Courier:</strong> ${currentOrder.trackingInfo.courierName || 'N/A'}
                        </div>
                    ` : ''}
                `;
                cancelSection.parentNode.insertBefore(shippedMessage, cancelSection);
            }
        }
    } else {
        if (cancelSection) cancelSection.style.display = 'block';
    }
    
    // Disable cancel button if order is already cancelled
    if (currentOrder.status === 'cancelled') {
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.textContent = 'Order Already Cancelled';
            cancelBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        }
    }
}

// Update after-sales UI status
function updateAfterSalesStatusUI() {
    const statusDiv = document.getElementById('after-sales-status');
    if (!statusDiv) return;
    const afterSales = currentOrder?.afterSales;
    if (!afterSales || !afterSales.requested) {
        statusDiv.innerHTML = '<span class="text-gray-600">No return/replacement request submitted.</span>';
        return;
    }
    const badgeMap = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        rejected: 'bg-red-100 text-red-800',
        completed: 'bg-green-100 text-green-800'
    };
    statusDiv.innerHTML = `
        <div class="mt-2 p-3 border rounded">
            <div class="text-sm"><span class="font-medium">Type:</span> ${afterSales.type}</div>
            <div class="text-sm"><span class="font-medium">Reason:</span> ${afterSales.reason || 'N/A'}</div>
            <div class="text-sm"><span class="font-medium">Status:</span> <span class="px-2 py-1 rounded ${badgeMap[afterSales.status] || 'bg-gray-100 text-gray-800'}">${afterSales.status || 'N/A'}</span></div>
        </div>
    `;
}

// Initialize event listeners
function initializeEventListeners() {
    // Cancel order button
    const cancelBtn = document.getElementById('cancel-order-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancelOrder);
    }
    
    // Add notes button
    const addNotesBtn = document.getElementById('add-notes-btn');
    if (addNotesBtn) {
        addNotesBtn.addEventListener('click', handleAddNotes);
    }

    // After-sales events
    const checkBtn = document.getElementById('after-sales-check');
    const submitBtn = document.getElementById('after-sales-submit');
    if (checkBtn) checkBtn.addEventListener('click', handleAfterSalesCheck);
    if (submitBtn) submitBtn.addEventListener('click', handleAfterSalesSubmit);
}

// Handle cancel order
async function handleCancelOrder() {
    if (!currentOrder) return;
    
    const reason = document.getElementById('cancel-reason').value.trim();
    
    if (!reason) {
        showToast('Please provide a reason for cancellation', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
        return;
    }
    
    try {
        console.log('❌ Cancelling order:', currentOrder._id);
        
        const response = await api.cancelCustomerOrder(currentOrder._id, reason);
        
        if (response.success) {
            showToast('Order cancelled successfully', 'success');
            
            // Reload order details
            await loadOrderDetails(currentOrder._id);
        } else {
            showToast('Error cancelling order: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        showToast('Error cancelling order: ' + error.message, 'error');
    }
}

// Handle add notes
async function handleAddNotes() {
    if (!currentOrder) return;
    
    const notes = document.getElementById('customer-notes').value.trim();
    
    if (!notes) {
        showToast('Please enter some notes', 'error');
        return;
    }
    
    try {
        console.log('📝 Adding notes to order:', currentOrder._id);
        
        const response = await api.addOrderNotes(currentOrder._id, { customerNotes: notes });
        
        if (response.success) {
            showToast('Notes added successfully', 'success');
            document.getElementById('customer-notes').value = '';
            
            // Reload order details
            await loadOrderDetails(currentOrder._id);
        } else {
            showToast('Error adding notes: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error adding notes:', error);
        showToast('Error adding notes: ' + error.message, 'error');
    }
}

// Handle after-sales eligibility check
async function handleAfterSalesCheck() {
    if (!currentOrder) return;
    const info = document.getElementById('eligibility-info');
    try {
        info.textContent = 'Checking eligibility...';
        const res = await api.getAfterSalesEligibility(currentOrder._id);
        if (!res.success) throw new Error(res.message || 'Failed');
        const e = res.eligibility || {};
        info.innerHTML = `
            <div class="p-3 bg-gray-50 rounded border text-sm">
                <div><span class="font-medium">Eligible for Return:</span> ${e.eligibleForReturn ? 'Yes' : 'No'}</div>
                <div><span class="font-medium">Eligible for Replacement:</span> ${e.eligibleForReplacement ? 'Yes' : 'No'}</div>
                <div><span class="font-medium">Days Since Delivery:</span> ${e.daysSinceDelivery ?? 'N/A'}</div>
                <div><span class="font-medium">Return Window:</span> ${e.windowDaysReturn ?? 'N/A'} days (Remaining: ${e.remainingDaysReturn ?? 'N/A'})</div>
                <div><span class="font-medium">Replacement Window:</span> ${e.windowDaysReplacement ?? 'N/A'} days (Remaining: ${e.remainingDaysReplacement ?? 'N/A'})</div>
            </div>
        `;
    } catch (error) {
        info.textContent = 'Error checking eligibility: ' + error.message;
    }
}

// Handle after-sales submit (return/replacement)
async function handleAfterSalesSubmit() {
    if (!currentOrder) return;
    const type = document.getElementById('after-sales-type').value;
    const reason = document.getElementById('after-sales-reason').value.trim();
    if (!reason) {
        showToast('Please provide a reason', 'error');
        return;
    }
    try {
        const res = await api.requestAfterSales(currentOrder._id, { type, reason });
        if (res.success) {
            showToast('Request submitted successfully', 'success');
            await loadOrderDetails(currentOrder._id);
        } else {
            showToast(res.message || 'Failed to submit request', 'error');
        }
    } catch (error) {
        showToast('Error submitting request: ' + error.message, 'error');
    }
}

// Format payment method
function formatPaymentMethod(method) {
    if (!method) return 'N/A';
    
    switch (method) {
        case 'cod': return 'Cash on Delivery';
        case 'razorpay': return 'Razorpay';
        case 'stripe': return 'Stripe';
        default: return method.charAt(0).toUpperCase() + method.slice(1);
    }
}

// Toast notification
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
        case 'warning':
            toast.classList.add('bg-yellow-500');
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
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
} 

// Start auto-refresh for real-time updates
let refreshInterval = null;

function startAutoRefresh(orderId) {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 30 seconds
    refreshInterval = setInterval(async () => {
        console.log('🔄 Auto-refreshing order details...');
        await loadOrderDetails(orderId);
    }, 30000); // 30 seconds
    
    console.log('🔄 Auto-refresh started for order:', orderId);
}

// Manual refresh function
async function refreshOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (orderId) {
        showToast('Refreshing order details...', 'info');
        await loadOrderDetails(orderId);
        showToast('Order details updated!', 'success');
    }
}

// Stop auto-refresh when page is unloaded
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        console.log('🔄 Auto-refresh stopped');
    }
}); 