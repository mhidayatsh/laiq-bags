// Enhanced Order Management JavaScript
let orders = [];
let currentPage = 1;
let totalPages = 1;
let currentOrderId = null;
let filters = {
    status: '',
    paymentMethod: '',
    date: '',
    search: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced Order Management initialized');
    loadOrders();
    loadStatistics();
    initializeEventListeners();
    setInterval(loadStatistics, 30000);
});

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('status-filter').addEventListener('change', handleFilterChange);
    document.getElementById('payment-filter').addEventListener('change', handleFilterChange);
    document.getElementById('date-filter').addEventListener('change', handleFilterChange);
    
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filters.search = e.target.value;
            currentPage = 1;
            loadOrders();
        }, 500);
    });
    
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadOrders();
        loadStatistics();
        showToast('Data refreshed successfully!', 'success');
    });
    
    document.getElementById('tracking-form').addEventListener('submit', handleTrackingUpdate);
    document.getElementById('status-form').addEventListener('submit', handleStatusUpdate);
}

// Handle filter changes
function handleFilterChange(e) {
    const filterType = e.target.id.replace('-filter', '');
    filters[filterType] = e.target.value;
    currentPage = 1;
    loadOrders();
}

// Load orders
async function loadOrders() {
    try {
        const container = document.getElementById('orders-container');
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                <span class="ml-3 text-lg text-gray-600">Loading orders...</span>
            </div>
        `;
        
        const params = new URLSearchParams({ page: currentPage, limit: 10 });
        if (filters.status) params.append('status', filters.status);
        if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);
        
        const response = await api.getAdminOrders(`?${params.toString()}`);
        
        if (response.success) {
            orders = response.orders || [];
            totalPages = response.totalPages || 1;
            renderOrders();
            renderPagination();
        } else {
            throw new Error('Failed to load orders');
        }
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showToast('Failed to load orders', 'error');
        
        const container = document.getElementById('orders-container');
        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p class="text-lg">Failed to load orders</p>
                <button onclick="loadOrders()" class="mt-4 bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await api.getAdminDashboard();
        if (response.success) {
            const data = response.data;
            document.getElementById('total-orders').textContent = data.totalOrders || 0;
            document.getElementById('pending-orders').textContent = data.pendingOrders || 0;
            document.getElementById('total-revenue').textContent = `₹${(data.totalRevenue || 0).toLocaleString()}`;
            document.getElementById('delivered-today').textContent = data.deliveredToday || 0;
        }
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

// Render orders
function renderOrders() {
    const container = document.getElementById('orders-container');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p class="text-lg">No orders found</p>
                <p class="text-sm">Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    const ordersHTML = orders.map(order => `
        <div class="order-card bg-white border border-gray-200 rounded-lg p-6 mb-4 hover:shadow-md transition-all">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div class="lg:col-span-2">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h3 class="font-semibold text-charcoal">Order #${order._id.slice(-8)}</h3>
                            <p class="text-sm text-gray-600">${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium status-${order.status}">
                            ${order.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="mb-3">
                        <p class="font-medium text-charcoal">${order.user?.name || 'N/A'}</p>
                        <p class="text-sm text-gray-600">${order.user?.email || 'N/A'}</p>
                    </div>
                    
                    <div class="space-y-2">
                        ${order.orderItems?.slice(0, 3).map(item => `
                            <div class="flex items-center gap-3 text-sm">
                                <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMkMxNC40NzcgMTIgMTAgMTYuNDc3IDEwIDIyQzEwIDI3LjUyMyAxNC40NzcgMzIgMjAgMzJDMjUuNTIzIDMyIDMwIDI3LjUyMyAzMCAyMkMzMCAxNi40NzcgMjUuNTIzIDEyIDIwIDEyWk0yMCAyNkMxNy43OTEgMjYgMTYgMjQuMjA5IDE2IDIyQzE2IDE5Ljc5MSAxNy43OTEgMTggMjAgMThDMjIuMjA5IDE4IDI0IDE5Ljc5MSAyNCAyMkMyNCAyNC4yMDkgMjIuMjA5IDI2IDIwIDI2WiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" 
                                     alt="${item.name}" class="w-10 h-10 object-cover rounded">
                                <div class="flex-1">
                                    <p class="font-medium text-charcoal">${item.name}</p>
                                    <p class="text-gray-600">Qty: ${item.quantity} × ₹${item.price}</p>
                                </div>
                            </div>
                        `).join('')}
                        ${order.orderItems?.length > 3 ? `<p class="text-sm text-gray-500">+${order.orderItems.length - 3} more items</p>` : ''}
                    </div>
                </div>
                
                <div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">Total Amount</p>
                        <p class="text-xl font-bold text-gold">₹${(order.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">Payment Method</p>
                        <p class="font-medium text-charcoal">${order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                        <p class="text-xs text-gray-500">${order.paymentInfo?.status || 'N/A'}</p>
                    </div>
                    
                    ${order.trackingInfo?.trackingNumber ? `
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">Tracking</p>
                            <p class="font-medium text-charcoal">${order.trackingInfo.trackingNumber}</p>
                            <p class="text-xs text-gray-500">${order.trackingInfo.courierName || 'N/A'}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex flex-col gap-2">
                    <button onclick="viewOrderDetails('${order._id}')" 
                            class="w-full bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors text-sm">
                        <i class="fas fa-eye mr-2"></i>View Details
                    </button>
                    
                    ${order.status === 'pending' ? `
                        <button onclick="updateOrderStatus('${order._id}', 'processing')" 
                                class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-cog mr-2"></i>Process
                        </button>
                    ` : ''}
                    
                    ${order.status === 'processing' ? `
                        <button onclick="openTrackingModal('${order._id}')" 
                                class="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                            <i class="fas fa-shipping-fast mr-2"></i>Ship
                        </button>
                    ` : ''}
                    
                    ${order.status === 'shipped' ? `
                        <button onclick="updateOrderStatus('${order._id}', 'delivered')" 
                                class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <i class="fas fa-check mr-2"></i>Deliver
                        </button>
                    ` : ''}
                    
                    ${['pending', 'processing'].includes(order.status) ? `
                        <button onclick="cancelOrder('${order._id}')" 
                                class="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                            <i class="fas fa-times mr-2"></i>Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ordersHTML;
}

// Render pagination
function renderPagination() {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">Page ${currentPage} of ${totalPages}</div>
            <div class="flex gap-2">
    `;
    
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="changePage(${currentPage - 1})" 
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                    class="px-3 py-2 border border-gray-300 rounded-lg transition-colors ${i === currentPage ? 'bg-gold text-white border-gold' : 'hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" 
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationHTML += `
            </div>
        </div>
    `;
    
    container.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    loadOrders();
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await api.getOrder(orderId);
        if (response.success) {
            const order = response.order;
            currentOrderId = orderId;
            renderOrderModal(order);
            document.getElementById('order-modal').classList.remove('hidden');
        } else {
            throw new Error('Failed to load order details');
        }
    } catch (error) {
        console.error('❌ Error loading order details:', error);
        showToast('Failed to load order details', 'error');
    }
}

// Render order modal
function renderOrderModal(order) {
    const container = document.getElementById('order-modal-content');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Order Information</h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-gray-600">Order ID</p>
                            <p class="font-medium">#${order._id.slice(-8)}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Order Date</p>
                            <p class="font-medium">${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Status</p>
                            <span class="px-2 py-1 rounded-full text-xs font-medium status-${order.status}">${order.status.toUpperCase()}</span>
                        </div>
                        <div>
                            <p class="text-gray-600">Total Amount</p>
                            <p class="font-bold text-gold">₹${(order.totalAmount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Customer Information</h4>
                    <div class="space-y-2 text-sm">
                        <div>
                            <p class="text-gray-600">Name</p>
                            <p class="font-medium">${order.user?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Email</p>
                            <p class="font-medium">${order.user?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Shipping Address</h4>
                    <div class="space-y-1 text-sm">
                        <p class="text-gray-700">${order.shippingInfo ? 
                            `${order.shippingInfo.street || 'N/A'}<br>
                            ${order.shippingInfo.city || ''}, ${order.shippingInfo.state || ''} - ${order.shippingInfo.pincode || ''}<br>
                            ${order.shippingInfo.country || 'India'}` : 
                            'Address not available'
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Order Items (${order.orderItems?.length || 0})</h4>
                    <div class="space-y-3">
                        ${order.orderItems?.map(item => `
                            <div class="flex items-center gap-3 p-3 bg-white rounded border">
                                <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyNEMyOS41ODIgMjQgMjEgMzIuNTgyIDIxIDQyQzIxIDUxLjQxOCAyOS41ODIgNjAgNDAgNjBDNTAuNDE4IDYwIDU5IDUxLjQxOCA1OSA0MkM1OSAzMi41ODIgNTAuNDE4IDI0IDQwIDI0Wk00MCA1MkMzNC40NzcgNTIgMzAgNDcuNTIzIDMwIDQyQzMwIDM2LjQ3NyAzNC40NzcgMzIgNDAgMzJDNDUuNTIzIDMyIDUwIDM2LjQ3NyA1MCA0MkM1MCA0Ny41MjMgNDUuNTIzIDUyIDQwIDUyWiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" 
                                     alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                                <div class="flex-1 min-w-0">
                                    <h5 class="font-semibold text-charcoal truncate">${item.name}</h5>
                                    <p class="text-sm text-gray-600">Qty: ${item.quantity} × ₹${item.price}</p>
                                </div>
                            </div>
                        `).join('') || '<p class="text-gray-500 text-center">No items found</p>'}
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Actions</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="openStatusModal('${order._id}')" 
                                class="bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors text-sm">
                            <i class="fas fa-edit mr-2"></i>Update Status
                        </button>
                        
                        ${!order.trackingInfo?.trackingNumber ? `
                            <button onclick="openTrackingModal('${order._id}')" 
                                    class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                                <i class="fas fa-shipping-fast mr-2"></i>Add Tracking
                            </button>
                        ` : `
                            <button onclick="openTrackingModal('${order._id}')" 
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                                <i class="fas fa-edit mr-2"></i>Update Tracking
                            </button>
                        `}
                        
                        ${['pending', 'processing'].includes(order.status) ? `
                            <button onclick="cancelOrder('${order._id}')" 
                                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                                <i class="fas fa-times mr-2"></i>Cancel Order
                            </button>
                        ` : ''}
                        
                        <button onclick="printOrder('${order._id}')" 
                                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                            <i class="fas fa-print mr-2"></i>Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Modal functions
function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
    currentOrderId = null;
}

function openTrackingModal(orderId) {
    currentOrderId = orderId;
    document.getElementById('tracking-modal').classList.remove('hidden');
    
    const order = orders.find(o => o._id === orderId);
    if (order?.trackingInfo) {
        document.getElementById('tracking-number').value = order.trackingInfo.trackingNumber || '';
        document.getElementById('courier-name').value = order.trackingInfo.courierName || '';
        if (order.trackingInfo.estimatedDelivery) {
            document.getElementById('estimated-delivery').value = new Date(order.trackingInfo.estimatedDelivery).toISOString().split('T')[0];
        }
    }
}

function closeTrackingModal() {
    document.getElementById('tracking-modal').classList.add('hidden');
    document.getElementById('tracking-form').reset();
    currentOrderId = null;
}

function openStatusModal(orderId) {
    currentOrderId = orderId;
    document.getElementById('status-modal').classList.remove('hidden');
    
    const order = orders.find(o => o._id === orderId);
    if (order) {
        document.getElementById('new-status').value = order.status;
    }
}

function closeStatusModal() {
    document.getElementById('status-modal').classList.add('hidden');
    document.getElementById('status-form').reset();
    currentOrderId = null;
}

// Handle form submissions
async function handleTrackingUpdate(e) {
    e.preventDefault();
    
    try {
        const trackingNumber = document.getElementById('tracking-number').value;
        const courierName = document.getElementById('courier-name').value;
        const estimatedDelivery = document.getElementById('estimated-delivery').value;
        
        if (!currentOrderId) {
            showToast('No order selected', 'error');
            return;
        }
        
        const response = await api.updateOrderTracking(currentOrderId, {
            trackingNumber,
            courierName,
            estimatedDelivery
        });
        
        if (response.success) {
            showToast('Tracking information updated successfully!', 'success');
            closeTrackingModal();
            loadOrders();
            
            const order = orders.find(o => o._id === currentOrderId);
            if (order && order.status === 'processing') {
                await updateOrderStatus(currentOrderId, 'shipped');
            }
        } else {
            throw new Error('Failed to update tracking');
        }
    } catch (error) {
        console.error('❌ Error updating tracking:', error);
        showToast('Failed to update tracking information', 'error');
    }
}

async function handleStatusUpdate(e) {
    e.preventDefault();
    
    try {
        const newStatus = document.getElementById('new-status').value;
        const notes = document.getElementById('status-notes').value;
        
        if (!currentOrderId) {
            showToast('No order selected', 'error');
            return;
        }
        
        const response = await api.updateOrderStatus(currentOrderId, {
            status: newStatus,
            notes: notes
        });
        
        if (response.success) {
            showToast('Order status updated successfully!', 'success');
            closeStatusModal();
            loadOrders();
            
            if (!document.getElementById('order-modal').classList.contains('hidden')) {
                viewOrderDetails(currentOrderId);
            }
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showToast('Failed to update order status', 'error');
    }
}

// Quick actions
async function updateOrderStatus(orderId, status) {
    try {
        const response = await api.updateOrderStatus(orderId, { status });
        
        if (response.success) {
            showToast(`Order status updated to ${status}`, 'success');
            loadOrders();
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showToast('Failed to update order status', 'error');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        const reason = prompt('Please provide a reason for cancellation:') || 'Cancelled by admin';
        
        const response = await api.cancelOrder(orderId, {
            reason: reason,
            refundAmount: 0
        });
        
        if (response.success) {
            showToast('Order cancelled successfully', 'success');
            loadOrders();
        } else {
            throw new Error('Failed to cancel order');
        }
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        showToast('Failed to cancel order', 'error');
    }
}

function printOrder(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Order #${order._id.slice(-8)} - Laiq Bags</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .order-info { margin-bottom: 20px; }
                    .customer-info { margin-bottom: 20px; }
                    .items { margin-bottom: 20px; }
                    .total { font-weight: bold; font-size: 18px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LAIQ Bags</h1>
                    <h2>Order #${order._id.slice(-8)}</h2>
                    <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                
                <div class="order-info">
                    <h3>Order Information</h3>
                    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase()}</p>
                    <p><strong>Payment Status:</strong> ${order.paymentInfo?.status}</p>
                </div>
                
                <div class="customer-info">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${order.user?.name}</p>
                    <p><strong>Email:</strong> ${order.user?.email}</p>
                    <p><strong>Address:</strong> ${order.shippingInfo ? 
                        `${order.shippingInfo.street}, ${order.shippingInfo.city}, ${order.shippingInfo.state} - ${order.shippingInfo.pincode}` : 
                        'N/A'}</p>
                </div>
                
                <div class="items">
                    <h3>Order Items</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.orderItems?.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>₹${item.price}</td>
                                    <td>₹${item.price * item.quantity}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>
                </div>
                
                <div class="total">
                    <p><strong>Total Amount: ₹${(order.totalAmount || 0).toLocaleString()}</strong></p>
                </div>
                
                ${order.trackingInfo?.trackingNumber ? `
                    <div class="tracking">
                        <h3>Tracking Information</h3>
                        <p><strong>Tracking Number:</strong> ${order.trackingInfo.trackingNumber}</p>
                        <p><strong>Courier:</strong> ${order.trackingInfo.courierName}</p>
                        ${order.trackingInfo.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
                    </div>
                ` : ''}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg mb-2 transform transition-all duration-300 translate-x-full`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation-triangle' : 'info'}-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Export orders to CSV
function exportOrders() {
    const csvContent = [
        ['Order ID', 'Customer', 'Email', 'Items', 'Total Amount', 'Status', 'Payment Method', 'Date', 'Tracking Number'],
        ...orders.map(order => [
            order._id.slice(-8),
            order.user?.name || 'N/A',
            order.user?.email || 'N/A',
            order.orderItems?.length || 0,
            order.totalAmount || 0,
            order.status,
            order.paymentMethod,
            new Date(order.createdAt).toLocaleDateString('en-IN'),
            order.trackingInfo?.trackingNumber || 'N/A'
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Orders exported successfully!', 'success');
}

// Global functions for modal access
window.closeOrderModal = closeOrderModal;
window.closeTrackingModal = closeTrackingModal;
window.closeStatusModal = closeStatusModal;
window.viewOrderDetails = viewOrderDetails;
window.openTrackingModal = openTrackingModal;
window.openStatusModal = openStatusModal;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;
window.printOrder = printOrder;
window.changePage = changePage;
window.exportOrders = exportOrders;
