// Enhanced Order Management - Optimized Version
// Uses shared modules for authentication, caching, error handling, and API optimization

// Format payment method for display
function formatPaymentMethod(method) {
    if (!method) return 'N/A';
    
    const methodMap = {
        'cod': 'Cash on Delivery',
        'razorpay': 'Razorpay',
        'stripe': 'Stripe',
        'online': 'Online Payment'
    };
    
    return methodMap[method.toLowerCase()] || method.toUpperCase();
}

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

// Initialize with shared modules
async function initializeEnhancedOrderManagement() {
    console.log('🚀 Initializing Enhanced Order Management with Shared Modules...');
    
    try {
        // Wait for shared modules to be ready
        if (window.sharedModules) {
            await window.sharedModules.onInitialized(async () => {
                console.log('✅ Shared modules ready, initializing order management...');
                await startOrderManagement();
            });
        } else {
            console.log('⚠️ Shared modules not available, using fallback initialization...');
            await startOrderManagement();
        }
    } catch (error) {
        console.error('❌ Failed to initialize enhanced order management:', error);
        showToast('Failed to initialize system', 'error');
    }
}

// Start order management system
async function startOrderManagement() {
    try {
        // Check authentication using shared module
        const isAuthenticated = await checkAuth('admin');
        if (!isAuthenticated) {
            return;
        }

        // Load initial data
        await loadOrders();
        await loadStatistics();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Setup periodic refresh with caching
        setupPeriodicRefresh();
        
        // Preload common data for better performance
        await preloadCommonData();
        
        console.log('✅ Enhanced Order Management started successfully');
        
    } catch (error) {
        console.error('❌ Error starting order management:', error);
        handleError(error, { source: 'order-management-startup' });
    }
}

// Check authentication using shared module
async function checkAuth(role) {
    if (window.sharedModules && window.sharedModules.hasModule('auth')) {
        return await window.sharedModules.checkAuth(role);
    } else {
        // Fallback to original authentication
        return await checkAdminAuthFallback();
    }
}

// Fallback authentication check
async function checkAdminAuthFallback() {
    let token = localStorage.getItem('token');
    let user = localStorage.getItem('user');
    
    if (!token || !user) {
        showToast('Please login as admin to access enhanced order management', 'error');
        setTimeout(() => {
            window.location.href = '/admin-login.html';
        }, 2000);
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            showToast('Please login as admin to access enhanced order management', 'error');
            setTimeout(() => {
                window.location.href = '/admin-login.html';
            }, 2000);
            return false;
        }
    } catch (error) {
        showToast('Authentication error. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '/admin-login.html';
        }, 2000);
        return false;
    }
    
    return true;
}

// Load orders with caching and error handling
async function loadOrders() {
    try {
        const container = document.getElementById('orders-container');
        if (!container) {
            console.warn('⚠️ Orders container not found');
            return;
        }
        
        // Show loading state
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                <span class="ml-3 text-lg text-gray-600">Loading orders...</span>
            </div>
        `;
        
        // Build query parameters
        const params = new URLSearchParams({ page: currentPage, limit: 10 });
        if (filters.status) params.append('status', filters.status);
        if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);
        
        // Use shared API module with caching
        let response;
        if (window.sharedModules && window.sharedModules.hasModule('api')) {
            response = await window.sharedModules.apiRequest('/api/admin/orders', {
                params: Object.fromEntries(params),
                cacheTTL: 1 * 60 * 1000 // 1 minute cache for orders
            });
        } else {
            // Fallback to original API
            response = await api.getAdminOrders(`?${params.toString()}`);
        }
        
        if (response.success) {
            orders = response.orders || [];
            totalPages = response.totalPages || 1;
            renderOrders();
            renderPagination();
        } else {
            throw new Error(response.message || 'Failed to load orders');
        }
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        handleError(error, { source: 'load-orders' });
        
        // Show error state
        const container = document.getElementById('orders-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg">Failed to load orders</p>
                    <p class="text-sm text-gray-600 mb-4">${error.message}</p>
                    <button onclick="loadOrders()" class="mt-4 bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Load statistics with caching
async function loadStatistics() {
    try {
        let response;
        if (window.sharedModules && window.sharedModules.hasModule('api')) {
            response = await window.sharedModules.apiRequest('/api/admin/dashboard', {
                cacheTTL: 2 * 60 * 1000 // 2 minutes cache for dashboard
            });
        } else {
            response = await api.getAdminDashboard();
        }
        
        if (response.success) {
            const data = response.data;
            
            // Update statistics based on available data
            if (document.getElementById('total-orders')) {
                document.getElementById('total-orders').textContent = data.totalOrders || 0;
            }
            
            if (document.getElementById('pending-orders')) {
                const pendingOrders = data.recentOrders?.filter(order => 
                    ['pending', 'processing', 'confirmed'].includes(order.status)
                ).length || 0;
                document.getElementById('pending-orders').textContent = pendingOrders;
            }
            
            if (document.getElementById('total-revenue')) {
                document.getElementById('total-revenue').textContent = `₹${(data.totalRevenue || 0).toLocaleString()}`;
            }
            
            if (document.getElementById('delivered-today')) {
                const today = new Date().toDateString();
                const deliveredToday = data.recentOrders?.filter(order => 
                    order.status === 'delivered' && 
                    new Date(order.createdAt).toDateString() === today
                ).length || 0;
                document.getElementById('delivered-today').textContent = deliveredToday;
            }
        }
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
        handleError(error, { source: 'load-statistics' });
    }
}

// Preload common data for better performance
async function preloadCommonData() {
    if (!window.sharedModules || !window.sharedModules.hasModule('api')) return;
    
    try {
        const commonEndpoints = [
            { url: '/api/admin/dashboard', ttl: 2 * 60 * 1000 },
            { url: '/api/admin/orders', ttl: 1 * 60 * 1000 },
            { url: '/api/admin/products', ttl: 5 * 60 * 1000 }
        ];
        
        await window.sharedModules.batchApiRequests(
            commonEndpoints.map(endpoint => ({
                endpoint: endpoint.url,
                options: { cacheTTL: endpoint.ttl }
            }))
        );
        
        console.log('✅ Common data preloaded');
    } catch (error) {
        console.warn('⚠️ Data preloading failed:', error);
    }
}

// Setup periodic refresh with intelligent caching
function setupPeriodicRefresh() {
    // Refresh statistics every 30 seconds
    setInterval(async () => {
        try {
            await loadStatistics();
        } catch (error) {
            console.warn('⚠️ Periodic statistics refresh failed:', error);
        }
    }, 30000);
    
    // Optimize performance every 2 minutes
    setInterval(async () => {
        if (window.sharedModules) {
            await window.sharedModules.optimizePerformance();
        }
    }, 120000);
}

// Initialize event listeners
function initializeEventListeners() {
    // Filter change handlers
    document.getElementById('status-filter')?.addEventListener('change', handleFilterChange);
    document.getElementById('payment-filter')?.addEventListener('change', handleFilterChange);
    document.getElementById('date-filter')?.addEventListener('change', handleFilterChange);
    
    // Search input with debouncing
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filters.search = e.target.value;
                currentPage = 1;
                loadOrders();
            }, 500);
        });
    }
    
    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
        try {
            // Clear cache for fresh data
            if (window.sharedModules && window.sharedModules.hasModule('cache')) {
                window.sharedModules.cacheDelete('/api/admin/orders');
                window.sharedModules.cacheDelete('/api/admin/dashboard');
            }
            
            await loadOrders();
            await loadStatistics();
            showToast('Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            handleError(error, { source: 'refresh-data' });
        }
    });
    
    // Form submissions
    document.getElementById('tracking-form')?.addEventListener('submit', handleTrackingUpdate);
    document.getElementById('status-form')?.addEventListener('submit', handleStatusUpdate);
}

// Handle filter changes
function handleFilterChange(e) {
    const filterType = e.target.id.replace('-filter', '');
    filters[filterType] = e.target.value;
    currentPage = 1;
    loadOrders();
}

// Render orders with error boundary
function renderOrders() {
    try {
        const container = document.getElementById('orders-container');
        if (!container) return;
        
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
                            <p class="font-medium text-charcoal">${formatPaymentMethod(order.paymentMethod)}</p>
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
                        
                        <button onclick="editOrder('${order._id}')" 
                                class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                            <i class="fas fa-edit mr-2"></i>Edit
                        </button>
                        
                        <button onclick="updateOrderStatus('${order._id}')" 
                                class="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                            <i class="fas fa-sync-alt mr-2"></i>Update Status
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = ordersHTML;
        
    } catch (error) {
        console.error('❌ Error rendering orders:', error);
        handleError(error, { source: 'render-orders' });
    }
}

// Render pagination
function renderPagination() {
    try {
        const container = document.getElementById('pagination');
        if (!container || totalPages <= 1) return;
        
        let paginationHTML = '<div class="flex justify-center items-center space-x-2 mt-6">';
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `
                <button onclick="changePage(${currentPage - 1})" 
                        class="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Previous
                </button>
            `;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `
                    <span class="px-3 py-2 text-sm bg-gold text-white rounded-lg">
                        ${i}
                    </span>
                `;
            } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationHTML += `
                    <button onclick="changePage(${i})" 
                            class="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += '<span class="px-3 py-2 text-sm text-gray-500">...</span>';
            }
        }
        
        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `
                <button onclick="changePage(${currentPage + 1})" 
                        class="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Next
                </button>
            `;
        }
        
        paginationHTML += '</div>';
        container.innerHTML = paginationHTML;
        
    } catch (error) {
        console.error('❌ Error rendering pagination:', error);
        handleError(error, { source: 'render-pagination' });
    }
}

// Change page
function changePage(page) {
    currentPage = page;
    loadOrders();
}

// Handle tracking update
async function handleTrackingUpdate(e) {
    e.preventDefault();
    // Implementation for tracking update
}

// Handle status update
async function handleStatusUpdate(e) {
    e.preventDefault();
    // Implementation for status update
}

// View order details
function viewOrderDetails(orderId) {
    // Implementation for viewing order details
}

// Edit order
function editOrder(orderId) {
    // Implementation for editing order
}

// Update order status
function updateOrderStatus(orderId) {
    // Implementation for updating order status
}

// Show toast notification
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Handle errors using shared error boundary
function handleError(error, context = {}) {
    if (window.sharedModules && window.sharedModules.hasModule('error')) {
        window.sharedModules.handleError(error, context);
    } else {
        console.error('❌ Error:', error);
        showToast(error.message || 'An error occurred', 'error');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeEnhancedOrderManagement);

// Export functions for global access
window.loadOrders = loadOrders;
window.loadStatistics = loadStatistics;
window.changePage = changePage;
window.viewOrderDetails = viewOrderDetails;
window.editOrder = editOrder;
window.updateOrderStatus = updateOrderStatus;
window.handleTrackingUpdate = handleTrackingUpdate;
window.handleStatusUpdate = handleStatusUpdate;

console.log('🚀 Enhanced Order Management - Optimized Version loaded');
