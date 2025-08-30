// Admin Panel JavaScript
let currentSection = 'dashboard';
let products = [];
let orders = [];
let customers = [];
let discounts = [];
let contactMessages = [];
let analyticsData = null;
let realtimeInterval = null;
let currentEditingProductId = null;
let currentMessageId = null;

// Pagination variables
let productsPagination = {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 5
};

let messagesPagination = {
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
    limit: 10
};

// Helper function to safely extract color information
function getColorDisplay(color) {
    if (!color) return null;
    
    // If color is a string, return as is
    if (typeof color === 'string') return color;
    
    // If color is an object with name property
    if (color.name) return color.name;
    
    // If color is an object with other properties, try to find a displayable value
    if (typeof color === 'object') {
        // Check common color properties
        if (color.value) return color.value;
        if (color.label) return color.label;
        if (color.code) return color.code;
        
        // If it's an array, take the first item
        if (Array.isArray(color) && color.length > 0) {
            return getColorDisplay(color[0]);
        }
    }
    
    return 'N/A';
}

// Check if user is logged in as admin
async function checkAdminAuth() {
    // Check for both admin and customer tokens
    let token = localStorage.getItem('token'); // Admin token
    let user = localStorage.getItem('user'); // Admin user
    
    console.log('🔍 Checking admin authentication...');
    console.log('🔑 Admin token exists:', !!token);
    console.log('👤 Admin user data exists:', !!user);
    
    // Check if customer is also logged in
    const customerToken = localStorage.getItem('customerToken');
    const customerUser = localStorage.getItem('customerUser');
    
    if (customerToken && customerUser) {
        console.log('⚠️ Customer session detected alongside admin session');
        // Show warning to user about concurrent sessions
        showConcurrentSessionWarning();
    }
    
    // If no admin token, check for customer token (might be logged in as customer)
    if (!token) {
        console.log('🔑 Customer token exists:', !!customerToken);
        console.log('👤 Customer user data exists:', !!customerUser);
        
        if (customerToken && customerUser) {
            try {
                const customerData = JSON.parse(customerUser);
                console.log('👤 Customer data:', customerData);
                
                // Check if customer is actually an admin
                if (customerData.role === 'admin') {
                    console.log('✅ Customer is actually admin, using customer token');
                    token = customerToken;
                    user = customerUser;
                } else {
                    console.log('❌ Customer is not admin, showing login button');
                    showToast('Please login as admin to access this panel', 'error');
                    
                    // Show login button
                    const welcomeElement = document.getElementById('admin-welcome');
                    const loginBtn = document.getElementById('login-btn');
                    const logoutBtn = document.getElementById('logout-btn');
                    
                    if (welcomeElement) {
                        welcomeElement.textContent = 'Please login as admin';
                    }
                    
                    if (loginBtn) {
                        loginBtn.style.display = 'inline-block';
                        loginBtn.onclick = () => window.location.href = 'admin-login.html';
                    }
                    
                    if (logoutBtn) logoutBtn.style.display = 'none';
                    
                    return false;
                }
            } catch (error) {
                console.error('❌ Error parsing customer data:', error);
                return false;
            }
        } else {
            console.log('❌ No authentication found');
            showToast('Please login as admin to access this panel', 'error');
            
            // Show login button
            const welcomeElement = document.getElementById('admin-welcome');
            const loginBtn = document.getElementById('login-btn');
            const logoutBtn = document.getElementById('logout-btn');
            
            if (welcomeElement) {
                welcomeElement.textContent = 'Please login as admin';
            }
            
            if (loginBtn) {
                loginBtn.style.display = 'inline-block';
                loginBtn.onclick = () => window.location.href = 'admin-login.html';
            }
            
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            return false;
        }
    }
    
    // If we have admin token, verify it's valid
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            console.log('✅ Admin authentication verified:', userData.email);
            
            // Update UI to show admin is logged in
            const welcomeElement = document.getElementById('admin-welcome');
            const loginBtn = document.getElementById('login-btn');
            const logoutBtn = document.getElementById('logout-btn');
            
            if (welcomeElement) {
                welcomeElement.textContent = `Welcome, ${userData.name || 'Admin'}!`;
            }
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
                logoutBtn.onclick = logout;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error parsing admin user data:', error);
            return false;
        }
    }
    
    return false;
}

// Show warning about concurrent sessions
function showConcurrentSessionWarning() {
    // Check if warning already shown
    if (localStorage.getItem('concurrentSessionWarningShown')) {
        return;
    }
    
    // Create warning modal
    const warningModal = document.createElement('div');
    warningModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    warningModal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <div class="flex items-center mb-4">
                <svg class="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <h3 class="text-lg font-semibold text-gray-900">Session Notice</h3>
            </div>
            <p class="text-gray-600 mb-4">
                You have both customer and admin sessions active. This is now supported and both sessions will be preserved.
            </p>
            <div class="flex justify-end">
                <button onclick="this.closest('.fixed').remove(); localStorage.setItem('concurrentSessionWarningShown', 'true');" 
                        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Got it
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(warningModal);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (warningModal.parentNode) {
            warningModal.remove();
        }
    }, 10000);
}

// Clear conflicting sessions to prevent role conflicts
function clearConflictingSessions() {
    console.log('🧹 Clearing conflicting sessions...');
    
    const adminToken = localStorage.getItem('token');
    const adminUser = localStorage.getItem('user');
    const customerToken = localStorage.getItem('customerToken');
    const customerUser = localStorage.getItem('customerUser');
    
    // If we have both sessions, we need to determine which one is valid
    if (adminToken && adminUser && customerToken && customerUser) {
        try {
            const adminData = JSON.parse(adminUser);
            const customerData = JSON.parse(customerUser);
            
            // If admin session has admin role, use it and clear customer session
            if (adminData.role === 'admin') {
                console.log('✅ Admin session is valid, clearing customer session');
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerUser');
            }
            // If customer session has admin role, move it to admin session
            else if (customerData.role === 'admin') {
                console.log('✅ Customer session has admin role, moving to admin session');
                localStorage.setItem('token', customerToken);
                localStorage.setItem('user', customerUser);
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerUser');
            }
            // If neither has admin role, clear both
            else {
                console.log('❌ Neither session has admin role, clearing both');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('customerToken');
                localStorage.removeItem('customerUser');
            }
        } catch (error) {
            console.error('❌ Error parsing session data, clearing all sessions:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customerUser');
        }
    }
    
    console.log('🧹 Session cleanup completed');
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Admin panel initialized');
    
    // Clear any conflicting sessions first
    clearConflictingSessions();
    
    // Add global functions for debugging
    window.clearAdminCache = () => {
        api.clearCache();
        console.log('🗑️ Admin cache cleared');
    };
    
    window.reloadProducts = () => {
        loadProducts();
    };
    
    // Force refresh admin dashboard data
    async function refreshAdminData() {
        try {
            console.log('🔄 Refreshing admin dashboard data...');
            
            // Clear API cache first
            if (api && typeof api.clearProductCache === 'function') {
                api.clearProductCache();
            }
            
            // Reload products and discounts
            await Promise.all([
                loadProducts(),
                loadDiscounts()
            ]);
            
            console.log('✅ Admin dashboard data refreshed');
        } catch (error) {
            console.error('❌ Error refreshing admin data:', error);
        }
    }
    
    // Check authentication
    if (!(await checkAdminAuth())) return;
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize modals
    initializeModals();
    
    // Load dashboard data
    loadDashboardData();
    
    // Load initial section
    showSection('dashboard');
    
    // Load settings
    loadSettings();
    
    // Load profile
    loadProfile();
    
    // Add settings form listener
    document.getElementById('settings-form').addEventListener('submit', saveSettings);
    
    // Add profile form listeners
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    document.getElementById('password-form').addEventListener('submit', changePassword);
    document.getElementById('change-password-btn').addEventListener('click', togglePasswordSection);
    document.getElementById('cancel-password-btn').addEventListener('click', togglePasswordSection);
    
    // Add discount button listeners
    const addDiscountBtn = document.getElementById('add-discount-btn');
    const bulkDiscountBtn = document.getElementById('bulk-discount-btn');
    
    if (addDiscountBtn) {
        addDiscountBtn.addEventListener('click', () => {
            window.open('/admin-discounts.html', '_blank');
        });
    }
    
    if (bulkDiscountBtn) {
        bulkDiscountBtn.addEventListener('click', () => {
            window.open('/admin-discounts.html', '_blank');
        });
    }
    
    // Add newsletter form listener
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', sendNewsletter);
    }
    
    // Add newsletter search and filter listeners
    const subscriberSearch = document.getElementById('subscriber-search');
    const subscriberStatusFilter = document.getElementById('subscriber-status-filter');
    
    if (subscriberSearch) {
        subscriberSearch.addEventListener('input', debounce(loadNewsletterSubscribers, 500));
    }
    
    if (subscriberStatusFilter) {
        subscriberStatusFilter.addEventListener('change', loadNewsletterSubscribers);
    }
    
    // Add newsletter pagination listeners
    const prevSubscribersPage = document.getElementById('prev-subscribers-page');
    const nextSubscribersPage = document.getElementById('next-subscribers-page');
    
    if (prevSubscribersPage) {
        prevSubscribersPage.addEventListener('click', () => {
            if (currentSubscribersPage > 1) {
                currentSubscribersPage--;
                loadNewsletterSubscribers();
            }
        });
    }
    
    if (nextSubscribersPage) {
        nextSubscribersPage.addEventListener('click', () => {
            currentSubscribersPage++;
            loadNewsletterSubscribers();
        });
    }
    
    // Add analytics listeners
    const analyticsPeriod = document.getElementById('analytics-period');
    const refreshAnalytics = document.getElementById('refresh-analytics');
    const exportAnalytics = document.getElementById('export-analytics');
    
    if (analyticsPeriod) {
        analyticsPeriod.addEventListener('change', loadAnalytics);
    }
    
    if (refreshAnalytics) {
        refreshAnalytics.addEventListener('click', loadAnalytics);
    }
    
    // Initialize contact messages
    initializeContactMessages();
    
    if (exportAnalytics) {
        exportAnalytics.addEventListener('click', exportAnalyticsData);
    }
    
    console.log('✅ Admin panel ready');
});

// Initialize navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'admin-login.html';
    }
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-gold', 'text-white');
        btn.classList.add('hover:bg-gold', 'hover:text-white');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
    
    // Add active class to nav button
    const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-gold', 'text-white');
        activeBtn.classList.remove('hover:bg-gold', 'hover:text-white');
    }
    
    currentSection = sectionName;
    
    // Load section data
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'products':
            loadProducts();
            break;
        case 'discounts':
            loadDiscounts();
            break;
        case 'newsletter':
            loadNewsletterStats();
            loadNewsletterSubscribers();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'customers':
            // Reset loader state and load customers
            hideCustomersLoader();
            loadCustomers();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'messages':
            loadContactMessages();
            loadContactMessagesStats();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Check if dashboard section exists
        const dashboardSection = document.getElementById('dashboard');
        if (!dashboardSection) {
            console.warn('⚠️ Dashboard section not found, skipping dashboard data load');
            return;
        }
        
        // Show loading state only for recent orders, not entire dashboard
        const recentOrdersContainer = document.getElementById('recent-orders');
        if (recentOrdersContainer) {
            recentOrdersContainer.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                    <span class="ml-2 text-gray-600">Loading recent orders...</span>
                </div>
            `;
        }
        
        const response = await api.getDashboardStats();
        
        if (response.success) {
            updateDashboardStats(response.data);
            const recent = (response && response.data && Array.isArray(response.data.recentOrders))
                ? response.data.recentOrders
                : [];
            loadRecentOrders(recent);
        } else {
            console.error('❌ Dashboard API returned error:', response.message);
            showToast('Failed to load dashboard data', 'error');
        }
        
        console.log('✅ Dashboard data loaded');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
        
        // Show error state only for recent orders
        const recentOrdersContainer = document.getElementById('recent-orders');
        if (recentOrdersContainer) {
            recentOrdersContainer.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <p>Failed to load recent orders</p>
                </div>
            `;
        }
    }
}

// Update dashboard stats
function updateDashboardStats(data) {
    try {
        const elements = {
            'total-products': document.getElementById('total-products'),
            'total-orders': document.getElementById('total-orders'),
            'total-revenue': document.getElementById('total-revenue'),
            'total-customers': document.getElementById('total-customers')
        };
        
        // Check if all elements exist
        const missingElements = Object.entries(elements)
            .filter(([id, element]) => !element)
            .map(([id]) => id);
            
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing dashboard elements:', missingElements);
            return;
        }
        
        // Update elements safely
        elements['total-products'].textContent = data.totalProducts || 0;
        elements['total-orders'].textContent = data.totalOrders || 0;
        elements['total-revenue'].textContent = `₹${(data.totalRevenue || 0).toLocaleString()}`;
        elements['total-customers'].textContent = data.totalCustomers || 0;
        
        console.log('✅ Dashboard stats updated successfully');
    } catch (error) {
        console.error('❌ Error updating dashboard stats:', error);
    }
}

// Load recent orders
function loadRecentOrders(recentOrders) {
    const recentOrdersContainer = document.getElementById('recent-orders');
    
    // Check if container exists
    if (!recentOrdersContainer) {
        console.warn('⚠️ Recent orders container not found');
        return;
    }
    
    if (!recentOrders || recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No recent orders</p>
            </div>
        `;
        return;
    }
    
    try {
        recentOrdersContainer.innerHTML = recentOrders.map(order => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-4">
                    <div class="bg-gold text-white p-2 rounded-full">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="font-semibold">${order._id || 'N/A'}</p>
                        <p class="text-sm text-gray-600">${order.user?.name || 'Unknown'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold">₹${order.totalAmount?.toLocaleString() || '0'}</p>
                    <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}">${order.status || 'pending'}</span>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Recent orders loaded successfully');
    } catch (error) {
        console.error('❌ Error rendering recent orders:', error);
        recentOrdersContainer.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <p>Error loading recent orders</p>
            </div>
        `;
    }
}

// Get status color
function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-orange-100 text-orange-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        case 'shipped': return 'bg-purple-100 text-purple-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Load products
async function loadProducts() {
    try {
        console.log('📦 Loading products...');
        
        // Show loading state
        const productsTableBody = document.getElementById('products-table-body');
        if (productsTableBody) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                            <span class="ml-2 text-gray-600">Loading products...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Request smaller, paginated payload to prevent timeouts
        const response = await api.getAdminProducts({ 
            page: productsPagination.currentPage, 
            limit: productsPagination.limit,
            timeoutMs: 45000 // Increased timeout for products
        });
        
        console.log('📦 API Response:', response);
        
        if (response?.success) {
            products.length = 0; // Clear existing products
            products.push(...(response.products || []));
            
            // Update pagination info
            productsPagination = {
                currentPage: response.currentPage || 1,
                totalPages: response.totalPages || 1,
                totalProducts: response.totalProducts || 0,
                limit: productsPagination.limit
            };
            
            console.log('📦 Products array:', products);
            console.log('📊 Pagination info:', productsPagination);
            
            renderProductsTable();
            renderProductsPagination();
            
            console.log(`✅ Loaded ${products.length} products (Page ${productsPagination.currentPage} of ${productsPagination.totalPages})`);
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showToast('Failed to load products', 'error');
        
        // Show error state
        const productsTableBody = document.getElementById('products-table-body');
        if (productsTableBody) {
            productsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-500">
                        <p>Failed to load products. Please try again.</p>
                        <p class="text-sm text-gray-500 mt-2">Error: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Render products table
function renderProductsTable() {
    console.log('🎨 Rendering products table...');
    const tbody = document.getElementById('products-table-body');
    
    if (!tbody) {
        console.error('❌ Products table body not found');
        return;
    }
    
    console.log('📦 Products to render:', products);
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No products found
                </td>
            </tr>
        `;
        return;
    }
    
    try {
        tbody.innerHTML = products.map(product => `
        <tr>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <img src="${product.image || product.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMkMxNS41ODIgMTIgMTIgMTUuNTgyIDEyIDIwQzEyIDI0LjQxOCAxNS41ODIgMjggMjAgMjhDMjQuNDE4IDI4IDI4IDI0LjQxOCAyOCAyMEMyOCAxNS41ODIgMjQuNDE4IDEyIDIwIDEyWk0yMCAyNkMxNy43OTQgMjYgMTYgMjQuMjA2IDE2IDIyQzE2IDE5Ljc5NCAxNy43OTQgMTggMjAgMThDMjIuMjA2IDE4IDI0IDE5Ljc5NCAyNCAyMkMyNCAyNC4yMDYgMjIuMjA2IDI2IDIwIDI2WiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" alt="${product.name}" class="w-10 h-10 rounded-lg object-cover mr-3">
                    <div>
                        <div class="font-semibold">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.material || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">${product.category || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 font-semibold">₹${(product.price || 0).toLocaleString()}</td>
            <td class="px-6 py-4">${product.calculatedStock || calculateTotalStock(product)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${(product.calculatedStock || calculateTotalStock(product)) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${(product.calculatedStock || calculateTotalStock(product)) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button class="edit-product text-blue-600 hover:text-blue-800 text-sm font-medium" data-id="${product._id}">
                        Edit
                    </button>
                    <button class="delete-product text-red-600 hover:text-red-800 text-sm font-medium" data-id="${product._id}">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
            // Add event listeners
        addProductEventListeners();
    } catch (error) {
        console.error('❌ Error rendering products table:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-red-500">
                    <p>Error rendering products table</p>
                    <p class="text-sm text-gray-500 mt-2">${error.message}</p>
                </td>
            </tr>
        `;
    }
}

// Render products pagination
function renderProductsPagination() {
    const productsSection = document.getElementById('products');
    if (!productsSection) return;
    
    // Remove existing pagination
    const existingPagination = productsSection.querySelector('.products-pagination');
    if (existingPagination) {
        existingPagination.remove();
    }
    
    // Only show pagination if there are multiple pages
    if (productsPagination.totalPages <= 1) return;
    
    const paginationHTML = `
        <div class="products-pagination mt-6 flex justify-between items-center">
            <div class="text-sm text-gray-700">
                Showing ${((productsPagination.currentPage - 1) * productsPagination.limit) + 1} to ${Math.min(productsPagination.currentPage * productsPagination.limit, productsPagination.totalProducts)} of ${productsPagination.totalProducts} products
            </div>
            <div class="flex space-x-2">
                <button 
                    onclick="changeProductsPage(${productsPagination.currentPage - 1})" 
                    class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 ${productsPagination.currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${productsPagination.currentPage <= 1 ? 'disabled' : ''}
                >
                    Previous
                </button>
                <span class="px-3 py-1 border border-gray-300 rounded bg-gray-100">
                    Page ${productsPagination.currentPage} of ${productsPagination.totalPages}
                </span>
                <button 
                    onclick="changeProductsPage(${productsPagination.currentPage + 1})" 
                    class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 ${productsPagination.currentPage >= productsPagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${productsPagination.currentPage >= productsPagination.totalPages ? 'disabled' : ''}
                >
                    Next
                </button>
            </div>
        </div>
    `;
    
    // Insert pagination after the table
    const tableContainer = productsSection.querySelector('.bg-white.rounded-xl');
    if (tableContainer) {
        tableContainer.insertAdjacentHTML('afterend', paginationHTML);
    }
}

// Change products page
async function changeProductsPage(page) {
    if (page < 1 || page > productsPagination.totalPages) return;
    
    productsPagination.currentPage = page;
    await loadProducts();
}

// Add product event listeners
function addProductEventListeners() {
    // Edit product buttons
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            editProduct(productId);
        });
    });
    
    // Delete product buttons
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            deleteProduct(productId);
        });
    });
}

// Initialize modals
function initializeModals() {
    // Product modal
    const productModal = document.getElementById('product-modal');
    const addProductBtn = document.getElementById('add-product-btn');
    const closeProductBtn = document.querySelector('.close-modal');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openProductModal());
    }
    
    if (closeProductBtn) {
        closeProductBtn.addEventListener('click', closeProductModal);
    }
    
    // Product form submit
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });
    }
    
    // Newsletter modal
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', sendNewsletter);
    }
    
    // Customer cart modal - add click outside to close functionality
    const customerCartModal = document.getElementById('customer-cart-modal');
    if (customerCartModal) {
        customerCartModal.addEventListener('click', (e) => {
            if (e.target === customerCartModal) {
                closeModal('customer-cart-modal');
            }
        });
        
        // Add ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !customerCartModal.classList.contains('hidden')) {
                closeModal('customer-cart-modal');
            }
        });
    }
    
    // Customer profile modal - add click outside to close functionality
    const customerProfileModal = document.getElementById('customer-profile-modal');
    if (customerProfileModal) {
        customerProfileModal.addEventListener('click', (e) => {
            if (e.target === customerProfileModal) {
                closeModal('customer-profile-modal');
            }
        });
    }
    
    // Edit customer modal - add click outside to close functionality
    const editCustomerModal = document.getElementById('edit-customer-modal');
    if (editCustomerModal) {
        editCustomerModal.addEventListener('click', (e) => {
            if (e.target === editCustomerModal) {
                closeModal('edit-customer-modal');
            }
        });
    }
    
    // Customer orders modal - add click outside to close functionality
    const customerOrdersModal = document.getElementById('customer-orders-modal');
    if (customerOrdersModal) {
        customerOrdersModal.addEventListener('click', (e) => {
            if (e.target === customerOrdersModal) {
                closeModal('customer-orders-modal');
            }
        });
    }
    
    // Customer wishlist modal - add click outside to close functionality
    const customerWishlistModal = document.getElementById('customer-wishlist-modal');
    if (customerWishlistModal) {
        customerWishlistModal.addEventListener('click', (e) => {
            if (e.target === customerWishlistModal) {
                closeModal('customer-wishlist-modal');
            }
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Close all modals
function closeAllModals() {
    const modals = document.querySelectorAll('.fixed');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
    currentEditingProductId = null;
}

// Open product modal
function openProductModal(productId = null) {
    currentEditingProductId = productId;
    
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');
    
    // Show modal first
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (productId) {
        title.textContent = 'Edit Product';
        // Load product data and fill form after modal is visible
        setTimeout(() => {
            fillProductForm(productId);
        }, 100);
        

    } else {
        title.textContent = 'Add Product';
        form.reset();
        // Clear any existing images and color variants
        clearProductForm();
    }
    
    // Initialize new functionality
    initializeImageUpload();
    initializeColorVariants();
    

}

// Clear product form
function clearProductForm() {
    // Clear images
    const imageContainer = document.querySelector('#image-upload-container .grid');
    imageContainer.innerHTML = `
        <div class="image-upload-item border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input type="file" class="image-input hidden" accept="image/*">
            <div class="image-preview-container">
                <img class="image-preview w-full h-32 object-cover rounded-lg hidden" alt="Preview">
                <div class="image-placeholder">
                    <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <p class="text-sm text-gray-500">Add Image</p>
                </div>
            </div>
            <div class="mt-2">
                <label class="flex items-center text-sm">
                    <input type="radio" name="primaryImage" class="mr-1">
                    <span>Primary</span>
                </label>
            </div>
            <button type="button" class="remove-image text-red-500 text-sm mt-1 hidden">Remove</button>
        </div>
    `;
    
    // Clear color variants
    const colorContainer = document.getElementById('color-variants-container');
    colorContainer.innerHTML = `
        <div class="color-variant-item border border-gray-300 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Color Name</label>
                    <input type="text" name="colorName[]" placeholder="e.g., Black" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Color Code</label>
                    <input type="text" name="colorCode[]" placeholder="e.g., #000000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input type="number" name="colorStock[]" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
                </div>
                <div class="flex items-end">
                    <label class="flex items-center">
                        <input type="checkbox" name="colorAvailable[]" checked class="mr-2">
                        <span class="text-sm text-gray-700">Available</span>
                    </label>
                </div>
            </div>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Color Images (optional)</label>
                <input type="file" name="colorImages[]" multiple accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
            </div>
        </div>
    `;
}

// Close product modal
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentEditingProductId = null;
}

// Fill product form
async function fillProductForm(productId) {
    let product = null;
    try {
        // Fetch the full product to ensure all images are available (admin list only returns first image)
        const response = await api.getProduct(productId + '?_t=' + Date.now());
        if (response && response.product) {
            product = response.product;
        }
    } catch (e) {
        console.warn('⚠️ Could not fetch full product by ID, falling back to list data:', e);
    }
    if (!product) {
        product = products.find(p => p._id === productId);
    }
    if (!product) {
        console.error('❌ Product not found for ID:', productId);
        return;
    }
    
    console.log('📦 Filling form with product data:', product);
    
    const form = document.getElementById('product-form');
    if (!form) {
        console.error('❌ Product form not found');
        return;
    }
    
    // Ensure form is visible and accessible
    if (form.offsetParent === null) {
        console.warn('⚠️ Form is not visible, waiting for it to be rendered...');
        setTimeout(() => fillProductForm(productId), 200);
        return;
    }
    
    // Fill basic information
    form.querySelector('input[name="name"]').value = product.name || '';
    form.querySelector('input[name="price"]').value = product.price || '';
    form.querySelector('select[name="category"]').value = product.category || '';
    form.querySelector('select[name="type"]').value = product.type || '';
    form.querySelector('input[name="material"]').value = product.material || '';
    form.querySelector('input[name="size"]').value = product.size || '';
    
    // Fill description field
    const descriptionField = form.querySelector('textarea[name="description"]');
    if (descriptionField) {
        descriptionField.value = product.description || '';
    } else {
        console.error('❌ Description field not found in form');
    }
    
    // Fill specifications
    if (product.specifications) {
        console.log('📋 Loading specifications:', product.specifications);
        
        // Handle dimensions - could be string or object with display property
        let dimensionsValue = '';
        if (product.specifications.dimensions) {
            if (typeof product.specifications.dimensions === 'string') {
                dimensionsValue = product.specifications.dimensions;
            } else if (product.specifications.dimensions.display) {
                dimensionsValue = product.specifications.dimensions.display;
            } else {
                dimensionsValue = product.specifications.dimensions;
            }
        }
        
        form.querySelector('input[name="dimensions"]').value = dimensionsValue;
        form.querySelector('input[name="weight"]').value = product.specifications.weight || '';
        form.querySelector('input[name="capacity"]').value = product.specifications.capacity || '';
        form.querySelector('select[name="closure"]').value = product.specifications.closure || '';
        form.querySelector('input[name="pockets"]').value = product.specifications.pockets || '';
        form.querySelector('input[name="care"]').value = product.specifications.care || '';
        
        // Fill features
        if (product.specifications.features) {
            if (Array.isArray(product.specifications.features)) {
                form.querySelector('textarea[name="features"]').value = product.specifications.features.join('\n');
            } else {
                form.querySelector('textarea[name="features"]').value = product.specifications.features;
            }
        }
        
        // Fill checkboxes
        form.querySelector('input[name="waterResistant"]').checked = product.specifications.waterResistant || false;
        form.querySelector('input[name="laptopCompartment"]').checked = product.specifications.laptopCompartment || false;
        form.querySelector('input[name="usbPort"]').checked = product.specifications.usbPort || false;
    } else {
        console.log('⚠️ No specifications found for product');
        // Clear specifications fields
        form.querySelector('input[name="dimensions"]').value = '';
        form.querySelector('input[name="weight"]').value = '';
        form.querySelector('input[name="capacity"]').value = '';
        form.querySelector('select[name="closure"]').value = '';
        form.querySelector('input[name="pockets"]').value = '';
        form.querySelector('input[name="care"]').value = '';
        form.querySelector('textarea[name="features"]').value = '';
        form.querySelector('input[name="waterResistant"]').checked = false;
        form.querySelector('input[name="laptopCompartment"]').checked = false;
        form.querySelector('input[name="usbPort"]').checked = false;
    }
    
    // Fill product flags
    form.querySelector('input[name="featured"]').checked = product.featured || false;
    form.querySelector('input[name="bestSeller"]').checked = product.bestSeller || false;
    form.querySelector('input[name="newArrival"]').checked = product.newArrival || false;
    
    // Fill images
    fillProductImages(product.images || []);
    
    // Fill color variants
    fillColorVariants(product.colorVariants || []);
    

    
    console.log('✅ Product form filled successfully');
}

// Fill product images
function fillProductImages(images) {
    console.log('📸 Filling product images:', images);
    const imageContainer = document.querySelector('#image-upload-container .grid');
    
    if (!imageContainer) {
        console.error('❌ Image container grid not found!');
        return;
    }
    
    imageContainer.innerHTML = '';
    
    // Ensure images is an array
    if (!Array.isArray(images)) {
        console.warn('⚠️ Images is not an array, converting to empty array');
        images = [];
    }
    
    console.log(`📸 Processing ${images.length} images`);
    
    if (!images || images.length === 0) {
        console.log('📸 No images to fill, adding empty image upload item');
        // Add empty image upload item
        const emptyItem = document.createElement('div');
        emptyItem.className = 'image-upload-item border-2 border-dashed border-gray-300 rounded-lg p-4 text-center';
        emptyItem.innerHTML = `
            <input type="file" class="image-input hidden" accept="image/*">
            <div class="image-preview-container">
                <img class="image-preview w-full h-32 object-cover rounded-lg hidden" alt="Preview">
                <div class="image-placeholder">
                    <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <p class="text-sm text-gray-500">Add Image</p>
                </div>
            </div>
            <div class="mt-2">
                <label class="flex items-center text-sm">
                    <input type="radio" name="primaryImage" class="mr-1">
                    <span>Primary</span>
                </label>
            </div>
            <button type="button" class="remove-image text-red-500 text-sm mt-1 hidden">Remove</button>
        `;
        imageContainer.appendChild(emptyItem);
        initializeImageUploadItem(emptyItem);
        return;
    }
    
    images.forEach((image, index) => {
        console.log(`📸 Creating image item ${index}:`, {
            public_id: image.public_id,
            alt: image.alt,
            isPrimary: image.isPrimary,
            urlLength: image.url ? image.url.length : 0,
            urlPreview: image.url ? image.url.substring(0, 50) + '...' : 'NO URL'
        });
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-upload-item border-2 border-dashed border-gray-300 rounded-lg p-4 text-center';
        imageItem.innerHTML = `
            <input type="file" class="image-input hidden" accept="image/*" data-existing-image='${JSON.stringify(image)}'>
            <div class="image-preview-container">
                <img class="image-preview w-full h-32 object-cover rounded-lg" src="${image.url}" alt="${image.alt || 'Product Image'}">
                <div class="image-placeholder hidden">
                    <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <p class="text-sm text-gray-500">Add Image</p>
                </div>
            </div>
            <div class="mt-2">
                <label class="flex items-center text-sm">
                    <input type="radio" name="primaryImage" value="${index}" class="mr-1" ${image.isPrimary ? 'checked' : ''}>
                    <span>Primary</span>
                </label>
            </div>
            <button type="button" class="remove-image text-red-500 text-sm mt-1">Remove</button>
        `;
        
        imageContainer.appendChild(imageItem);
        initializeImageUploadItem(imageItem);
        console.log(`📸 Image item ${index} added to DOM`);
    });
    
    console.log(`📸 Created ${images.length} image items`);
    
    // Debug: Check what's actually in the DOM
    const actualImageItems = document.querySelectorAll('#image-upload-container .image-upload-item');
    console.log(`🔍 Debug: Found ${actualImageItems.length} image items in DOM`);
    actualImageItems.forEach((item, index) => {
        const input = item.querySelector('.image-input');
        const hasExistingData = input && input.dataset.existingImage;
        console.log(`  DOM Item ${index}: ${hasExistingData ? 'Has existing data' : 'No existing data'}`);
    });
    
    // Ensure the add image button is visible
    const addImageBtn = document.getElementById('add-image-btn');
    if (addImageBtn) {
        addImageBtn.style.display = 'block';
    }
}

// Fill color variants
function fillColorVariants(colorVariants) {
    const colorContainer = document.getElementById('color-variants-container');
    colorContainer.innerHTML = '';
    
    console.log('🎨 Filling color variants:', colorVariants);
    
    // Ensure colorVariants is an array
    if (!Array.isArray(colorVariants)) {
        console.warn('⚠️ colorVariants is not an array, converting to empty array');
        colorVariants = [];
    }
    
    if (colorVariants.length === 0) {
        console.log('🎨 No color variants found, adding default empty variant');
        // Add default empty color variant
        addColorVariant();
        return;
    }
    
    colorVariants.forEach((variant, index) => {
        console.log(`🎨 Loading color variant ${index}:`, variant);
        
        // Ensure variant has required properties
        const safeVariant = {
            name: variant.name || '',
            code: variant.code || '#000000',
            stock: parseInt(variant.stock) || 0,
            isAvailable: variant.isAvailable !== false, // Default to true
            images: variant.images || []
        };
        
        const colorItem = document.createElement('div');
        colorItem.className = 'color-variant-item border border-gray-300 rounded-lg p-4 mb-4';
        colorItem.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Color Name</label>
                    <input type="text" name="colorName[]" value="${safeVariant.name}" placeholder="e.g., Black" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Color Code</label>
                    <input type="text" name="colorCode[]" value="${safeVariant.code}" placeholder="e.g., #000000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input type="number" name="colorStock[]" value="${safeVariant.stock}" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
                </div>
                <div class="flex items-end">
                    <label class="flex items-center">
                        <input type="checkbox" name="colorAvailable[]" value="${index}" ${safeVariant.isAvailable ? 'checked' : ''} class="mr-2">
                        <span class="text-sm text-gray-700">Available</span>
                    </label>
                    <button type="button" class="remove-color text-red-500 text-sm ml-2">Remove</button>
                </div>
            </div>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Color Images (optional)</label>
                <input type="file" name="colorImages[]" multiple accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
            </div>
        `;
        
        colorContainer.appendChild(colorItem);
        initializeColorVariantItem(colorItem);
    });
    
    console.log(`✅ Loaded ${colorVariants.length} color variants`);
}

// Save product
async function saveProduct() {
    try {
        const form = document.getElementById('product-form');
        const formData = new FormData(form);
        
        // Process multiple images
        const images = [];
        const imageInputs = document.querySelectorAll('.image-input');
        // Determine which radio is selected for primary image
        const selectedPrimaryRadio = document.querySelector('input[name="primaryImage"]:checked');
        
        console.log('🔍 Found image inputs:', imageInputs.length);
        
        // Debug: Log all image inputs
        imageInputs.forEach((input, index) => {
            console.log(`  Input ${index}:`, {
                hasFiles: input.files && input.files.length > 0,
                hasExistingData: !!input.dataset.existingImage,
                fileCount: input.files ? input.files.length : 0,
                existingDataLength: input.dataset.existingImage ? input.dataset.existingImage.length : 0
            });
        });
        
        for (let index = 0; index < imageInputs.length; index++) {
            const input = imageInputs[index];
            const imageItem = input.closest('.image-upload-item');
            // Skip items explicitly removed by user
            if (imageItem && imageItem.dataset.removed === 'true') {
                continue;
            }
            
            if (input.files && input.files[0]) {
                // New file uploaded
                const file = input.files[0];
                console.log(`📸 Input ${index} has new file:`, file.name, file.size);
                
                // Determine primary by checking if this item's radio is the selected one
                const isPrimary = selectedPrimaryRadio ? (imageItem && imageItem.contains(selectedPrimaryRadio)) : (index === 0);
                
                console.log(`📸 Processing new image ${index}: Primary = ${isPrimary}`);
                
                // Convert file to base64 data URL instead of blob URL
                const imageUrl = await convertFileToDataURL(file);
                
                // Check image size and compress if needed
                const sizeInBytes = Math.ceil((imageUrl.length * 3) / 4);
                const sizeInMB = sizeInBytes / (1024 * 1024);
                
                if (sizeInMB > 1) {
                    console.warn(`⚠️ Large image detected: ${sizeInMB.toFixed(2)}MB. Compressing to prevent server errors.`);
                    // For very large images, we'll reduce quality significantly
                    const compressedUrl = await compressImageQuality(imageUrl, 0.5);
                    images.push({
                        public_id: `admin-upload-${Date.now()}-${index}`,
                        url: compressedUrl,
                        alt: `Product Image ${index + 1}`,
                        isPrimary: isPrimary
                    });
                } else if (sizeInMB > 0.5) {
                    console.log(`📸 Moderately large image: ${sizeInMB.toFixed(2)}MB. Compressing slightly.`);
                    // For moderately large images, reduce quality slightly
                    const compressedUrl = await compressImageQuality(imageUrl, 0.7);
                    images.push({
                        public_id: `admin-upload-${Date.now()}-${index}`,
                        url: compressedUrl,
                        alt: `Product Image ${index + 1}`,
                        isPrimary: isPrimary
                    });
                } else {
                    images.push({
                        public_id: `admin-upload-${Date.now()}-${index}`,
                        url: imageUrl,
                        alt: `Product Image ${index + 1}`,
                        isPrimary: isPrimary
                    });
                }
            } else if (input.dataset.existingImage) {
                // Existing image (from edit mode)
                console.log(`📸 Input ${index} has existing image data:`, input.dataset.existingImage ? 'YES' : 'NO');
                
                // If the item was marked removed or dataset cleared, skip
                if (imageItem && imageItem.dataset.removed === 'true') {
                    continue;
                }
                const isPrimary = selectedPrimaryRadio ? (imageItem && imageItem.contains(selectedPrimaryRadio)) : (index === 0);
                const existingImage = JSON.parse(input.dataset.existingImage);
                
                console.log(`📸 Processing existing image ${index}: Primary = ${isPrimary}, URL = ${existingImage.url.substring(0, 50)}...`);
                
                images.push({
                    public_id: existingImage.public_id,
                    url: existingImage.url,
                    alt: existingImage.alt || `Product Image ${index + 1}`,
                    isPrimary: isPrimary
                });
            } else {
                console.log(`📸 Input ${index} has no file or existing image data`);
            }
        }
        
        console.log('📸 Final images array:', images);

        // Ensure exactly one primary image is set
        if (images.length > 0) {
            let primaryCount = images.filter(img => img.isPrimary).length;
            if (primaryCount === 0) {
                images[0].isPrimary = true;
            } else if (primaryCount > 1) {
                // Keep the one corresponding to selectedPrimaryRadio if available
                const chosenIndex = selectedPrimaryRadio 
                    ? images.findIndex((_, idx) => {
                        const item = imageInputs[idx]?.closest('.image-upload-item');
                        return item && item.contains(selectedPrimaryRadio);
                    })
                    : 0;
                images.forEach((img, i) => { img.isPrimary = i === (chosenIndex >= 0 ? chosenIndex : 0); });
            }
        }

        // Process color variants
        const colorVariants = [];
        const colorNames = formData.getAll('colorName[]');
        const colorCodes = formData.getAll('colorCode[]');
        const colorStocks = formData.getAll('colorStock[]');
        const colorAvailable = formData.getAll('colorAvailable[]');
        
        console.log('🎨 Processing color variants:', {
            names: colorNames,
            codes: colorCodes,
            stocks: colorStocks,
            available: colorAvailable
        });
        
        colorNames.forEach((name, index) => {
            if (name.trim()) {
                // Check if this color variant is marked as available
                // Look for checkbox with value matching the index
                const checkbox = document.querySelector(`input[name="colorAvailable[]"][value="${index}"]`);
                const isAvailable = checkbox ? checkbox.checked : true; // Default to true if checkbox not found
                
                console.log(`🎨 Color ${index}: ${name} - Available: ${isAvailable} (checkbox: ${checkbox?.checked})`);
                
                colorVariants.push({
                    name: name.trim(),
                    code: colorCodes[index] || '#000000',
                    stock: parseInt(colorStocks[index]) || 0,
                    isAvailable: isAvailable,
                    images: [] // Color-specific images can be added here
                });
            }
        });

        // Process specifications
        const features = formData.get('features') ? 
            formData.get('features').split('\n').filter(f => f.trim()) : [];
        
        const specifications = {
            dimensions: {
                display: formData.get('dimensions') || '',
                length: '',
                width: '',
                height: ''
            },
            weight: formData.get('weight') || '',
            capacity: formData.get('capacity') || '',
            features: features,
            care: formData.get('care') || 'Wipe with damp cloth',
            warranty: '1 year',
            closure: formData.get('closure') || '',
            pockets: formData.get('pockets') || 'Multiple compartments',
            waterResistant: formData.get('waterResistant') === 'on',
            laptopCompartment: formData.get('laptopCompartment') === 'on',
            usbPort: formData.get('usbPort') === 'on'
        };


        
        const productData = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            category: formData.get('category'),
            type: formData.get('type'),
            material: formData.get('material'),
            size: formData.get('size'),
            description: formData.get('description') || form.querySelector('textarea[name="description"]')?.value || '',
            // If no images provided, don't send a placeholder; server will keep existing images
            images: images.length > 0 ? images : undefined,
            colorVariants: colorVariants,
            colors: colorVariants.map(c => c.name), // Legacy support
            stock: colorVariants.reduce((total, variant) => total + variant.stock, 0),
            specifications: specifications,
            featured: formData.get('featured') === 'on',
            bestSeller: formData.get('bestSeller') === 'on',
            newArrival: formData.get('newArrival') === 'on'
        };
        
        // Validate required fields
        if (!productData.name || !productData.price || !productData.category || 
            !productData.type || !productData.material || !productData.size || !productData.description) {
            throw new Error('Please fill all required fields: Name, Price, Category, Type, Material, Size, Description');
        }
        
        if (productData.price <= 0) {
            throw new Error('Price must be greater than 0');
        }
        
        // Validate color variants
        if (productData.colorVariants && productData.colorVariants.length > 0) {
            for (let i = 0; i < productData.colorVariants.length; i++) {
                const variant = productData.colorVariants[i];
                if (!variant.name || variant.name.trim() === '') {
                    throw new Error(`Color variant ${i + 1} must have a name`);
                }
                if (variant.stock < 0) {
                    throw new Error(`Color variant ${i + 1} stock cannot be negative`);
                }
            }
        }
        
        console.log('💾 Saving product:', productData);
        
        // Optimize images - compress and reduce size
        const optimizeImages = (images) => {
            if (!images || !Array.isArray(images)) return [];
            
            return images.map(img => {
                // If image is a data URL, try to compress it
                if (img.url && img.url.startsWith('data:image/')) {
                    // For data URLs, we'll keep them as is but log the size
                    const sizeInBytes = Math.ceil((img.url.length * 3) / 4);
                    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
                    console.log(`📸 Image size: ${sizeInMB}MB`);
                    
                    // Warn if image is too large and reduce quality
                    if (sizeInMB > 1) {
                        console.warn(`⚠️ Large image detected: ${sizeInMB}MB. Reducing quality to prevent server errors.`);
                        // Reduce quality to prevent 502 errors
                        return {
                            public_id: img.public_id,
                            url: img.url.replace(/q=\d+/, 'q=50'), // Reduce quality to 50%
                            alt: img.alt || 'Product Image',
                            isPrimary: img.isPrimary || false
                        };
                    }
                    
                    // For moderately large images, reduce quality slightly
                    if (sizeInMB > 0.5) {
                        console.log(`📸 Moderately large image: ${sizeInMB}MB. Reducing quality slightly.`);
                        return {
                            public_id: img.public_id,
                            url: img.url.replace(/q=\d+/, 'q=70'), // Reduce quality to 70%
                            alt: img.alt || 'Product Image',
                            isPrimary: img.isPrimary || false
                        };
                    }
                }
                
                return {
                    public_id: img.public_id,
                    url: img.url,
                    alt: img.alt || 'Product Image',
                    isPrimary: img.isPrimary || false
                };
            });
        };
        
        // Optimize product data to reduce payload size
        const optimizedProductData = {
            name: productData.name,
            price: productData.price,
            category: productData.category,
            type: productData.type,
            material: productData.material,
            size: productData.size,
            description: productData.description,
            colorVariants: productData.colorVariants,
            // Ensure stock is explicitly sent to backend
            stock: productData.stock,
            specifications: productData.specifications,
            featured: productData.featured || false,
            bestSeller: productData.bestSeller || false,
            newArrival: productData.newArrival || false,
            discount: productData.discount || 0,
            discountType: productData.discountType || 'percentage',
            discountAmount: productData.discountAmount || 0,
            discountStartDate: productData.discountStartDate || null,
            discountEndDate: productData.discountEndDate || null,
            isDiscountActive: productData.isDiscountActive || false,
            originalPrice: productData.originalPrice || productData.price,
            tags: productData.tags || [],
            // Optimize images
            images: optimizeImages(productData.images)
        };
        
        console.log('📊 Optimized data size:', JSON.stringify(optimizedProductData).length, 'bytes');
        
        // Show loading state on save button (with reliable fallback)
        let saveBtn = document.getElementById('save-product-btn');
        let originalText = 'Save Product';
        
        if (!saveBtn) {
            // Fallback: get the submit button inside the product form
            saveBtn = form?.querySelector('button[type="submit"]') || null;
        }

        if (saveBtn) {
            originalText = saveBtn.textContent || 'Save Product';
            saveBtn.textContent = '💾 Saving...';
            saveBtn.disabled = true;
        } else {
            console.warn('⚠️ Save button not found, continuing without loading state');
        }
        
        try {
            let response;
            if (currentEditingProductId) {
                // Update existing product
                response = await api.updateProduct(currentEditingProductId, optimizedProductData);
                showToast('Product updated successfully!', 'success');
            } else {
                // Create new product
                response = await api.createProduct(optimizedProductData);
                showToast('Product created successfully!', 'success');
            }
            
            console.log('✅ Product operation successful:', response);
            console.log('📸 Response data:', response);
            
            // Check if the response contains the updated product with images
            if (response.product && response.product.images) {
                console.log('📸 Updated product images count:', response.product.images.length);
                response.product.images.forEach((img, index) => {
                    console.log(`  Image ${index + 1}: ${img.public_id} (Primary: ${img.isPrimary})`);
                });
            }
            
            closeProductModal();
            
            // Reload products
            loadProducts();
            
            // Force reload the form if we're editing
            if (currentEditingProductId) {
                console.log('🔄 Force reloading form for edited product...');
                setTimeout(() => {
                    handleImageUpdate(currentEditingProductId);
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Error saving product:', error);
            
            // Handle specific error types
            if (error.message && error.message.includes('502')) {
                console.error('🚨 502 Bad Gateway Error - Server overloaded');
                showToast('Server is temporarily overloaded. Please try again in a moment or reduce image size.', 'error');
                
                // Suggest reducing image size
                const largeImages = productData.images.filter(img => {
                    if (img.url && img.url.startsWith('data:image/')) {
                        const sizeInBytes = Math.ceil((img.url.length * 3) / 4);
                        const sizeInMB = sizeInBytes / (1024 * 1024);
                        return sizeInMB > 0.5;
                    }
                    return false;
                });
                
                if (largeImages.length > 0) {
                    console.warn(`⚠️ Large images detected: ${largeImages.length} images over 0.5MB`);
                    showToast(`Large images detected. Consider reducing image size to prevent server errors.`, 'warning');
                }
            } else {
                // Show generic error message
                showToast('Failed to save product. Please try again.', 'error');
            }
            let errorMessage = 'Error saving product';
            if (error.message.includes('PayloadTooLargeError')) {
                errorMessage = 'Product data is too large. Please reduce image sizes or remove some images.';
            } else if (error.message.includes('ValidationError')) {
                errorMessage = 'Please check all required fields are filled correctly.';
            } else if (error.message.includes('Internal server error')) {
                errorMessage = 'Server error. Please try again or contact support.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(`Error: ${errorMessage}`, 'error');
            
            // Don't close modal on error, let user fix the issue
            console.log('❌ Product save failed, keeping modal open for user to fix');
        } finally {
            // Restore button state with null checks
            if (saveBtn) {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('❌ Error saving product:', error);
        
        // Show detailed error message
        let errorMessage = 'Failed to save product';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response && error.response.message) {
            errorMessage = error.response.message;
        } else if (error.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.join(', ');
        }
        
        showToast(`Error: ${errorMessage}`, 'error');
        
        // Don't close modal on error, let user fix the issue
        console.log('❌ Product save failed, keeping modal open for user to fix');
    }
}

// Edit product
function editProduct(productId) {
    console.log('✏️ Editing product:', productId);
    openProductModal(productId);
}

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            console.log('🗑️ Deleting product:', productId);
            
            await api.deleteProduct(productId);
            showToast('Product deleted successfully!', 'success');
            
            // Reload products
            loadProducts();
        } catch (error) {
            console.error('❌ Error deleting product:', error);
            showToast('Failed to delete product', 'error');
        }
    }
}

// Load orders
async function loadOrders(page = 1, limit = 50) {
    try {
        console.log('🛒 Loading orders...', { page, limit });
        
        // Show loading indicator
        const ordersTable = document.getElementById('orders-table');
        if (ordersTable) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8">
                        <div class="flex items-center justify-center">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                            <span class="ml-2 text-gray-600">Loading orders...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        const response = await api.getAdminOrders(`?page=${page}&limit=${limit}`, { 
            timeoutMs: 60000 // Increased timeout for orders
        });
        
        if (response?.success) {
            orders = response.orders || [];
            
            // Store pagination info
            window.ordersPagination = {
                currentPage: response.currentPage || 1,
                totalPages: response.totalPages || 1,
                totalOrders: response.totalOrders || 0
            };
            
            renderOrdersTable();
            renderOrdersPagination();
            
            console.log(`✅ Loaded ${orders.length} orders (Page ${page} of ${response.totalPages || 1})`);
        } else {
            throw new Error('Failed to load orders');
        }
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showToast('Failed to load orders', 'error');
        orders = [];
        
        // Show error state
        const ordersTable = document.getElementById('orders-table');
        if (ordersTable) {
            ordersTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-red-500">
                        <p>Failed to load orders. Please try again.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Render orders table
function renderOrdersTable() {
    const ordersTable = document.getElementById('orders-table');
    
    if (orders.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-charcoal/60">No orders found</td></tr>';
        return;
    }
    
    // Calculate summary
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    
    // Add summary row
    const summaryRow = `
        <tr class="bg-gold/10">
            <td colspan="7" class="px-4 py-3">
                <div class="grid grid-cols-4 gap-4 text-sm">
                    <div>
                        <span class="text-charcoal/60">Total Orders:</span>
                        <span class="font-semibold text-charcoal ml-1">${totalOrders}</span>
                    </div>
                    <div>
                        <span class="text-charcoal/60">Total Amount:</span>
                        <span class="font-semibold text-gold ml-1">₹${totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                        <span class="text-charcoal/60">Pending:</span>
                        <span class="font-semibold text-orange-500 ml-1">${pendingOrders}</span>
                    </div>
                    <div>
                        <span class="text-charcoal/60">Delivered:</span>
                        <span class="font-semibold text-green-500 ml-1">${deliveredOrders}</span>
                    </div>
                </div>
            </td>
        </tr>
    `;
    
    ordersTable.innerHTML = summaryRow + orders.map(order => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="px-4 py-3">
                <div>
                    <p class="font-semibold text-charcoal">#${order._id.slice(-8)}</p>
                    <p class="text-sm text-charcoal/60">${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
            </td>
            <td class="px-4 py-3">
                <div>
                    <p class="font-medium text-charcoal">${order.user?.name || 'N/A'}</p>
                    <p class="text-sm text-charcoal/60">${order.user?.email || 'N/A'}</p>
                </div>
            </td>
            <td class="px-4 py-3">
                <div>
                    <p class="font-semibold text-gold">₹${(order.totalAmount || 0).toLocaleString()}</p>
                    <p class="text-sm text-charcoal/60">${order.orderItems?.length || 0} items</p>
                    <!-- Show first few items with colors -->
                    ${order.orderItems?.slice(0, 2).map(item => `
                        <div class="text-xs text-charcoal/70 mt-1">
                            ${item.name?.slice(0, 20)}${item.name?.length > 20 ? '...' : ''}
                            ${item.color ? ` (${getColorDisplay(item.color)})` : ''}
                            ${item.quantity ? ` ×${item.quantity}` : ''}
                        </div>
                    `).join('') || ''}
                    ${order.orderItems?.length > 2 ? `<div class="text-xs text-charcoal/50">+${order.orderItems.length - 2} more...</div>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}">${order.status.toUpperCase()}</span>
            </td>
            <td class="px-4 py-3">
                <p class="text-sm text-charcoal/70">
                    ${order.shippingInfo ? 
                        `${order.shippingInfo.street || 'N/A'}<br>${order.shippingInfo.city || ''}, ${order.shippingInfo.state || ''}` : 
                        'Address not available'
                    }
                </p>
            </td>
            <td class="px-4 py-3">
                <p class="text-sm text-charcoal/60">
                    ${order.paymentInfo?.id || 'N/A'}<br>
                    <span class="text-xs">${order.paymentInfo?.status || 'N/A'}</span>
                </p>
            </td>
            <td class="px-4 py-3">
                <div class="flex gap-2">
                    <button onclick="viewOrderDetails('${order._id}')" class="bg-gold text-white px-3 py-1 rounded text-sm hover:bg-charcoal transition-colors">
                        View Details
                    </button>
                    <select onchange="updateOrderStatus('${order._id}', this.value)" class="border border-gray-300 rounded px-2 py-1 text-sm" data-original-value="${order.status}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render orders pagination
function renderOrdersPagination() {
    const paginationContainer = document.getElementById('orders-pagination');
    if (!paginationContainer || !window.ordersPagination) return;
    
    const { currentPage, totalPages, totalOrders } = window.ordersPagination;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div class="flex items-center text-sm text-gray-700">
                <span>Showing ${((currentPage - 1) * 50) + 1} to ${Math.min(currentPage * 50, totalOrders)} of ${totalOrders} orders</span>
            </div>
            <div class="flex items-center space-x-2">
    `;
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="loadOrders(${currentPage - 1})" 
                    class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                Previous
            </button>
        `;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <span class="px-3 py-1 text-sm bg-gold text-white rounded">${i}</span>
            `;
        } else {
            paginationHTML += `
                <button onclick="loadOrders(${i})" 
                        class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                    ${i}
                </button>
            `;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="loadOrders(${currentPage + 1})" 
                    class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                Next
            </button>
        `;
    }
    
    paginationHTML += `
            </div>
        </div>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Add order status change listeners
function addOrderStatusListeners() {
    document.querySelectorAll('.order-status').forEach(select => {
        select.addEventListener('change', async function() {
            const orderId = this.dataset.orderId;
            const newStatus = this.value;
            const currentStatus = this.dataset.currentStatus;
            
            if (newStatus === currentStatus) return;
            
            try {
                await api.updateOrderStatus(orderId, { status: newStatus });
                this.dataset.currentStatus = newStatus;
                showToast(`Order status updated to ${newStatus}`, 'success');
            } catch (error) {
                console.error('❌ Error updating order status:', error);
                showToast('Failed to update order status', 'error');
                // Reset to previous value
                this.value = currentStatus;
            }
        });
    });
}

// Show customers loader
function showCustomersLoader() {
    const loader = document.getElementById('customers-loader');
    const table = document.getElementById('customers-table');
    
    if (loader) loader.classList.remove('hidden');
    if (table) table.classList.add('hidden');
}

// Hide customers loader
function hideCustomersLoader() {
    const loader = document.getElementById('customers-loader');
    const table = document.getElementById('customers-table');
    
    if (loader) loader.classList.add('hidden');
    if (table) table.classList.remove('hidden');
}

// Load customers
async function loadCustomers() {
    try {
        console.log('👥 Loading customers...');
        
        // Show loader
        showCustomersLoader();
        
        const response = await api.getAdminCustomers();
        customers = response.customers || [];
        
        console.log('📋 Raw customers data:', customers);
        
        // Filter out invalid customers
        customers = customers.filter(customer => {
            if (!customer._id || customer._id === 'undefined' || customer._id === 'null') {
                console.error('❌ Invalid customer ID in data:', customer);
                return false;
            }
            return true;
        });
        
        // Log each customer's wishlist count
        customers.forEach(customer => {
            console.log(`👤 Customer: ${customer.name} (${customer._id}) - Wishlist: ${customer.wishlist?.length || 0} items`);
        });
        
        renderCustomersTable();
        
        console.log(`✅ Loaded ${customers.length} customers`);
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        showToast('Failed to load customers', 'error');
        customers = [];
        renderCustomersTable();
    } finally {
        // Hide loader
        hideCustomersLoader();
    }
}

// Render customers table
function renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');
    
    if (!tbody) {
        console.error('❌ Customers table body not found');
        return;
    }
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    No customers found
                </td>
            </tr>
        `;
        return;
    }
    
    // Filter out invalid customers before rendering
    const validCustomers = customers.filter(customer => {
        const customerId = customer._id;
        if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
            console.error('❌ Invalid customer ID in data:', customer);
            return false;
        }
        return true;
    });
    
    if (validCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    No valid customers found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = validCustomers.map(customer => {
        const customerId = customer._id;
        const customerName = customer.name || 'Unknown';
        const wishlistCount = customer.wishlist?.length || 0;
        
        return `
            <tr>
                <td class="px-6 py-4 font-semibold">${customerName}</td>
                <td class="px-6 py-4">${customer.email || 'N/A'}</td>
                <td class="px-6 py-4">${customer.totalOrders || 0}</td>
                <td class="px-6 py-4 font-semibold">₹${(customer.totalSpent || 0).toLocaleString()}</td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        ${wishlistCount} items
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Cart
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${new Date(customer.createdAt).toLocaleDateString()}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button class="view-customer-profile text-blue-600 hover:text-blue-800 text-sm font-medium" data-id="${customerId}" data-name="${customerName}">
                            View Profile
                        </button>
                        <button class="view-customer-wishlist text-pink-600 hover:text-pink-800 text-sm font-medium" data-id="${customerId}" data-name="${customerName}">
                            Wishlist
                        </button>
                        <button class="view-customer-cart text-green-600 hover:text-green-800 text-sm font-medium" data-id="${customerId}" data-name="${customerName}">
                            Cart
                        </button>
                        <button class="edit-customer text-green-600 hover:text-green-800 text-sm font-medium" data-id="${customerId}" data-name="${customerName}">
                            Edit
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add event listeners
    addCustomerEventListeners();
}

// Add customer event listeners
function addCustomerEventListeners() {
    // View customer profile buttons
    document.querySelectorAll('.view-customer-profile').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            const customerName = this.dataset.name;
            
            console.log('🔍 Customer button clicked:', { customerId, customerName });
            
            // Validate customer ID
            if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
                console.error('❌ Invalid customer ID:', customerId);
                showToast('Invalid customer ID', 'error');
                return;
            }
            
            // Validate customer name
            if (!customerName || customerName === 'undefined' || customerName === 'null') {
                console.error('❌ Invalid customer name:', customerName);
                showToast('Invalid customer name', 'error');
                return;
            }
            
            viewCustomerProfile(customerId, customerName);
        });
    });
    
    // Edit customer buttons
    document.querySelectorAll('.edit-customer').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            const customerName = this.dataset.name;
            
            console.log('✏️ Edit customer button clicked:', { customerId, customerName });
            
            // Validate customer ID
            if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
                console.error('❌ Invalid customer ID:', customerId);
                showToast('Invalid customer ID', 'error');
                return;
            }
            
            // Validate customer name
            if (!customerName || customerName === 'undefined' || customerName === 'null') {
                console.error('❌ Invalid customer name:', customerName);
                showToast('Invalid customer name', 'error');
                return;
            }
            
            editCustomer(customerId, customerName);
        });
    });
    
    // View customer wishlist buttons
    document.querySelectorAll('.view-customer-wishlist').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            const customerName = this.dataset.name;
            
            console.log('❤️ Wishlist button clicked:', { customerId, customerName });
            
            // Validate customer ID
            if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
                console.error('❌ Invalid customer ID:', customerId);
                showToast('Invalid customer ID', 'error');
                return;
            }
            
            // Validate customer name
            if (!customerName || customerName === 'undefined' || customerName === 'null') {
                console.error('❌ Invalid customer name:', customerName);
                showToast('Invalid customer name', 'error');
                return;
            }
            
            viewCustomerWishlist(customerId, customerName);
        });
    });
    
    // View customer cart buttons
    document.querySelectorAll('.view-customer-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            const customerName = this.dataset.name;
            
            console.log('🛒 Cart button clicked:', { customerId, customerName });
            
            // Validate customer ID
            if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
                console.error('❌ Invalid customer ID:', customerId);
                showToast('Invalid customer ID', 'error');
                return;
            }
            
            // Validate customer name
            if (!customerName || customerName === 'undefined' || customerName === 'null') {
                console.error('❌ Invalid customer name:', customerName);
                showToast('Invalid customer name', 'error');
                return;
            }
            
            viewCustomerCart(customerId, customerName);
        });
    });
}

// View customer profile
async function viewCustomerProfile(customerId, customerName) {
    try {
        // Validate customer ID
        if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
            console.error('❌ Invalid customer ID:', customerId);
            showToast('Invalid customer ID', 'error');
            return;
        }
        
        console.log('👤 Loading customer profile for:', customerName, 'ID:', customerId);
        
        // Show loading state
        const modal = document.getElementById('customer-profile-modal');
        if (!modal) {
            console.error('❌ Customer profile modal not found');
            showToast('Modal not found', 'error');
            return;
        }
        
        const content = modal.querySelector('#customer-profile-content');
        if (!content) {
            console.error('❌ Modal content not found');
            showToast('Modal content not found', 'error');
            return;
        }
        
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
                <p>Loading customer profile...</p>
            </div>
        `;
        modal.classList.remove('hidden');
        
        // Load customer data
        const customerData = await loadCustomerProfileData(customerId);
        
        if (customerData) {
            renderCustomerProfile(customerData.customer, customerData.orders, customerData.wishlist);
        } else {
            showToast('Failed to load customer profile', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading customer profile:', error);
        showToast('Error loading customer profile', 'error');
    }
}

// Load customer profile data
async function loadCustomerProfileData(customerId) {
    try {
        console.log('📊 Loading customer profile data:', customerId);
        
        // Validate customer ID
        if (!customerId || customerId === 'undefined' || customerId === 'null' || typeof customerId !== 'string') {
            console.error('❌ Invalid customer ID:', customerId);
            throw new Error('Invalid customer ID');
        }
        
        // Load customer details
        const customerResponse = await api.getCustomer(customerId);
        if (!customerResponse.success) {
            console.error('❌ Failed to load customer details:', customerResponse);
            throw new Error('Failed to load customer details');
        }
        
        // Load customer orders
        const ordersResponse = await api.getAdminCustomerOrders(customerId);
        if (!ordersResponse.success) {
            console.error('❌ Failed to load customer orders:', ordersResponse);
            throw new Error('Failed to load customer orders');
        }
        
        // Load customer wishlist
        const wishlistResponse = await api.getAdminCustomerWishlist(customerId);
        if (!wishlistResponse.success) {
            console.error('❌ Failed to load customer wishlist:', wishlistResponse);
            throw new Error('Failed to load customer wishlist');
        }
        
        console.log('✅ Customer profile data loaded');
        return { 
            customer: customerResponse.customer, 
            orders: ordersResponse.orders, 
            wishlist: wishlistResponse.wishlist 
        };
    } catch (error) {
        console.error('❌ Error loading customer profile data:', error);
        showToast('Failed to load customer profile data', 'error');
        return null; // Indicate failure
    }
}

// Render customer profile
function renderCustomerProfile(customer, orders, wishlist) {
    const content = document.getElementById('customer-profile-content');
    
    // Validate customer data
    if (!customer || !customer._id) {
        content.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <p>Invalid customer data</p>
            </div>
        `;
        return;
    }
    
    // Validate customer ID
    const customerId = customer._id;
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
        content.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <p>Invalid customer ID</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <!-- Customer Information -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-lg font-semibold mb-4">Customer Information</h4>
                <div class="space-y-3">
                    <div>
                        <span class="font-medium text-gray-600">Name:</span>
                        <span class="ml-2">${customer.name || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Email:</span>
                        <span class="ml-2">${customer.email || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Phone:</span>
                        <span class="ml-2">${customer.phone || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Joined:</span>
                        <span class="ml-2">${new Date(customer.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Total Orders:</span>
                        <span class="ml-2">${orders.length}</span>
                    </div>
                    <div>
                        <span class="font-medium text-gray-600">Total Spent:</span>
                        <span class="ml-2 text-gold font-semibold">₹${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString()}</span>
                    </div>
                </div>
                
                ${customer.address ? `
                <div class="mt-4">
                    <h5 class="font-medium text-gray-600 mb-2">Address:</h5>
                    <div class="text-sm text-gray-700">
                        ${customer.address.street || ''}<br>
                        ${customer.address.city || ''}, ${customer.address.state || ''}<br>
                        ${customer.address.pincode || ''}, ${customer.address.country || ''}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <!-- Recent Orders -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="text-lg font-semibold mb-4">Recent Orders</h4>
                ${orders.length > 0 ? `
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        ${orders.slice(0, 5).map(order => `
                            <div class="border-b border-gray-200 pb-2 last:border-b-0">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <div class="font-medium">Order #${order._id.slice(-8)}</div>
                                        <div class="text-sm text-gray-600">${new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-semibold">₹${(order.totalAmount || 0).toLocaleString()}</div>
                                        <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}">${order.status}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-500">No orders found</p>'}
            </div>
        </div>
        
        <!-- Wishlist -->
        <div class="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold mb-4">Wishlist (${wishlist.length} items)</h4>
            ${wishlist.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${wishlist.map(item => `
                        <div class="bg-white p-3 rounded-lg border">
                            <img src="${item.images?.[0]?.url || item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyNEMyOS41ODIgMjQgMjEgMzIuNTgyIDIxIDQyQzIxIDUxLjQxOCAyOS41ODIgNjAgNDAgNjBDNTAuNDE4IDYwIDU5IDUxLjQxOCA1OSA0MkM1OSAzMi41ODIgNTAuNDE4IDI0IDQwIDI0Wk00MCA1MkMzNC40NzcgNTIgMzAgNDcuNTIzIDMwIDQyQzMwIDM2LjQ3NyAzNC40NzcgMzIgNDAgMzJDNDUuNTIzIDMyIDUwIDM2LjQ3NyA1MCA0MkM1MCA0Ny41MjMgNDUuNTIzIDUyIDQwIDUyWiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" alt="${item.name}" class="w-full h-20 object-cover rounded mb-2">
                            <div class="font-medium text-sm">${item.name}</div>
                            <div class="text-gold font-semibold">₹${(item.price || 0).toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="text-gray-500">Wishlist is empty</p>'}
        </div>
        
        <!-- Action Buttons -->
        <div class="mt-6 flex gap-4">
            <button class="edit-customer-btn bg-gold text-white px-4 py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors" data-id="${customerId}">
                Edit Customer
            </button>
            <button class="view-all-orders-btn bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors" data-id="${customerId}">
                View All Orders
            </button>
        </div>
    `;
    
    // Add event listeners for action buttons
    const editBtn = content.querySelector('.edit-customer-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            // Validate customer ID before calling
            if (!customer._id || customer._id === 'undefined' || customer._id === 'null') {
                console.error('❌ Invalid customer ID in edit button:', customer._id);
                showToast('Invalid customer ID', 'error');
                return;
            }
            editCustomer(customer._id, customer.name);
        });
    }
    
    const viewOrdersBtn = content.querySelector('.view-all-orders-btn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', () => {
            // Validate customer ID before calling
            if (!customer._id || customer._id === 'undefined' || customer._id === 'null') {
                console.error('❌ Invalid customer ID in view orders button:', customer._id);
                showToast('Invalid customer ID', 'error');
                return;
            }
            viewCustomerOrders(customer._id, customer.name);
        });
    }
}

// Edit customer
async function editCustomer(customerId, customerName) {
    try {
        // Validate customer ID
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            console.error('❌ Invalid customer ID:', customerId);
            showToast('Invalid customer ID', 'error');
            return;
        }
        
        console.log('✏️ Editing customer:', customerName, 'ID:', customerId);
        
        // Show loading state
        const modal = document.getElementById('edit-customer-modal');
        if (!modal) {
            console.error('❌ Edit customer modal not found');
            showToast('Edit modal not found', 'error');
            return;
        }
        
        const content = modal.querySelector('#edit-customer-content');
        if (!content) {
            console.error('❌ Edit modal content not found');
            showToast('Edit modal content not found', 'error');
            return;
        }
        
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
                <p>Loading customer data...</p>
            </div>
        `;
        modal.classList.remove('hidden');
        
        // Load customer data
        const response = await api.getCustomer(customerId);
        
        if (response.success) {
            fillEditCustomerForm(response.customer);
        } else {
            showToast('Failed to load customer data', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading customer data:', error);
        showToast('Error loading customer data', 'error');
    }
}

// Fill edit customer form
function fillEditCustomerForm(customer) {
    const content = document.getElementById('edit-customer-content');
    
    if (!content) {
        console.error('❌ Edit customer content not found');
        return;
    }
    
    content.innerHTML = `
        <form id="edit-customer-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" name="name" value="${customer.name || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value="${customer.email || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="phone" value="${customer.phone || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold">
                </div>
            </div>
            
            <div class="space-y-4">
                <h4 class="font-medium text-gray-700">Address</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Street</label>
                        <input type="text" name="street" value="${customer.address?.street || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input type="text" name="city" value="${customer.address?.city || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input type="text" name="state" value="${customer.address?.state || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                        <input type="text" name="pincode" value="${customer.address?.pincode || ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold">
                    </div>
                </div>
            </div>
            
            <div class="flex gap-4 pt-4">
                <button type="submit" class="bg-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                    Update Customer
                </button>
                <button type="button" class="close-modal bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                    Cancel
                </button>
            </div>
        </form>
    `;
    
    // Add form submit listener
    const form = content.querySelector('#edit-customer-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            updateCustomer(customer._id, this);
        });
    }
    
    // Add close modal listeners
    const closeButtons = content.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
}

// Update customer
async function updateCustomer(customerId, form) {
    try {
        console.log('💾 Updating customer:', customerId);
        
        const formData = new FormData(form);
        const customerData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: {
                street: formData.get('street'),
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('pincode'),
                country: 'India'
            }
        };
        
        await api.updateCustomer(customerId, customerData);
        showToast('Customer updated successfully!', 'success');
        
        // Close modal
        const modal = document.getElementById('edit-customer-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Reload customers list
        loadCustomers();
        
        // If customer profile modal is open, refresh it too after a small delay
        const profileModal = document.getElementById('customer-profile-modal');
        if (profileModal && !profileModal.classList.contains('hidden')) {
            // Get customer name from the modal title or form
            const customerName = formData.get('name');
            
            // Small delay to ensure server has processed the update
            setTimeout(async () => {
                await viewCustomerProfile(customerId, customerName);
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Error updating customer:', error);
        showToast('Failed to update customer', 'error');
    }
}

// View customer orders
async function viewCustomerOrders(customerId, customerName) {
    try {
        // Validate customer ID
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            console.error('❌ Invalid customer ID:', customerId);
            showToast('Invalid customer ID', 'error');
            return;
        }
        
        console.log('📦 Loading customer orders for:', customerName, 'ID:', customerId);
        
        // Show loading state
        const modal = document.getElementById('customer-orders-modal');
        if (!modal) {
            console.error('❌ Customer orders modal not found');
            showToast('Orders modal not found', 'error');
            return;
        }
        
        const content = modal.querySelector('#customer-orders-content');
        if (!content) {
            console.error('❌ Orders modal content not found');
            showToast('Orders modal content not found', 'error');
            return;
        }
        
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
                <p>Loading customer orders...</p>
            </div>
        `;
        modal.classList.remove('hidden');
        
        // Load customer orders
        const response = await api.getAdminCustomerOrders(customerId);
        
        if (response.success) {
            renderCustomerOrders(response.orders);
        } else {
            showToast('Failed to load customer orders', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading customer orders:', error);
        showToast('Error loading customer orders', 'error');
    }
}

// Render customer orders
function renderCustomerOrders(orders) {
    const content = document.getElementById('customer-orders-content');
    
    if (orders.length === 0) {
        content.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No orders found for this customer</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200">
                        <th class="text-left py-3 px-4 font-semibold">Order ID</th>
                        <th class="text-left py-3 px-4 font-semibold">Date</th>
                        <th class="text-left py-3 px-4 font-semibold">Items</th>
                        <th class="text-left py-3 px-4 font-semibold">Total</th>
                        <th class="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="py-3 px-4 font-medium">${order._id}</td>
                            <td class="py-3 px-4">${new Date(order.createdAt).toLocaleDateString()}</td>
                            <td class="py-3 px-4">
                                <div class="text-sm">
                                    ${order.orderItems?.map(item => item.product?.name || 'Unknown Product').join(', ') || 'N/A'}
                                </div>
                            </td>
                            <td class="py-3 px-4 font-semibold">₹${(order.totalAmount || 0).toLocaleString()}</td>
                            <td class="py-3 px-4">
                                <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}">${order.status}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load analytics
async function loadAnalytics() {
    try {
        const period = document.getElementById('analytics-period')?.value || '7';
        
        // Show loading indicators
        const analyticsOverview = document.getElementById('analytics-overview');
        const topPagesContainer = document.getElementById('top-pages');
        const recentActivityContainer = document.getElementById('recent-activity');
        
        if (analyticsOverview) {
            analyticsOverview.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                    <span class="ml-2 text-gray-600">Loading analytics...</span>
                </div>
            `;
        }
        
        if (topPagesContainer) {
            topPagesContainer.innerHTML = `
                <div class="flex items-center justify-center py-4">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
                    <span class="ml-2 text-gray-600">Loading top pages...</span>
                </div>
            `;
        }
        
        if (recentActivityContainer) {
            recentActivityContainer.innerHTML = `
                <div class="flex items-center justify-center py-4">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
                    <span class="ml-2 text-gray-600">Loading recent activity...</span>
                </div>
            `;
        }
        
        // Load summary analytics
        const summaryResponse = await api.getAnalyticsSummary(period);
        if (summaryResponse?.success) {
            analyticsData = summaryResponse.data;
            updateAnalyticsOverview();
            updateTopPages();
            updateRecentActivity();
        } else {
            throw new Error('Failed to load analytics summary');
        }
        
        // Load real-time analytics
        await loadRealTimeAnalytics();
        
        // Load conversion stats
        await loadConversionStats();
        
        // Start real-time updates
        startRealTimeUpdates();
        
        console.log('✅ Analytics loaded');
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        showToast('Error loading analytics', 'error');
        
        // Show error states
        const analyticsOverview = document.getElementById('analytics-overview');
        const topPagesContainer = document.getElementById('top-pages');
        const recentActivityContainer = document.getElementById('recent-activity');
        
        if (analyticsOverview) {
            analyticsOverview.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <p>Failed to load analytics</p>
                </div>
            `;
        }
        
        if (topPagesContainer) {
            topPagesContainer.innerHTML = `
                <div class="text-center text-red-500 py-4">
                    <p>Failed to load top pages</p>
                </div>
            `;
        }
        
        if (recentActivityContainer) {
            recentActivityContainer.innerHTML = `
                <div class="text-center text-red-500 py-4">
                    <p>Failed to load recent activity</p>
                </div>
            `;
        }
    }
}

// Update analytics overview
function updateAnalyticsOverview() {
    if (!analyticsData) return;
    
    // Safely update analytics elements
    const elements = {
        'total-visitors': analyticsData.totalVisitors || 0,
        'total-pageviews': analyticsData.totalPageViews || 0,
        'active-users': analyticsData.totalSessions || 0,
        'bounce-rate': `${analyticsData.bounceRate || 0}%`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Analytics element with id '${id}' not found`);
        }
    });
}

// Update top pages
function updateTopPages() {
    const topPagesContainer = document.getElementById('top-pages');
    if (!topPagesContainer || !analyticsData?.topPages) return;
    
    topPagesContainer.innerHTML = '';
    
    if (analyticsData.topPages.length === 0) {
        topPagesContainer.innerHTML = '<p class="text-gray-500">No page views recorded</p>';
        return;
    }
    
    analyticsData.topPages.forEach((page, index) => {
        const pageElement = document.createElement('div');
        pageElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        pageElement.innerHTML = `
            <div class="flex items-center">
                <span class="text-sm font-medium text-gray-900">${index + 1}.</span>
                <span class="ml-3 text-sm text-gray-700">${page.page}</span>
            </div>
            <span class="text-sm font-semibold text-blue-600">${page.views} views</span>
        `;
        topPagesContainer.appendChild(pageElement);
    });
}

// Update recent activity
function updateRecentActivity() {
    const recentActivityContainer = document.getElementById('recent-activity');
    if (!recentActivityContainer || !analyticsData?.recentActivity) return;
    
    recentActivityContainer.innerHTML = '';
    
    if (analyticsData.recentActivity.length === 0) {
        recentActivityContainer.innerHTML = '<p class="text-gray-500">No recent activity</p>';
        return;
    }
    
    analyticsData.recentActivity.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'flex items-center justify-between p-2 border-b border-gray-100';
        activityElement.innerHTML = `
            <div class="flex items-center">
                <span class="text-xs text-gray-500">${formatTimeAgo(activity.timestamp)}</span>
                <span class="ml-2 text-sm text-gray-700">${getActionIcon(activity.action)} ${activity.action}</span>
            </div>
            <span class="text-xs text-gray-500">${activity.page}</span>
        `;
        recentActivityContainer.appendChild(activityElement);
    });
}

// Load real-time analytics
async function loadRealTimeAnalytics() {
    try {
        const response = await api.getRealTimeAnalytics();
        if (response.success) {
            updateRealTimeAnalytics(response.data);
        }
    } catch (error) {
        console.error('❌ Error loading real-time analytics:', error);
    }
}

// Update real-time analytics
function updateRealTimeAnalytics(data) {
    document.getElementById('realtime-active-users').textContent = data.activeUsers || 0;
    document.getElementById('realtime-sessions').textContent = data.activeSessions?.length || 0;
    document.getElementById('realtime-last-updated').textContent = formatDate(data.lastUpdated);
    
    // Update active sessions list
    const activeSessionsContainer = document.getElementById('active-sessions-list');
    if (activeSessionsContainer) {
        activeSessionsContainer.innerHTML = '';
        
        if (!data.activeSessions || data.activeSessions.length === 0) {
            activeSessionsContainer.innerHTML = '<p class="text-gray-500">No active sessions</p>';
            return;
        }
        
        data.activeSessions.forEach(session => {
            const sessionElement = document.createElement('div');
            sessionElement.className = 'flex items-center justify-between p-2 bg-green-50 rounded-lg';
            sessionElement.innerHTML = `
                <div class="flex items-center">
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm text-gray-700">${session.currentPage}</span>
                </div>
                <span class="text-xs text-gray-500">${formatTimeAgo(session.lastActivity)}</span>
            `;
            activeSessionsContainer.appendChild(sessionElement);
        });
    }
}

// Load conversion stats
async function loadConversionStats() {
    try {
        const response = await api.getConversionAnalytics();
        if (response.success) {
            updateConversionStats(response.data);
        }
    } catch (error) {
        console.error('❌ Error loading conversion stats:', error);
    }
}

// Update conversion stats
function updateConversionStats(data) {
    const conversionStatsContainer = document.getElementById('conversion-stats');
    if (!conversionStatsContainer) return;
    
    conversionStatsContainer.innerHTML = '';
    
    if (!data.stats || Object.keys(data.stats).length === 0) {
        conversionStatsContainer.innerHTML = '<p class="text-gray-500">No conversions recorded</p>';
        return;
    }
    
    Object.entries(data.stats).forEach(([type, count]) => {
        const statElement = document.createElement('div');
        statElement.className = 'flex items-center justify-between p-2 bg-blue-50 rounded-lg';
        statElement.innerHTML = `
            <span class="text-sm font-medium text-gray-700">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span class="text-sm font-semibold text-blue-600">${count}</span>
        `;
        conversionStatsContainer.appendChild(statElement);
    });
}

// Start real-time updates
function startRealTimeUpdates() {
    // Clear existing interval
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
    }
    
    // Update real-time data every 30 seconds
    realtimeInterval = setInterval(async () => {
        await loadRealTimeAnalytics();
    }, 30000);
}

// Stop real-time updates
function stopRealTimeUpdates() {
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
    }
}

// Export analytics data
async function exportAnalyticsData() {
    try {
        const period = document.getElementById('analytics-period')?.value || '7';
        const response = await api.getAnalyticsSummary(period);
        
        if (response.success) {
            const data = response.data;
            const csvContent = generateAnalyticsCSV(data);
            downloadCSV(csvContent, `analytics-${period}-days.csv`);
            showToast('Analytics data exported successfully', 'success');
        }
    } catch (error) {
        console.error('❌ Error exporting analytics:', error);
        showToast('Error exporting analytics', 'error');
    }
}

// Generate CSV from analytics data
function generateAnalyticsCSV(data) {
    const headers = ['Metric', 'Value'];
    const rows = [
        ['Total Visitors', data.totalVisitors || 0],
        ['Total Page Views', data.totalPageViews || 0],
        ['Total Sessions', data.totalSessions || 0],
        ['Average Session Duration', `${data.averageSessionDuration || 0} seconds`],
        ['Bounce Rate', `${data.bounceRate || 0}%`]
    ];
    
    // Add top pages
    if (data.topPages && data.topPages.length > 0) {
        rows.push(['', '']);
        rows.push(['Top Pages', 'Views']);
        data.topPages.forEach(page => {
            rows.push([page.page, page.views]);
        });
    }
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Download CSV file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Helper functions
function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getActionIcon(action) {
    const icons = {
        'page_view': '👁️',
        'click': '🖱️',
        'scroll': '📜',
        'form_submit': '📝',
        'search': '🔍',
        'add_to_cart': '🛒',
        'remove_from_cart': '❌',
        'wishlist_add': '❤️',
        'wishlist_remove': '💔'
    };
    return icons[action] || '📊';
}

// Load settings
async function loadSettings() {
    try {
        console.log('⚙️ Loading settings...');
        
        const response = await api.getSettings();
        const settings = response.settings;
        
        // Fill settings form
        const form = document.getElementById('settings-form');
        if (form) {
            form.querySelector('[name="websiteName"]').value = settings.websiteName || 'Laiq Bags';
            form.querySelector('[name="contactEmail"]').value = settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com';
            form.querySelector('[name="instagramHandle"]').value = settings.instagramHandle || '@laiq_bags_';
            form.querySelector('[name="whatsappNumber"]').value = settings.whatsappNumber || '+91 99999 99999';
            form.querySelector('[name="street"]').value = settings.address?.street || 'Admin Street';
            form.querySelector('[name="city"]').value = settings.address?.city || 'Mumbai';
            form.querySelector('[name="state"]').value = settings.address?.state || 'Maharashtra';
            form.querySelector('[name="pincode"]').value = settings.address?.pincode || '400001';
            form.querySelector('[name="country"]').value = settings.address?.country || 'India';
        }
        
        console.log('✅ Settings loaded');
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        showToast('Failed to load settings', 'error');
    }
}

// Save settings
async function saveSettings(e) {
    e.preventDefault();
    
    try {
        console.log('💾 Saving settings...');
        
        const formData = new FormData(e.target);
        const settingsData = {
            websiteName: formData.get('websiteName'),
            contactEmail: formData.get('contactEmail'),
            instagramHandle: formData.get('instagramHandle'),
            whatsappNumber: formData.get('whatsappNumber'),
            address: {
                street: formData.get('street') || 'Admin Street',
                city: formData.get('city') || 'Mumbai',
                state: formData.get('state') || 'Maharashtra',
                pincode: formData.get('pincode') || '400001',
                country: formData.get('country') || 'India'
            }
        };
        
        const response = await api.updateSettings(settingsData);
        
        if (response.success) {
            showToast('Settings saved successfully!', 'success');
            
            // Update frontend immediately
            updateFrontendWithSettings(settingsData);
            
            // Force refresh settings on all open pages
            forceRefreshSettingsOnAllPages(settingsData);
            
            console.log('✅ Settings saved and frontend updated');
        } else {
            showToast('Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        showToast('Failed to save settings', 'error');
    }
}

// Update frontend with new settings
function updateFrontendWithSettings(settings) {
    console.log('🔄 Updating frontend with new settings:', settings);
    
    // Update website name
    const websiteNameElements = document.querySelectorAll('.website-name');
    websiteNameElements.forEach(element => {
        element.textContent = settings.websiteName || 'Laiq Bags';
    });
    
    // Update contact email
    const contactEmailElements = document.querySelectorAll('.contact-email, .footer-contact-email');
    contactEmailElements.forEach(element => {
        element.textContent = settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com';
        element.href = `mailto:${settings.contactEmail || 'mdhidayatulahsheikh786@gmail.com'}`;
    });
    
    // Update Instagram handle
    const instagramElements = document.querySelectorAll('.instagram-handle, .footer-instagram');
    instagramElements.forEach(element => {
        element.textContent = settings.instagramHandle || '@laiq_bags_';
        element.href = `https://www.instagram.com/${settings.instagramHandle?.replace('@', '') || 'laiq_bags_'}`;
    });
    
    // Update WhatsApp number
    const whatsappElements = document.querySelectorAll('.whatsapp-number, .footer-whatsapp');
    whatsappElements.forEach(element => {
        const cleanNumber = settings.whatsappNumber?.replace(/\D/g, '') || '919999999999';
        element.textContent = settings.whatsappNumber || '+91 99999 99999';
        element.href = `https://wa.me/${cleanNumber}`;
    });
    
    console.log('✅ Frontend updated with new settings');
}

// Force refresh settings on all open pages
function forceRefreshSettingsOnAllPages(settings) {
    console.log('🔄 Broadcasting settings update to all open pages...');
    
    // Use localStorage to communicate with other tabs/pages
    const settingsUpdate = {
        timestamp: Date.now(),
        settings: settings,
        action: 'refresh_settings'
    };
    
    // Store the update in localStorage
    localStorage.setItem('settingsUpdate', JSON.stringify(settingsUpdate));
    
    // Dispatch a custom event to notify other tabs
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: settingsUpdate
    }));
    
    console.log('✅ Settings update broadcasted');
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transform transition-all duration-300 translate-x-full`;
    
    // Handle multi-line messages
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    const colors = {
        success: ['bg-green-500', 'text-white'],
        error: ['bg-red-500', 'text-white'],
        warning: ['bg-yellow-500', 'text-black'],
        info: ['bg-blue-500', 'text-white']
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <span class="text-lg">${icons[type]}</span>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium whitespace-pre-line">${formattedMessage}</p>
            </div>
            <div class="ml-4 flex-shrink-0">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="text-white hover:text-gray-200 focus:outline-none">
                    <span class="sr-only">Close</span>
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Add CSS classes properly (without spaces)
    colors[type].forEach(className => {
        toast.classList.add(className);
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        console.log('🔍 Viewing order details:', orderId);
        
        const response = await api.getOrder(orderId);
        if (response.success) {
            const order = response.order;
            
            // Debug: Log order items to understand color structure
            console.log('🔍 Order items color structure:', order.orderItems?.map(item => ({
                name: item.name,
                color: item.color,
                colorType: typeof item.color,
                colorKeys: item.color ? Object.keys(item.color) : null,
                colorDisplay: getColorDisplay(item.color)
            })));
            
            // Create modal for order details
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-charcoal">Order Details</h2>
                            <p class="text-sm text-charcoal/60 mt-1">Order #${order._id.slice(-8)} • ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                        <button onclick="this.closest('.fixed').remove()" class="text-charcoal hover:text-gold transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Order Information -->
                        <div class="space-y-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-charcoal mb-3">Order Information</h3>
                                <div class="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p class="text-charcoal/60">Order ID</p>
                                        <p class="font-medium">#${order._id.slice(-8)}</p>
                                    </div>
                                    <div>
                                        <p class="text-charcoal/60">Order Date</p>
                                        <p class="font-medium">${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p class="text-charcoal/60">Status</p>
                                        <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}">${order.status.toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p class="text-charcoal/60">Total Amount</p>
                                        <p class="font-bold text-gold">₹${(order.totalAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-charcoal mb-3">Customer Information</h3>
                                <div class="space-y-2 text-sm">
                                    <div>
                                        <p class="text-charcoal/60">Name</p>
                                        <p class="font-medium">${order.user?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="text-charcoal/60">Email</p>
                                        <p class="font-medium">${order.user?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-charcoal mb-3">Shipping Address</h3>
                                <div class="space-y-1 text-sm">
                                    <p class="text-charcoal/70">${order.shippingInfo ? 
                                        `${order.shippingInfo.street || 'N/A'}<br>
                                        ${order.shippingInfo.city || ''}, ${order.shippingInfo.state || ''} - ${order.shippingInfo.pincode || ''}<br>
                                        ${order.shippingInfo.country || 'India'}` : 
                                        'Address not available'
                                    }</p>
                                </div>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-charcoal mb-3">Payment Information</h3>
                                <div class="space-y-2 text-sm">
                                    <div>
                                        <p class="text-charcoal/60">Method</p>
                                        <p class="font-medium">${order.paymentInfo?.id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="text-charcoal/60">Status</p>
                                        <p class="font-medium">${order.paymentInfo?.status || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="text-charcoal/60">Paid At</p>
                                        <p class="font-medium">${order.paidAt ? new Date(order.paidAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Order Items -->
                        <div class="space-y-4">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-charcoal mb-3">Order Items (${order.orderItems?.length || 0})</h3>
                                <div class="space-y-3">
                                    ${order.orderItems?.map(item => `
                                        <div class="flex items-center gap-3 p-3 bg-white rounded border">
                                            <img src="${item.image || item.product?.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyNEMyOS41ODIgMjQgMjEgMzIuNTgyIDIxIDQyQzIxIDUxLjQxOCAyOS41ODIgNjAgNDAgNjBDNTAuNDE4IDYwIDU5IDUxLjQxOCA1OSA0MkM1OSAzMi41ODIgNTAuNDE4IDI0IDQwIDI0Wk00MCA1MkMzNC40NzcgNTIgMzAgNDcuNTIzIDMwIDQyQzMwIDM2LjQ3NyAzNC40NzcgMzIgNDAgMzJDNDUuNTIzIDMyIDUwIDM2LjQ3NyA1MCA0MkM1MCA0Ny41MjMgNDUuNTIzIDUyIDQwIDUyWiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" alt="${item.name || item.product?.name}" class="w-20 h-20 object-cover rounded-lg">
                                            <div class="flex-1 min-w-0">
                                                <h3 class="font-semibold text-charcoal truncate">${item.name || item.product?.name || 'Product Name'}</h3>
                                                <p class="text-sm text-gray-600 mt-1">${item.description || item.product?.description || 'No description'}</p>
                                                
                                                <!-- Color and Size Information -->
                                                <div class="flex flex-wrap gap-2 mt-2">
                                                    ${item.color ? `
                                                        <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                            Color: ${getColorDisplay(item.color)}
                                                        </span>
                                                    ` : ''}
                                                    ${item.size ? `
                                                        <span class="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                                            Size: ${item.size}
                                                        </span>
                                                    ` : ''}
                                                    ${item.category ? `
                                                        <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                            ${item.category}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                                
                                                <div class="flex justify-between items-center mt-2">
                                                    <span class="text-gold font-bold">₹${(item.price || item.product?.price || 0).toLocaleString()}</span>
                                                    <span class="text-sm text-gray-600">
                                                        Qty: ${item.quantity || 1}
                                                    </span>
                                                </div>
                                                
                                                <div class="mt-2 text-xs text-gray-500">
                                                    Stock: ${item.stockCount || item.product?.stockCount || 0} units
                                                </div>
                                                
                                                <!-- Additional Product Details -->
                                                ${item.product?.material ? `
                                                    <div class="mt-1 text-xs text-gray-500">
                                                        Material: ${item.product.material}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `).join('') || '<p class="text-charcoal/60 text-center">No items found</p>'}
                                </div>
                            </div>
                            
                            <!-- Status Update -->
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-charcoal mb-3">Update Status</h3>
                                <div class="flex gap-2">
                                    <select id="order-status-select" class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm">
                                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                    <button onclick="updateOrderStatusFromModal('${order._id}')" class="bg-gold text-white px-4 py-2 rounded text-sm hover:bg-charcoal transition-colors">
                                        Update
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Cancel Order (Admin Only) -->
                            ${order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'refunded' ? `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <h3 class="font-semibold text-charcoal mb-3">Cancel Order</h3>
                                    ${order.status === 'shipped' ? `
                                        <div class="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                            <p class="text-sm text-yellow-800">
                                                <strong>Warning:</strong> This order has been shipped. Cancelling will require special authorization.
                                            </p>
                                        </div>
                                    ` : ''}
                                    <div class="space-y-3">
                                        <textarea id="cancel-reason-admin" placeholder="Reason for cancellation (required)..." class="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows="3"></textarea>
                                        <div class="flex gap-2">
                                            <button onclick="cancelOrderByAdmin('${order._id}')" class="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors">
                                                Cancel Order
                                            </button>
                                            ${order.status === 'shipped' ? `
                                                <label class="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" id="force-cancel-check" class="rounded">
                                                    Force Cancel (Shipped Order)
                                                </label>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${order.status === 'cancelled' ? `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <h3 class="font-semibold text-red-800 mb-2">Cancellation Details</h3>
                                    <div class="bg-red-50 p-3 rounded">
                                        <p class="text-sm text-red-700">
                                            <strong>Cancelled by:</strong> ${order.cancellationDetails?.cancelledBy || 'Admin'}<br>
                                            <strong>Reason:</strong> ${order.cancellationDetails?.cancellationReason || 'Not specified'}<br>
                                            <strong>Refund Status:</strong> ${order.cancellationDetails?.refundStatus || 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error('❌ Error loading order details:', error);
        showToast('Error loading order details', 'error');
    }
}

// Update order status from modal
async function updateOrderStatusFromModal(orderId) {
    try {
        const statusSelect = document.getElementById('order-status-select');
        const newStatus = statusSelect.value;
        
        console.log('🔄 Updating order status:', orderId, 'to', newStatus);
        
        // Show loading state
        const updateBtn = statusSelect.nextElementSibling;
        const originalText = updateBtn.textContent;
        updateBtn.textContent = 'Updating...';
        updateBtn.disabled = true;
        
        const response = await api.updateOrderStatus(orderId, { status: newStatus });
        if (response.success) {
            showToast(`Order status updated to ${newStatus.toUpperCase()} successfully!`, 'success');
            
            // Update the status display in the modal
            const statusSpan = document.querySelector('.bg-gray-50 .px-2.py-1');
            if (statusSpan) {
                statusSpan.textContent = newStatus.toUpperCase();
                statusSpan.className = `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(newStatus)}`;
            }
            
            // Close modal and refresh orders
            setTimeout(() => {
                document.querySelector('.fixed').remove();
                loadOrders();
            }, 1500);
        } else {
            showToast('Error updating order status: ' + (response.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        showToast('Error updating order status: ' + error.message, 'error');
    } finally {
        // Reset button state
        const updateBtn = document.getElementById('order-status-select')?.nextElementSibling;
        if (updateBtn) {
            updateBtn.textContent = 'Update';
            updateBtn.disabled = false;
        }
    }
}

// Update order status from table
async function updateOrderStatus(orderId, newStatus) {
    try {
        console.log('🔄 Updating order status:', orderId, 'to', newStatus);
        
        // Find the select element and show loading state
        const selectElement = document.querySelector(`select[onchange="updateOrderStatus('${orderId}', this.value)"]`);
        if (selectElement) {
            const originalValue = selectElement.value;
            selectElement.disabled = true;
            selectElement.style.opacity = '0.5';
        }
        
        const response = await api.updateOrderStatus(orderId, { status: newStatus });
        if (response.success) {
            showToast(`Order #${orderId.slice(-8)} status updated to ${newStatus.toUpperCase()}!`, 'success');
            
            // Update the status badge in the table
            const statusCell = selectElement?.closest('tr')?.querySelector('.px-2.py-1');
            if (statusCell) {
                statusCell.textContent = newStatus.toUpperCase();
                statusCell.className = `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(newStatus)}`;
            }
            
            // Reload orders after a short delay
            setTimeout(() => {
                loadOrders();
            }, 1000);
        } else {
            showToast('Error updating order status: ' + (response.message || 'Unknown error'), 'error');
            // Reset select to original value
            if (selectElement) {
                selectElement.value = originalValue;
            }
        }
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        showToast('Error updating order status: ' + error.message, 'error');
        // Reset select to original value
        const selectElement = document.querySelector(`select[onchange="updateOrderStatus('${orderId}', this.value)"]`);
        if (selectElement) {
            selectElement.value = selectElement.dataset.originalValue || 'pending';
        }
    } finally {
        // Re-enable select element
        const selectElement = document.querySelector(`select[onchange="updateOrderStatus('${orderId}', this.value)"]`);
        if (selectElement) {
            selectElement.disabled = false;
            selectElement.style.opacity = '1';
        }
    }
}

// Cancel order by admin
async function cancelOrderByAdmin(orderId) {
    try {
        const cancelReason = document.getElementById('cancel-reason-admin').value.trim();
        const forceCancelCheck = document.getElementById('force-cancel-check');
        
        if (!cancelReason) {
            showToast('Please provide a reason for cancellation', 'error');
            return;
        }
        
        // Check if this is a shipped order and force cancel is required
        const isForceCancel = forceCancelCheck && forceCancelCheck.checked;
        
        if (!confirm(`Are you sure you want to cancel this order?${isForceCancel ? ' This is a shipped order and requires special authorization.' : ''} This action cannot be undone.`)) {
            return;
        }
        
        console.log('❌ Admin cancelling order:', orderId, 'Force cancel:', isForceCancel);
        
        const response = await api.cancelOrderByAdmin(orderId, cancelReason, null, isForceCancel);
        
        if (response.success) {
            showToast('Order cancelled successfully', 'success');
            
            // Close modal and refresh orders
            document.querySelector('.fixed').remove();
            await loadOrders();
        } else {
            showToast(response.message || 'Error cancelling order', 'error');
        }
    } catch (error) {
        console.error('❌ Error cancelling order:', error);
        showToast('Error cancelling order: ' + error.message, 'error');
    }
} 

async function viewCustomerWishlist(customerId, customerName) {
    try {
        // Validate customer ID
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            console.error('❌ Invalid customer ID:', customerId);
            showToast('Invalid customer ID', 'error');
            return;
        }
        
        console.log('❤️ Loading customer wishlist for:', customerName, 'ID:', customerId);
        
        // Show loading state
        const modal = document.getElementById('customer-wishlist-modal');
        const content = modal.querySelector('.modal-content');
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
                <p>Loading customer wishlist...</p>
            </div>
        `;
        modal.classList.remove('hidden');
        
        // Load customer wishlist
        const response = await api.getAdminCustomerWishlist(customerId);
        
        if (response.success) {
            renderCustomerWishlist(response.wishlist, customerName);
        } else {
            showToast('Failed to load customer wishlist', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading customer wishlist:', error);
        showToast('Error loading customer wishlist', 'error');
    }
}

// Render customer wishlist
function renderCustomerWishlist(wishlist, customerName) {
    const modal = document.getElementById('customer-wishlist-modal');
    const content = modal.querySelector('.modal-content');
    
    console.log('🎨 Rendering wishlist for:', customerName, 'Items:', wishlist.length);
    
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                    <h2 class="text-2xl font-bold text-charcoal">${customerName}'s Wishlist</h2>
                    <p class="text-gray-600">${wishlist.length} items in wishlist</p>
                </div>
                <button onclick="closeModal('customer-wishlist-modal')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Wishlist Items -->
            <div class="p-6">
                ${wishlist.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${wishlist.map(item => `
                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div class="flex items-start space-x-4">
                                    <img src="${item.images?.[0]?.url || item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyNEMyOS41ODIgMjQgMjEgMzIuNTgyIDIxIDQyQzIxIDUxLjQxOCAyOS41ODIgNjAgNDAgNjBDNTAuNDE4IDYwIDU5IDUxLjQxOCA1OSA0MkM1OSAzMi41ODIgNTAuNDE4IDI0IDQwIDI0Wk00MCA1MkMzNC40NzcgNTIgMzAgNDcuNTIzIDMwIDQyQzMwIDM2LjQ3NyAzNC40NzcgMzIgNDAgMzJDNDUuNTIzIDMyIDUwIDM2LjQ3NyA1MCA0MkM1MCA0Ny41MjMgNDUuNTIzIDUyIDQwIDUyWiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" alt="${item.name}" class="w-full h-20 object-cover rounded mb-2">
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-semibold text-charcoal truncate">${item.name}</h3>
                                        <p class="text-sm text-gray-600 mt-1">${item.description || 'No description'}</p>
                                        <div class="flex justify-between items-center mt-2">
                                            <span class="text-gold font-bold">₹${(item.price || 0).toLocaleString()}</span>
                                            <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                ${item.category || 'General'}
                                            </span>
                                        </div>
                                        <div class="mt-2 text-xs text-gray-500">
                                            Stock: ${item.stockCount || 0} units
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <div class="text-gray-400 mb-4">
                            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-600 mb-2">Wishlist is Empty</h3>
                        <p class="text-gray-500">${customerName} hasn't added any items to their wishlist yet.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        console.log('✅ Modal closed:', modalId);
    } else {
        console.warn('⚠️ Modal not found:', modalId);
    }
}

// View customer cart
async function viewCustomerCart(customerId, customerName) {
    try {
        // Validate customer ID
        if (!customerId || customerId === 'undefined' || customerId === 'null') {
            console.error('❌ Invalid customer ID:', customerId);
            showToast('Invalid customer ID', 'error');
            return;
        }
        
        console.log('🛒 Loading customer cart for:', customerName, 'ID:', customerId);
        
        // Show loading state
        const modal = document.getElementById('customer-cart-modal');
        const content = modal.querySelector('.modal-content');
        content.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
                <p>Loading customer cart...</p>
            </div>
        `;
        modal.classList.remove('hidden');
        
        // Load customer cart
        const response = await api.getAdminCustomerCart(customerId);
        
        if (response.success) {
            renderCustomerCart(response.cart, customerName);
        } else {
            showToast('Failed to load customer cart', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading customer cart:', error);
        showToast('Error loading customer cart', 'error');
    }
}

// Render customer cart
function renderCustomerCart(cart, customerName) {
    const modal = document.getElementById('customer-cart-modal');
    const content = modal.querySelector('.modal-content');
    
    console.log('🎨 Rendering cart for:', customerName, 'Items:', cart.items.length);
    
    content.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-4xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                    <h2 class="text-2xl font-bold text-charcoal">${customerName}'s Cart</h2>
                    <p class="text-gray-600">${cart.itemCount} items • Total: ₹${cart.totalAmount.toLocaleString()}</p>
                </div>
                <button onclick="closeModal('customer-cart-modal')" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <!-- Cart Items -->
            <div class="p-6">
                ${cart.items.length > 0 ? `
                    <div class="space-y-4">
                        ${cart.items.map(item => `
                            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div class="flex items-start space-x-4">
                                    <img src="${item.image || item.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}" 
                                         alt="${item.name || item.product?.name}" 
                                         class="w-20 h-20 object-cover rounded-lg">
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-semibold text-charcoal truncate">${item.name || item.product?.name}</h3>
                                        <p class="text-sm text-gray-600 mt-1">${item.product?.description || 'No description'}</p>
                                        <div class="flex justify-between items-center mt-2">
                                            <div class="flex items-center space-x-4">
                                                <span class="text-gold font-bold">₹${(item.price || 0).toLocaleString()}</span>
                                                <span class="text-sm text-gray-500">Qty: ${item.quantity}</span>
                                            </div>
                                            <span class="text-gold font-bold">₹${((item.price || 0) * item.quantity).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Cart Summary -->
                    <div class="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-semibold text-charcoal">Total Amount:</span>
                            <span class="text-2xl font-bold text-gold">₹${cart.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <div class="text-gray-400 mb-4">
                            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-600 mb-2">Cart is Empty</h3>
                        <p class="text-gray-500">${customerName} hasn't added any items to their cart yet.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Initialize image upload functionality
function initializeImageUpload() {
    const addImageBtn = document.getElementById('add-image-btn');
    const imageContainer = document.querySelector('#image-upload-container .grid');
    
    if (addImageBtn) {
        addImageBtn.addEventListener('click', addImageUploadItem);
    }
    
    // Initialize existing image upload items
    document.querySelectorAll('.image-upload-item').forEach(item => {
        initializeImageUploadItem(item);
    });
}

// Add new image upload item
function addImageUploadItem() {
    const imageContainer = document.querySelector('#image-upload-container .grid');
    const newItem = document.createElement('div');
    newItem.className = 'image-upload-item border-2 border-dashed border-gray-300 rounded-lg p-4 text-center';
    newItem.innerHTML = `
        <input type="file" class="image-input hidden" accept="image/*">
        <div class="image-preview-container">
            <img class="image-preview w-full h-32 object-cover rounded-lg hidden" alt="Preview">
            <div class="image-placeholder">
                <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <p class="text-sm text-gray-500">Add Image</p>
            </div>
        </div>
        <div class="mt-2">
            <label class="flex items-center text-sm">
                <input type="radio" name="primaryImage" class="mr-1">
                <span>Primary</span>
            </label>
        </div>
        <button type="button" class="remove-image text-red-500 text-sm mt-1 hidden">Remove</button>
    `;
    
    imageContainer.appendChild(newItem);
    initializeImageUploadItem(newItem);
}

// Initialize image upload item
function initializeImageUploadItem(item) {
    const input = item.querySelector('.image-input');
    const preview = item.querySelector('.image-preview');
    const placeholder = item.querySelector('.image-placeholder');
    const removeBtn = item.querySelector('.remove-image');
    const primaryRadio = item.querySelector('input[name="primaryImage"]');
    
    // Make the entire item clickable
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-image') && !e.target.closest('input[type="radio"]')) {
            input.click();
        }
    });
    
    // Handle file selection
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
                removeBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Handle remove button (mark as removed so it won't be sent on save)
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
        removeBtn.classList.add('hidden');
        // Mark this image item as removed so saveProduct skips it
        item.dataset.removed = 'true';
        if (primaryRadio.checked) {
            primaryRadio.checked = false;
        }
    });
    
    // Handle primary image selection
    primaryRadio.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Uncheck other primary image radios
            document.querySelectorAll('input[name="primaryImage"]').forEach(radio => {
                if (radio !== e.target) {
                    radio.checked = false;
                }
            });
        }
    });
}

// Initialize color variant functionality
function initializeColorVariants() {
    const addColorBtn = document.getElementById('add-color-btn');
    
    if (addColorBtn) {
        addColorBtn.addEventListener('click', addColorVariant);
    }
    
    // Initialize existing color variants
    document.querySelectorAll('.color-variant-item').forEach(item => {
        initializeColorVariantItem(item);
    });
}

// Add new color variant
function addColorVariant() {
    const container = document.getElementById('color-variants-container');
    const existingItems = container.querySelectorAll('.color-variant-item');
    const newIndex = existingItems.length;
    
    console.log(`🎨 Adding new color variant at index: ${newIndex}`);
    
    const newItem = document.createElement('div');
    newItem.className = 'color-variant-item border border-gray-300 rounded-lg p-4 mb-4';
    newItem.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Color Name</label>
                <input type="text" name="colorName[]" placeholder="e.g., Black" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Color Code</label>
                <input type="text" name="colorCode[]" placeholder="e.g., #000000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                <input type="number" name="colorStock[]" min="0" placeholder="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
            </div>
            <div class="flex items-end">
                <label class="flex items-center">
                    <input type="checkbox" name="colorAvailable[]" value="${newIndex}" checked class="mr-2">
                    <span class="text-sm text-gray-700">Available</span>
                </label>
                <button type="button" class="remove-color text-red-500 text-sm ml-2">Remove</button>
            </div>
        </div>
        <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Color Images (optional)</label>
            <input type="file" name="colorImages[]" multiple accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold focus:border-gold">
        </div>
    `;
    
    container.appendChild(newItem);
    initializeColorVariantItem(newItem);
}

// Initialize color variant item
function initializeColorVariantItem(item) {
    const removeBtn = item.querySelector('.remove-color');
    
    // Remove button
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            item.remove();
        });
    }
}

// Profile Management Functions
async function loadProfile() {
    try {
        console.log('👤 Loading admin profile...');
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            console.error('❌ No user data found');
            return;
        }
        
        // Fill profile form
        fillProfileForm(user);
        
        // Update profile card
        updateProfileCard(user);
        
        console.log('✅ Profile loaded');
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

function fillProfileForm(user) {
    // Fill form inputs
    document.getElementById('profile-name-input').value = user.name || '';
    document.getElementById('profile-email-input').value = user.email || '';
    document.getElementById('profile-phone-input').value = user.phone || '';
    document.getElementById('profile-address-input').value = user.address || '';
    
    // Fill additional fields if they exist
    if (user.dateOfBirth) {
        document.getElementById('profile-dob-input').value = user.dateOfBirth;
    }
    if (user.city) {
        document.getElementById('profile-city-input').value = user.city;
    }
    if (user.state) {
        document.getElementById('profile-state-input').value = user.state;
    }
    if (user.pincode) {
        document.getElementById('profile-pincode-input').value = user.pincode;
    }
}

function updateProfileCard(user) {
    // Update profile card display
    document.getElementById('profile-name').textContent = user.name || 'Admin';
    document.getElementById('profile-email').textContent = user.email || 'admin@laiqbags.com';
    
    // Update initials
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
    document.getElementById('profile-initials').textContent = initials;
    
    // Update joined date
    const joinedDate = user.createdAt ? new Date(user.createdAt).getFullYear() : '2024';
    document.getElementById('profile-joined').textContent = joinedDate;
}

async function updateProfile(e) {
    e.preventDefault();
    
    try {
        console.log('💾 Updating admin profile...');
        
        const formData = new FormData(e.target);
        const profileData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            dateOfBirth: formData.get('dateOfBirth'),
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode')
        };
        
        console.log('📝 Profile data being sent:', profileData);
        console.log('🔑 Current token:', localStorage.getItem('token'));
        
        // Get current user data
        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        // Check if email is being changed
        if (profileData.email && profileData.email !== currentUser.email) {
            const shouldContinue = confirm(`⚠️ Email Change Confirmation\n\nYou are changing your email from:\n${currentUser.email}\n\nTo:\n${profileData.email}\n\nThis will be your new login email.\n\nDo you want to continue?`);
            
            if (!shouldContinue) {
                showToast('Email change cancelled', 'info');
                return;
            }
        }
        
        const response = await api.updateProfile(profileData);
        
        if (response.success) {
            showToast('Profile updated successfully!', 'success');
            
            // Update local storage
            const updatedUser = { ...currentUser, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update profile card
            updateProfileCard(updatedUser);
            
            console.log('✅ Profile updated');
        } else {
            showToast(response.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        console.error('❌ Error details:', error.message);
        if (error.response) {
            console.error('❌ Error response:', error.response);
        }
        showToast('Failed to update profile', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();
    
    try {
        console.log('🔐 Changing admin password...');
        
        const formData = new FormData(e.target);
        const passwordData = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        console.log('🔑 Password data being sent:', {
            currentPassword: passwordData.currentPassword ? '***' : 'empty',
            newPassword: passwordData.newPassword ? '***' : 'empty',
            confirmPassword: passwordData.confirmPassword ? '***' : 'empty'
        });
        
        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        
        // Validate password length
        if (passwordData.newPassword.length < 6) {
            showToast('New password must be at least 6 characters long', 'error');
            return;
        }
        
        const response = await api.changePassword(passwordData);
        
        if (response.success) {
            showToast('Password changed successfully!', 'success');
            
            // Clear form
            e.target.reset();
            
            // Hide password section
            togglePasswordSection();
            
            console.log('✅ Password changed');
        } else {
            showToast(response.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('❌ Error changing password:', error);
        console.error('❌ Error details:', error.message);
        showToast('Failed to change password', 'error');
    }
}

function togglePasswordSection() {
    const passwordSection = document.getElementById('password-section');
    const isHidden = passwordSection.classList.contains('hidden');
    
    if (isHidden) {
        passwordSection.classList.remove('hidden');
        document.getElementById('change-password-btn').textContent = 'Cancel';
    } else {
        passwordSection.classList.add('hidden');
        document.getElementById('change-password-btn').textContent = 'Change Password';
        document.getElementById('password-form').reset();
    }
}

// Convert file to base64 data URL
function convertFileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}

// Compress image quality to reduce size
async function compressImageQuality(dataUrl, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to compressed data URL
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
} 

// Load discounts
async function loadDiscounts() {
    try {
        console.log('🎯 Loading discounts...');
        
        // Check if user is authenticated as admin
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No admin token found');
            showToast('Please login as admin to view discounts', 'error');
            return;
        }
        
        // Use admin products endpoint with pagination to avoid massive payloads
        const response = await api.getAdminProducts({ page: 1, limit: 100 });
        const allProducts = response.products || [];
        
        // Filter products with active discounts using real-time validation
        discounts = allProducts.filter(product => {
            const hasDiscount = product.discount && product.discount > 0;
            
            if (!hasDiscount) {
                console.log(`🔍 Product: ${product.name}, Discount: ${product.discount} - No discount`);
                return false;
            }
            
            // Use real-time validation instead of relying on isDiscountActive flag
            const now = new Date();
            let isActive = true;
            let reason = '';
            
            // Check start date
            if (product.discountStartDate && now < new Date(product.discountStartDate)) {
                isActive = false;
                reason = 'Discount not started yet';
            }
            // Check end date
            else if (product.discountEndDate && now > new Date(product.discountEndDate)) {
                isActive = false;
                reason = 'Discount expired';
            }
            
            console.log(`🔍 Product: ${product.name}, Discount: ${product.discount}%, Active: ${isActive}${reason ? ` (${reason})` : ''}`);
            
            return isActive;
        });
        
        renderDiscountsTable();
        updateDiscountStats();
        console.log('✅ Discounts loaded:', discounts.length);
    } catch (error) {
        console.error('❌ Error loading discounts:', error);
        if (error.message.includes('401')) {
            showToast('Please login as admin to view discounts', 'error');
        } else {
            showToast('Failed to load discounts', 'error');
        }
    }
}

// Render discounts table
function renderDiscountsTable() {
    const tbody = document.getElementById('discounts-table-body');
    if (!tbody) return;
    
    if (discounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No active discounts found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = discounts.map(product => {
        const originalPrice = product.price;
        const discountedPrice = product.discountType === 'percentage' 
            ? Math.round(originalPrice - (originalPrice * product.discount / 100))
            : Math.max(0, originalPrice - product.discountAmount);
        const discountPercentage = product.discount;
        const endDate = product.discountEndDate ? new Date(product.discountEndDate).toLocaleDateString() : 'No end date';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-lg object-cover" src="${product.images?.[0]?.url || product.image || ''}" alt="${product.name}">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.category}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-gray-500 line-through">₹${originalPrice.toLocaleString()}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-green-600 font-semibold">₹${discountedPrice.toLocaleString()}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        ${discountPercentage}% OFF
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Active
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${endDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editDiscount('${product._id}')" class="text-gold hover:text-charcoal mr-3">
                        Edit
                    </button>
                    <button onclick="removeDiscount('${product._id}')" class="text-red-600 hover:text-red-900">
                        Remove
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update discount statistics
function updateDiscountStats() {
    const activeCount = discounts.length;
    
    // Calculate upcoming and expired discounts
    let upcomingCount = 0;
    let expiredCount = 0;
    let totalDiscount = 0;
    
    discounts.forEach(product => {
        totalDiscount += product.discount || 0;
        
        // Check if discount is upcoming (has start date in future)
        if (product.discountStartDate && new Date(product.discountStartDate) > new Date()) {
            upcomingCount++;
        }
        
        // Check if discount is expired (has end date in past)
        if (product.discountEndDate && new Date(product.discountEndDate) < new Date()) {
            expiredCount++;
        }
    });
    
    const avgDiscount = discounts.length > 0 ? Math.round(totalDiscount / discounts.length) : 0;
    
    // Use correct element IDs that match the HTML
    const activeElement = document.getElementById('active-discounts-count');
    const upcomingElement = document.getElementById('upcoming-discounts-count');
    const expiredElement = document.getElementById('expired-discounts-count');
    const avgElement = document.getElementById('avg-discount-percent');
    
    if (activeElement) activeElement.textContent = activeCount;
    if (upcomingElement) upcomingElement.textContent = upcomingCount;
    if (expiredElement) expiredElement.textContent = expiredCount;
    if (avgElement) avgElement.textContent = `${avgDiscount}%`;
    
    console.log('📊 Discount stats updated:', { activeCount, upcomingCount, expiredCount, avgDiscount });
}

// Edit discount
function editDiscount(productId) {
    window.open(`/admin-discounts.html?product=${productId}`, '_blank');
}

// Remove discount
async function removeDiscount(productId) {
    try {
        const response = await api.updateProduct(productId, { discount: null });
        if (response.success) {
            showToast('Discount removed successfully', 'success');
            loadDiscounts();
        } else {
            showToast('Error removing discount', 'error');
        }
    } catch (error) {
        console.error('Error removing discount:', error);
        showToast('Error removing discount', 'error');
    }
}

// Refresh discounts
async function refreshDiscounts() {
    try {
        showToast('Refreshing discounts...', 'info');
        await loadDiscounts();
        showToast('Discounts refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing discounts:', error);
        showToast('Error refreshing discounts', 'error');
    }
}

// Newsletter Functions
let currentSubscribersPage = 1;
let newsletterSubscribers = [];

// Show newsletter modal
function showSendNewsletterModal() {
    const modal = document.getElementById('newsletter-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('newsletter-subject').value = '';
        document.getElementById('newsletter-content').value = '';
        document.getElementById('newsletter-tags').value = '';
    }
}

// Close newsletter modal
function closeNewsletterModal() {
    const modal = document.getElementById('newsletter-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Send newsletter
async function sendNewsletter(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('send-newsletter-btn');
    const originalText = submitButton.textContent;
    
    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = '📧 Sending...';
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    const subject = document.getElementById('newsletter-subject').value.trim();
    const content = document.getElementById('newsletter-content').value.trim();
    const tags = document.getElementById('newsletter-tags').value.trim();
    
    if (!subject || !content) {
        showToast('Please fill in all required fields', 'error');
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        return;
    }
    
    try {
        const newsletterData = {
            subject,
            content,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        };
        
        console.log('📧 Sending newsletter:', newsletterData);
        
        const response = await api.sendNewsletter(newsletterData);
        
        console.log('📧 Newsletter response:', response);
        
        if (response.success) {
            // Show success message with details
            const message = `✅ Newsletter sent successfully!\n\n📊 Details:\n• Sent to: ${response.sentCount} subscribers\n• Failed: ${response.failedCount || 0}\n• Total subscribers: ${response.totalSubscribers}`;
            showToast(message, 'success');
            
            // Close modal and refresh stats
            closeNewsletterModal();
            loadNewsletterStats();
            loadNewsletterSubscribers();
            
            // Show additional success feedback
            setTimeout(() => {
                showToast('📧 Newsletter has been delivered to all active subscribers!', 'success');
            }, 2000);
        } else {
            showToast(response.message || 'Error sending newsletter', 'error');
        }
    } catch (error) {
        console.error('❌ Error sending newsletter:', error);
        showToast('Error sending newsletter: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Load newsletter statistics
async function loadNewsletterStats() {
    try {
        const statsContainer = document.getElementById('newsletter-stats');
        
        // If container doesn't exist, safely return
        if (!statsContainer) {
            console.log('Newsletter stats container not found');
            return;
        }

        // Show loading indicator
        statsContainer.innerHTML = `
            <div class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
                <span class="ml-2 text-gray-600">Loading newsletter stats...</span>
            </div>
        `;

        const response = await api.getNewsletterStats();
        
        if (response?.success) {
            const stats = response.stats || {};
            
            // Recreate the stats cards with proper IDs
            statsContainer.innerHTML = `
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-blue-800">Total Subscribers</h3>
                    <p class="text-2xl font-bold text-blue-600" id="total-subscribers">${stats.total || 0}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-green-800">Active</h3>
                    <p class="text-2xl font-bold text-green-600" id="active-subscribers">${stats.active || 0}</p>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-yellow-800">Recent (7 days)</h3>
                    <p class="text-2xl font-bold text-yellow-600" id="recent-subscribers">${stats.recent || 0}</p>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-red-800">Unsubscribed</h3>
                    <p class="text-2xl font-bold text-red-600" id="unsubscribed-count">${stats.unsubscribed || 0}</p>
                </div>
            `;
        } else {
            // Show error state
            statsContainer.innerHTML = `
                <div class="text-center text-red-500 py-4">
                    <p>Failed to load newsletter stats</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading newsletter stats:', error);
        const statsContainer = document.getElementById('newsletter-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="text-center text-red-500 py-4">
                    <p>Failed to load newsletter stats</p>
                </div>
            `;
        }
    }
}

// Load newsletter subscribers
async function loadNewsletterSubscribers() {
    try {
        const search = document.getElementById('subscriber-search')?.value || '';
        const status = document.getElementById('subscriber-status-filter')?.value || '';
        
        // Show loading indicator for subscribers table
        const tbody = document.getElementById('subscribers-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
                            <span class="ml-2 text-gray-600">Loading subscribers...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        const params = {
            page: currentSubscribersPage,
            limit: 20
        };
        
        if (search) params.search = search;
        if (status) params.status = status;
        
        const response = await api.getNewsletterSubscribers(params);
        
        if (response.success) {
            newsletterSubscribers = response.subscribers;
            renderNewsletterSubscribers();
            updateNewsletterPagination(response);
        }
    } catch (error) {
        console.error('Error loading newsletter subscribers:', error);
        showToast('Error loading subscribers', 'error');
        
        // Show error state
        const tbody = document.getElementById('subscribers-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-500">
                        <p>Failed to load subscribers</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Render newsletter subscribers table
function renderNewsletterSubscribers() {
    const tbody = document.getElementById('subscribers-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (newsletterSubscribers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No subscribers found
                </td>
            </tr>
        `;
        return;
    }
    
    newsletterSubscribers.forEach(subscriber => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${subscriber.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriberStatusColor(subscriber.status)}">
                    ${subscriber.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(subscriber.subscribedAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${subscriber.lastEmailSent ? formatDate(subscriber.lastEmailSent) : 'Never'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${subscriber.emailCount || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="updateSubscriberStatus('${subscriber._id}', '${subscriber.status === 'active' ? 'unsubscribed' : 'active'}')" 
                        class="text-blue-600 hover:text-blue-900 mr-2">
                    ${subscriber.status === 'active' ? 'Unsubscribe' : 'Resubscribe'}
                </button>
                <button onclick="deleteSubscriber('${subscriber._id}')" 
                        class="text-red-600 hover:text-red-900">
                    Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Get subscriber status color
function getSubscriberStatusColor(status) {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'unsubscribed':
            return 'bg-red-100 text-red-800';
        case 'bounced':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Update newsletter pagination
function updateNewsletterPagination(response) {
    const start = ((response.currentPage - 1) * 20) + 1;
    const end = Math.min(response.currentPage * 20, response.total);
    
    document.getElementById('subscribers-start').textContent = start;
    document.getElementById('subscribers-end').textContent = end;
    document.getElementById('subscribers-total').textContent = response.total;
    document.getElementById('subscribers-page-info').textContent = `Page ${response.currentPage}`;
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prev-subscribers-page');
    const nextBtn = document.getElementById('next-subscribers-page');
    
    if (prevBtn) {
        prevBtn.disabled = response.currentPage <= 1;
        prevBtn.classList.toggle('opacity-50', response.currentPage <= 1);
    }
    
    if (nextBtn) {
        nextBtn.disabled = response.currentPage >= response.totalPages;
        nextBtn.classList.toggle('opacity-50', response.currentPage >= response.totalPages);
    }
}

// Update subscriber status
async function updateSubscriberStatus(subscriberId, newStatus) {
    try {
        const response = await api.updateNewsletterSubscriberStatus(subscriberId, newStatus);
        
        if (response.success) {
            showToast(`Subscriber ${newStatus} successfully`, 'success');
            loadNewsletterSubscribers();
            loadNewsletterStats();
        } else {
            showToast(response.message || 'Error updating subscriber', 'error');
        }
    } catch (error) {
        console.error('Error updating subscriber status:', error);
        showToast('Error updating subscriber status', 'error');
    }
}

// Delete subscriber
async function deleteSubscriber(subscriberId) {
    if (!confirm('Are you sure you want to delete this subscriber?')) {
        return;
    }
    
    try {
        const response = await api.deleteNewsletterSubscriber(subscriberId);
        
        if (response.success) {
            showToast('Subscriber deleted successfully', 'success');
            loadNewsletterSubscribers();
            loadNewsletterStats();
        } else {
            showToast(response.message || 'Error deleting subscriber', 'error');
        }
    } catch (error) {
        console.error('Error deleting subscriber:', error);
        showToast('Error deleting subscriber', 'error');
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Calculate total stock from color variants
function calculateTotalStock(product) {
    if (!product.colorVariants || !Array.isArray(product.colorVariants)) {
        return product.stock || 0; // Fallback to legacy stock
    }
    
    return product.colorVariants.reduce((total, variant) => {
        return total + (variant.stock || 0);
    }, 0);
}

// Initialize shop page

// ==================== CONTACT MESSAGES FUNCTIONS ====================

// Load contact messages
async function loadContactMessages(page = 1, limit = 10) {
    try {
        const status = document.getElementById('message-status-filter')?.value || '';
        const search = document.getElementById('message-search')?.value || '';
        
        const response = await fetch(`https://www.laiq.shop/api/contact/messages?page=${page}&limit=${limit}&status=${status}&search=${encodeURIComponent(search)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('customerToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            contactMessages = data.contacts;
            messagesPagination = {
                currentPage: data.pagination.page,
                totalPages: data.pagination.totalPages,
                totalMessages: data.pagination.totalDocs,
                limit: data.pagination.limit
            };
            
            renderContactMessages();
            updateContactMessagesPagination(data.pagination);
        } else {
            showToast(data.message || 'Error loading messages', 'error');
        }
    } catch (error) {
        console.error('Error loading contact messages:', error);
        showToast('Error loading contact messages', 'error');
    }
}

// Render contact messages table
function renderContactMessages() {
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;
    
    if (contactMessages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No messages found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = contactMessages.map(message => `
        <tr class="hover:bg-gray-50 ${message.status === 'unread' ? 'bg-red-50' : ''}">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gold flex items-center justify-center">
                            <span class="text-white font-semibold">${message.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${message.name}</div>
                        <div class="text-sm text-gray-500">${message.formattedDate}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <a href="mailto:${message.email}" class="text-blue-600 hover:text-blue-800">${message.email}</a>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate" title="${message.message}">
                    ${message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    message.status === 'unread' ? 'bg-red-100 text-red-800' :
                    message.status === 'read' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                }">
                    ${message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${message.formattedDate}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="viewContactMessage('${message._id}')" class="text-blue-600 hover:text-blue-900">
                        View
                    </button>
                    ${message.status === 'unread' ? `
                        <button onclick="markMessageAsRead('${message._id}')" class="text-green-600 hover:text-green-900">
                            Mark Read
                        </button>
                    ` : ''}
                    <button onclick="replyToMessage('${message._id}')" class="text-purple-600 hover:text-purple-900">
                        Reply
                    </button>
                    <button onclick="deleteContactMessage('${message._id}')" class="text-red-600 hover:text-red-900">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update contact messages pagination
function updateContactMessagesPagination(pagination) {
    const start = ((pagination.page - 1) * pagination.limit) + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.totalDocs);
    
    document.getElementById('messages-start').textContent = start;
    document.getElementById('messages-end').textContent = end;
    document.getElementById('messages-total').textContent = pagination.totalDocs;
    document.getElementById('messages-page-info').textContent = `Page ${pagination.page}`;
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prev-messages-page');
    const nextBtn = document.getElementById('next-messages-page');
    
    if (prevBtn) {
        prevBtn.disabled = pagination.page <= 1;
        prevBtn.classList.toggle('opacity-50', pagination.page <= 1);
    }
    
    if (nextBtn) {
        nextBtn.disabled = pagination.page >= pagination.totalPages;
        nextBtn.classList.toggle('opacity-50', pagination.page >= pagination.totalPages);
    }
}

// Load contact messages statistics
async function loadContactMessagesStats() {
    try {
        const response = await fetch('https://www.laiq.shop/api/contact/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('customerToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('total-messages').textContent = data.stats.total;
            document.getElementById('unread-messages').textContent = data.stats.unread;
            document.getElementById('replied-messages').textContent = data.stats.byStatus.replied || 0;
            document.getElementById('today-messages').textContent = data.stats.today;
        }
    } catch (error) {
        console.error('Error loading contact messages stats:', error);
    }
}

// View contact message details
async function viewContactMessage(messageId) {
    try {
        const response = await fetch(`https://www.laiq.shop/api/contact/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('customerToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const message = data.contact;
            const modal = document.getElementById('contact-message-modal');
            const content = document.getElementById('contact-message-content');
            
            content.innerHTML = `
                <div class="space-y-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-gray-900 mb-2">Message Details</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="text-sm font-medium text-gray-700">From:</label>
                                <p class="text-gray-900">${message.name}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700">Email:</label>
                                <p class="text-gray-900">
                                    <a href="mailto:${message.email}" class="text-blue-600 hover:text-blue-800">${message.email}</a>
                                </p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700">Date:</label>
                                <p class="text-gray-900">${message.formattedDate}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-700">Status:</label>
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    message.status === 'unread' ? 'bg-red-100 text-red-800' :
                                    message.status === 'read' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                }">
                                    ${message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-700">Message:</label>
                        <div class="mt-2 p-4 bg-white border border-gray-200 rounded-lg">
                            <p class="text-gray-900 whitespace-pre-wrap">${message.message}</p>
                        </div>
                    </div>
                    
                    ${message.adminReply ? `
                        <div>
                            <label class="text-sm font-medium text-gray-700">Admin Reply:</label>
                            <div class="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p class="text-gray-900 whitespace-pre-wrap">${message.adminReply}</p>
                                <p class="text-sm text-gray-500 mt-2">Replied on: ${message.repliedAt ? new Date(message.repliedAt).toLocaleString() : 'Unknown'}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-end space-x-3">
                        ${message.status === 'unread' ? `
                            <button onclick="markMessageAsRead('${message._id}')" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                                Mark as Read
                            </button>
                        ` : ''}
                        <button onclick="replyToMessage('${message._id}')" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
                            Reply
                        </button>
                        <button onclick="deleteContactMessage('${message._id}')" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            
            modal.classList.remove('hidden');
        } else {
            showToast(data.message || 'Error loading message', 'error');
        }
    } catch (error) {
        console.error('Error viewing contact message:', error);
        showToast('Error loading message details', 'error');
    }
}

// Mark message as read
async function markMessageAsRead(messageId) {
    try {
        const response = await fetch(`https://www.laiq.shop/api/contact/messages/${messageId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('customerToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Message marked as read', 'success');
            loadContactMessages(messagesPagination.currentPage);
            loadContactMessagesStats();
            closeModal('contact-message-modal');
        } else {
            showToast(data.message || 'Error marking message as read', 'error');
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
        showToast('Error marking message as read', 'error');
    }
}

// Reply to message
function replyToMessage(messageId) {
    currentMessageId = messageId;
    
    // Find the message to get the email
    const message = contactMessages.find(m => m._id === messageId);
    if (!message) {
        showToast('Message not found', 'error');
        return;
    }
    
    document.getElementById('reply-to').value = `${message.name} <${message.email}>`;
    document.getElementById('reply-message').value = '';
    
    const modal = document.getElementById('reply-message-modal');
    modal.classList.remove('hidden');
}

// Send reply
async function sendReply() {
    const replyText = document.getElementById('reply-message').value.trim();
    
    if (!replyText) {
        showToast('Please enter a reply message', 'error');
        return;
    }
    
    try {
        const response = await fetch(`https://www.laiq.shop/api/contact/messages/${currentMessageId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('customerToken')}`
            },
            body: JSON.stringify({ reply: replyText })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Reply sent successfully', 'success');
            closeModal('reply-message-modal');
            loadContactMessages(messagesPagination.currentPage);
            loadContactMessagesStats();
            closeModal('contact-message-modal');
        } else {
            showToast(data.message || 'Error sending reply', 'error');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        showToast('Error sending reply', 'error');
    }
}

// Delete contact message
async function deleteContactMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const response = await fetch(`https://www.laiq.shop/api/contact/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('customerToken')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Message deleted successfully', 'success');
            loadContactMessages(messagesPagination.currentPage);
            loadContactMessagesStats();
            closeModal('contact-message-modal');
        } else {
            showToast(data.message || 'Error deleting message', 'error');
        }
    } catch (error) {
        console.error('Error deleting contact message:', error);
        showToast('Error deleting message', 'error');
    }
}

// Refresh contact messages
function refreshContactMessages() {
    loadContactMessages(messagesPagination.currentPage);
    loadContactMessagesStats();
}

// Initialize contact messages event listeners
function initializeContactMessages() {
    // Search functionality
    const searchInput = document.getElementById('message-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            loadContactMessages(1);
        }, 500));
    }
    
    // Status filter
    const statusFilter = document.getElementById('message-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            loadContactMessages(1);
        });
    }
    
    // Pagination
    const prevBtn = document.getElementById('prev-messages-page');
    const nextBtn = document.getElementById('next-messages-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (messagesPagination.currentPage > 1) {
                loadContactMessages(messagesPagination.currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (messagesPagination.currentPage < messagesPagination.totalPages) {
                loadContactMessages(messagesPagination.currentPage + 1);
            }
        });
    }
    
    // Reply form
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendReply();
        });
    }
}

// Function to properly handle image updates
function handleImageUpdate(productId) {
    console.log('🔄 Handling image update for product:', productId);
    
    // Clear the current form
    const form = document.getElementById('product-form');
    if (form) {
        form.reset();
    }
    
    // Clear the image container
    const imageContainer = document.querySelector('#image-upload-container .grid');
    if (imageContainer) {
        imageContainer.innerHTML = '';
    }
    
    // Clear color variants
    const colorContainer = document.getElementById('color-variants-container');
    if (colorContainer) {
        colorContainer.innerHTML = '';
    }
    
    // Reload the product data using the original edit flow
    setTimeout(() => {
        openProductModal(productId);
    }, 500);
}