// Shipping Management JavaScript
let shipments = [];
let currentPage = 1;
let totalPages = 1;
let currentShipmentId = null;
let filters = {
    status: '',
    courier: '',
    date: '',
    search: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Shipping Management initialized');
    loadShipments();
    loadStatistics();
    initializeEventListeners();
    setInterval(loadStatistics, 30000);
});

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('shipping-status-filter').addEventListener('change', handleFilterChange);
    document.getElementById('courier-filter').addEventListener('change', handleFilterChange);
    document.getElementById('date-filter').addEventListener('change', handleFilterChange);
    
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filters.search = e.target.value;
            currentPage = 1;
            loadShipments();
        }, 500);
    });
    
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadShipments();
        loadStatistics();
        showToast('Data refreshed successfully!', 'success');
    });
    
    document.getElementById('tracking-form').addEventListener('submit', handleTrackingUpdate);
    document.getElementById('delivery-form').addEventListener('submit', handleDeliveryConfirmation);
}

// Handle filter changes
function handleFilterChange(e) {
    const filterType = e.target.id.replace('-filter', '');
    filters[filterType] = e.target.value;
    currentPage = 1;
    loadShipments();
}

// Load shipments
async function loadShipments() {
    try {
        const container = document.getElementById('shipments-container');
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                <span class="ml-3 text-lg text-gray-600">Loading shipments...</span>
            </div>
        `;
        
        const params = new URLSearchParams({ page: currentPage, limit: 10 });
        if (filters.status) params.append('status', filters.status);
        if (filters.courier) params.append('courier', filters.courier);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);
        
        const response = await api.getAdminOrders(`?${params.toString()}`);
        
        if (response.success) {
            shipments = response.orders || [];
            totalPages = response.totalPages || 1;
            renderShipments();
            renderPagination();
        } else {
            throw new Error('Failed to load shipments');
        }
    } catch (error) {
        console.error('❌ Error loading shipments:', error);
        showToast('Failed to load shipments', 'error');
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await api.getAdminDashboard();
        if (response.success) {
            const data = response.data;
            
            // Update shipping overview
            document.getElementById('orders-to-ship').textContent = data.ordersToShip || 0;
            document.getElementById('in-transit').textContent = data.inTransit || 0;
            document.getElementById('delivered-today').textContent = data.deliveredToday || 0;
            document.getElementById('delayed-shipments').textContent = data.delayedShipments || 0;
            
            // Update courier performance
            document.getElementById('delhivery-count').textContent = `${data.delhiveryCount || 0} orders`;
            document.getElementById('dtdc-count').textContent = `${data.dtdcCount || 0} orders`;
            document.getElementById('bluedart-count').textContent = `${data.bluedartCount || 0} orders`;
            document.getElementById('other-count').textContent = `${data.otherCount || 0} orders`;
            
            // Update delivery timeline
            document.getElementById('on-time-deliveries').textContent = data.onTimeDeliveries || 0;
            document.getElementById('delayed-deliveries').textContent = data.delayedDeliveries || 0;
            document.getElementById('early-deliveries').textContent = data.earlyDeliveries || 0;
        }
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

// Render shipments
function renderShipments() {
    const container = document.getElementById('shipments-container');
    
    if (shipments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p class="text-lg">No shipments found</p>
                <p class="text-sm">Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    const shipmentsHTML = shipments.map(shipment => `
        <div class="shipping-card bg-white border border-gray-200 rounded-lg p-6 mb-4 hover:shadow-md transition-all">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div class="lg:col-span-2">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h3 class="font-semibold text-charcoal">Order #${shipment._id.slice(-8)}</h3>
                            <p class="text-sm text-gray-600">${new Date(shipment.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium shipping-status status-${shipment.status}">
                            ${shipment.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="mb-3">
                        <p class="font-medium text-charcoal">${shipment.user?.name || 'N/A'}</p>
                        <p class="text-sm text-gray-600">${shipment.user?.email || 'N/A'}</p>
                    </div>
                    
                    <div class="space-y-2">
                        ${shipment.orderItems?.slice(0, 2).map(item => `
                            <div class="flex items-center gap-3 text-sm">
                                <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMkMxNC40NzcgMTIgMTAgMTYuNDc3IDEwIDIyQzEwIDI3LjUyMyAxNC40NzcgMzIgMjAgMzJDMjUuNTIzIDMyIDMwIDI3LjUyMyAzMCAyMkMzMCAxNi40NzcgMjUuNTIzIDEyIDIwIDEyWk0yMCAyNkMxNy43OTEgMjYgMTYgMjQuMjA5IDE2IDIyQzE2IDE5Ljc5MSAxNy43OTEgMTggMjAgMThDMjIuMjA5IDE4IDI0IDE5Ljc5MSAyNCAyMkMyNCAyNC4yMDkgMjIuMjA5IDI2IDIwIDI2WiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" 
                                     alt="${item.name}" class="w-10 h-10 object-cover rounded">
                                <div class="flex-1">
                                    <p class="font-medium text-charcoal">${item.name}</p>
                                    <p class="text-gray-600">Qty: ${item.quantity} × ₹${item.price}</p>
                                </div>
                            </div>
                        `).join('')}
                        ${shipment.orderItems?.length > 2 ? `<p class="text-sm text-gray-500">+${shipment.orderItems.length - 2} more items</p>` : ''}
                    </div>
                </div>
                
                <div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">Shipping Address</p>
                        <p class="font-medium text-charcoal text-sm">${shipment.shippingInfo ? 
                            `${shipment.shippingInfo.city}, ${shipment.shippingInfo.state}` : 
                            'N/A'}</p>
                    </div>
                    
                    ${shipment.trackingInfo?.trackingNumber ? `
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">Tracking</p>
                            <p class="font-medium text-charcoal">${shipment.trackingInfo.trackingNumber}</p>
                            <p class="text-xs text-gray-500">${shipment.trackingInfo.courierName || 'N/A'}</p>
                        </div>
                    ` : ''}
                    
                    ${shipment.trackingInfo?.estimatedDelivery ? `
                        <div class="mb-4">
                            <p class="text-sm text-gray-600">Est. Delivery</p>
                            <p class="font-medium text-charcoal">${new Date(shipment.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN')}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex flex-col gap-2">
                    <button onclick="viewShipmentDetails('${shipment._id}')" 
                            class="w-full bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors text-sm">
                        <i class="fas fa-eye mr-2"></i>View Details
                    </button>
                    
                    ${!shipment.trackingInfo?.trackingNumber ? `
                        <button onclick="openTrackingModal('${shipment._id}')" 
                                class="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                            <i class="fas fa-shipping-fast mr-2"></i>Add Tracking
                        </button>
                    ` : `
                        <button onclick="openTrackingModal('${shipment._id}')" 
                                class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-edit mr-2"></i>Update Tracking
                        </button>
                    `}
                    
                    ${shipment.status === 'shipped' ? `
                        <button onclick="openDeliveryModal('${shipment._id}')" 
                                class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <i class="fas fa-check mr-2"></i>Confirm Delivery
                        </button>
                    ` : ''}
                    
                    <button onclick="printShippingLabel('${shipment._id}')" 
                            class="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        <i class="fas fa-print mr-2"></i>Print Label
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = shipmentsHTML;
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
    loadShipments();
}

// View shipment details
async function viewShipmentDetails(shipmentId) {
    try {
        const response = await api.getOrder(shipmentId);
        if (response.success) {
            const shipment = response.order;
            currentShipmentId = shipmentId;
            renderShipmentModal(shipment);
            document.getElementById('shipment-modal').classList.remove('hidden');
        } else {
            throw new Error('Failed to load shipment details');
        }
    } catch (error) {
        console.error('❌ Error loading shipment details:', error);
        showToast('Failed to load shipment details', 'error');
    }
}

// Render shipment modal
function renderShipmentModal(shipment) {
    const container = document.getElementById('shipment-modal-content');
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Shipment Information</h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-gray-600">Order ID</p>
                            <p class="font-medium">#${shipment._id.slice(-8)}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Order Date</p>
                            <p class="font-medium">${new Date(shipment.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Status</p>
                            <span class="px-2 py-1 rounded-full text-xs font-medium shipping-status status-${shipment.status}">${shipment.status.toUpperCase()}</span>
                        </div>
                        <div>
                            <p class="text-gray-600">Total Amount</p>
                            <p class="font-bold text-gold">₹${(shipment.totalAmount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Customer Information</h4>
                    <div class="space-y-2 text-sm">
                        <div>
                            <p class="text-gray-600">Name</p>
                            <p class="font-medium">${shipment.user?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Email</p>
                            <p class="font-medium">${shipment.user?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Shipping Address</h4>
                    <div class="space-y-1 text-sm">
                        <p class="text-gray-700">${shipment.shippingInfo ? 
                            `${shipment.shippingInfo.street || 'N/A'}<br>
                            ${shipment.shippingInfo.city || ''}, ${shipment.shippingInfo.state || ''} - ${shipment.shippingInfo.pincode || ''}<br>
                            ${shipment.shippingInfo.country || 'India'}` : 
                            'Address not available'
                        }</p>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Order Items (${shipment.orderItems?.length || 0})</h4>
                    <div class="space-y-3">
                        ${shipment.orderItems?.map(item => `
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
                
                ${shipment.trackingInfo?.trackingNumber ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-charcoal mb-3">Tracking Information</h4>
                        <div class="space-y-2 text-sm">
                            <div>
                                <p class="text-gray-600">Tracking Number</p>
                                <p class="font-medium">${shipment.trackingInfo.trackingNumber}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Courier</p>
                                <p class="font-medium">${shipment.trackingInfo.courierName || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Shipped At</p>
                                <p class="font-medium">${shipment.trackingInfo.shippedAt ? new Date(shipment.trackingInfo.shippedAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Estimated Delivery</p>
                                <p class="font-medium">${shipment.trackingInfo.estimatedDelivery ? new Date(shipment.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN') : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Actions</h4>
                    <div class="grid grid-cols-2 gap-3">
                        ${!shipment.trackingInfo?.trackingNumber ? `
                            <button onclick="openTrackingModal('${shipment._id}')" 
                                    class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                                <i class="fas fa-shipping-fast mr-2"></i>Add Tracking
                            </button>
                        ` : `
                            <button onclick="openTrackingModal('${shipment._id}')" 
                                    class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                                <i class="fas fa-edit mr-2"></i>Update Tracking
                            </button>
                        `}
                        
                        ${shipment.status === 'shipped' ? `
                            <button onclick="openDeliveryModal('${shipment._id}')" 
                                    class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                                <i class="fas fa-check mr-2"></i>Confirm Delivery
                            </button>
                        ` : ''}
                        
                        <button onclick="printShippingLabel('${shipment._id}')" 
                                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                            <i class="fas fa-print mr-2"></i>Print Label
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Modal functions
function closeShipmentModal() {
    document.getElementById('shipment-modal').classList.add('hidden');
    currentShipmentId = null;
}

function openTrackingModal(shipmentId) {
    currentShipmentId = shipmentId;
    document.getElementById('tracking-modal').classList.remove('hidden');
    
    const shipment = shipments.find(s => s._id === shipmentId);
    if (shipment?.trackingInfo) {
        document.getElementById('tracking-number').value = shipment.trackingInfo.trackingNumber || '';
        document.getElementById('courier-name').value = shipment.trackingInfo.courierName || '';
        if (shipment.trackingInfo.estimatedDelivery) {
            document.getElementById('estimated-delivery').value = new Date(shipment.trackingInfo.estimatedDelivery).toISOString().split('T')[0];
        }
    }
}

function closeTrackingModal() {
    document.getElementById('tracking-modal').classList.add('hidden');
    document.getElementById('tracking-form').reset();
    currentShipmentId = null;
}

function openDeliveryModal(shipmentId) {
    currentShipmentId = shipmentId;
    document.getElementById('delivery-modal').classList.remove('hidden');
    
    // Set current date and time
    const now = new Date();
    document.getElementById('delivery-date').value = now.toISOString().split('T')[0];
    document.getElementById('delivery-time').value = now.toTimeString().slice(0, 5);
}

function closeDeliveryModal() {
    document.getElementById('delivery-modal').classList.add('hidden');
    document.getElementById('delivery-form').reset();
    currentShipmentId = null;
}

// Handle form submissions
async function handleTrackingUpdate(e) {
    e.preventDefault();
    
    try {
        const trackingNumber = document.getElementById('tracking-number').value;
        const courierName = document.getElementById('courier-name').value;
        const estimatedDelivery = document.getElementById('estimated-delivery').value;
        const notes = document.getElementById('tracking-notes').value;
        
        if (!currentShipmentId) {
            showToast('No shipment selected', 'error');
            return;
        }
        
        const response = await api.updateOrderTracking(currentShipmentId, {
            trackingNumber,
            courierName,
            estimatedDelivery,
            notes
        });
        
        if (response.success) {
            showToast('Tracking information updated successfully!', 'success');
            closeTrackingModal();
            loadShipments();
            
            const shipment = shipments.find(s => s._id === currentShipmentId);
            if (shipment && shipment.status === 'processing') {
                await updateOrderStatus(currentShipmentId, 'shipped');
            }
        } else {
            throw new Error('Failed to update tracking');
        }
    } catch (error) {
        console.error('❌ Error updating tracking:', error);
        showToast('Failed to update tracking information', 'error');
    }
}

async function handleDeliveryConfirmation(e) {
    e.preventDefault();
    
    try {
        const deliveryDate = document.getElementById('delivery-date').value;
        const deliveryTime = document.getElementById('delivery-time').value;
        const notes = document.getElementById('delivery-notes').value;
        
        if (!currentShipmentId) {
            showToast('No shipment selected', 'error');
            return;
        }
        
        const response = await api.updateOrderStatus(currentShipmentId, {
            status: 'delivered',
            notes: notes,
            deliveredAt: new Date(`${deliveryDate}T${deliveryTime}`).toISOString()
        });
        
        if (response.success) {
            showToast('Delivery confirmed successfully!', 'success');
            closeDeliveryModal();
            loadShipments();
            loadStatistics();
        } else {
            throw new Error('Failed to confirm delivery');
        }
    } catch (error) {
        console.error('❌ Error confirming delivery:', error);
        showToast('Failed to confirm delivery', 'error');
    }
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        const response = await api.updateOrderStatus(orderId, { status });
        
        if (response.success) {
            showToast(`Order status updated to ${status}`, 'success');
            loadShipments();
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showToast('Failed to update order status', 'error');
    }
}

// Print shipping label
function printShippingLabel(shipmentId) {
    const shipment = shipments.find(s => s._id === shipmentId);
    if (!shipment) {
        showToast('Shipment not found', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Shipping Label #${shipment._id.slice(-8)} - Laiq Bags</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .shipping-info { margin-bottom: 20px; }
                    .customer-info { margin-bottom: 20px; }
                    .items { margin-bottom: 20px; }
                    .tracking { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LAIQ Bags</h1>
                    <h2>Shipping Label #${shipment._id.slice(-8)}</h2>
                    <p>Date: ${new Date(shipment.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                
                <div class="shipping-info">
                    <h3>Shipping Information</h3>
                    <p><strong>Status:</strong> ${shipment.status.toUpperCase()}</p>
                    <p><strong>Total Amount:</strong> ₹${(shipment.totalAmount || 0).toLocaleString()}</p>
                </div>
                
                <div class="customer-info">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${shipment.user?.name}</p>
                    <p><strong>Email:</strong> ${shipment.user?.email}</p>
                    <p><strong>Address:</strong> ${shipment.shippingInfo ? 
                        `${shipment.shippingInfo.street}, ${shipment.shippingInfo.city}, ${shipment.shippingInfo.state} - ${shipment.shippingInfo.pincode}` : 
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
                            ${shipment.orderItems?.map(item => `
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
                
                ${shipment.trackingInfo?.trackingNumber ? `
                    <div class="tracking">
                        <h3>Tracking Information</h3>
                        <p><strong>Tracking Number:</strong> ${shipment.trackingInfo.trackingNumber}</p>
                        <p><strong>Courier:</strong> ${shipment.trackingInfo.courierName}</p>
                        ${shipment.trackingInfo.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(shipment.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
                    </div>
                ` : ''}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Export shipments to CSV
function exportShipments() {
    const csvContent = [
        ['Order ID', 'Customer', 'Email', 'Status', 'Tracking Number', 'Courier', 'Est. Delivery', 'Date'],
        ...shipments.map(shipment => [
            shipment._id.slice(-8),
            shipment.user?.name || 'N/A',
            shipment.user?.email || 'N/A',
            shipment.status,
            shipment.trackingInfo?.trackingNumber || 'N/A',
            shipment.trackingInfo?.courierName || 'N/A',
            shipment.trackingInfo?.estimatedDelivery ? new Date(shipment.trackingInfo.estimatedDelivery).toLocaleDateString('en-IN') : 'N/A',
            new Date(shipment.createdAt).toLocaleDateString('en-IN')
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Shipments exported successfully!', 'success');
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

// Global functions
window.closeShipmentModal = closeShipmentModal;
window.openTrackingModal = openTrackingModal;
window.closeTrackingModal = closeTrackingModal;
window.openDeliveryModal = openDeliveryModal;
window.closeDeliveryModal = closeDeliveryModal;
window.viewShipmentDetails = viewShipmentDetails;
window.printShippingLabel = printShippingLabel;
window.changePage = changePage;
window.exportShipments = exportShipments;
