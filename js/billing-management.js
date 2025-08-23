// Billing Management JavaScript
let transactions = [];
let currentPage = 1;
let totalPages = 1;
let currentTransactionId = null;
let filters = {
    status: '',
    paymentMethod: '',
    date: '',
    search: ''
};

// Check if user is logged in as admin
async function checkAdminAuth() {
    let token = localStorage.getItem('token'); // Admin token
    let user = localStorage.getItem('user'); // Admin user
    
    console.log('🔍 Checking admin authentication for billing management...');
    console.log('🔑 Admin token exists:', !!token);
    console.log('👤 Admin user data exists:', !!user);
    
    // Check if customer is also logged in
    const customerToken = localStorage.getItem('customerToken');
    const customerUser = localStorage.getItem('customerUser');
    
    if (customerToken && customerUser) {
        console.log('⚠️ Customer session detected alongside admin session');
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
                    console.log('❌ Customer is not admin, redirecting to login');
                    showToast('Please login as admin to access billing management', 'error');
                    setTimeout(() => {
                        window.location.href = '/admin-login.html';
                    }, 2000);
                    return false;
                }
            } catch (error) {
                console.error('❌ Error parsing customer data:', error);
                showToast('Authentication error. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/admin-login.html';
                }, 2000);
                return false;
            }
        } else {
            console.log('❌ No authentication found, redirecting to login');
            showToast('Please login as admin to access billing management', 'error');
            setTimeout(() => {
                window.location.href = '/admin-login.html';
            }, 2000);
            return false;
        }
    }
    
    if (!token || !user) {
        console.log('❌ Invalid authentication, redirecting to login');
        showToast('Please login as admin to access billing management', 'error');
        setTimeout(() => {
            window.location.href = '/admin-login.html';
        }, 2000);
        return false;
    }
    
    console.log('✅ Admin authentication verified');
    return true;
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('💰 Billing Management initialized');
    
    // Clear any conflicting sessions first
    clearConflictingSessions();
    
    // Check authentication first
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
        return;
    }
    
    loadTransactions();
    loadStatistics();
    initializeEventListeners();
    setInterval(loadStatistics, 30000);
});

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

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('payment-status-filter').addEventListener('change', handleFilterChange);
    document.getElementById('payment-method-filter').addEventListener('change', handleFilterChange);
    document.getElementById('date-filter').addEventListener('change', handleFilterChange);
    
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filters.search = e.target.value;
            currentPage = 1;
            loadTransactions();
        }, 500);
    });
    
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadTransactions();
        loadStatistics();
        showToast('Data refreshed successfully!', 'success');
    });
    
    document.getElementById('refund-form').addEventListener('submit', handleRefund);
}

// Handle filter changes
function handleFilterChange(e) {
    const filterType = e.target.id.replace('-filter', '');
    filters[filterType] = e.target.value;
    currentPage = 1;
    loadTransactions();
}

// Load transactions
async function loadTransactions() {
    try {
        const container = document.getElementById('transactions-container');
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                <span class="ml-3 text-lg text-gray-600">Loading transactions...</span>
            </div>
        `;
        
        const params = new URLSearchParams({ page: currentPage, limit: 10 });
        if (filters.status) params.append('status', filters.status);
        if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);
        
        const response = await api.getAdminOrders(`?${params.toString()}`);
        
        if (response.success) {
            transactions = response.orders || [];
            totalPages = response.totalPages || 1;
            renderTransactions();
            renderPagination();
        } else {
            throw new Error('Failed to load transactions');
        }
    } catch (error) {
        console.error('❌ Error loading transactions:', error);
        showToast('Failed to load transactions', 'error');
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await api.getDashboardStats();
        if (response.success) {
            const data = response.data;
            
            // Update financial overview
            document.getElementById('total-revenue').textContent = `₹${(data.totalRevenue || 0).toLocaleString()}`;
            document.getElementById('pending-payments').textContent = `₹${(data.pendingPayments || 0).toLocaleString()}`;
            document.getElementById('total-refunds').textContent = `₹${(data.totalRefunds || 0).toLocaleString()}`;
            document.getElementById('net-revenue').textContent = `₹${((data.totalRevenue || 0) - (data.totalRefunds || 0)).toLocaleString()}`;
            
            // Update payment methods
            document.getElementById('razorpay-amount').textContent = `₹${(data.razorpayAmount || 0).toLocaleString()}`;
            document.getElementById('cod-amount').textContent = `₹${(data.codAmount || 0).toLocaleString()}`;
            document.getElementById('stripe-amount').textContent = `₹${(data.stripeAmount || 0).toLocaleString()}`;
            
            // Update payment status
            document.getElementById('completed-payments').textContent = `₹${(data.completedPayments || 0).toLocaleString()}`;
            document.getElementById('pending-amount').textContent = `₹${(data.pendingAmount || 0).toLocaleString()}`;
            document.getElementById('failed-amount').textContent = `₹${(data.failedAmount || 0).toLocaleString()}`;
        }
    } catch (error) {
        console.error('❌ Error loading statistics:', error);
    }
}

// Render transactions
function renderTransactions() {
    const container = document.getElementById('transactions-container');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p class="text-lg">No transactions found</p>
                <p class="text-sm">Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    const transactionsHTML = transactions.map(transaction => `
        <div class="billing-card bg-white border border-gray-200 rounded-lg p-6 mb-4 hover:shadow-md transition-all">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div class="lg:col-span-2">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h3 class="font-semibold text-charcoal">Order #${transaction._id.slice(-8)}</h3>
                            <p class="text-sm text-gray-600">${new Date(transaction.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium payment-status status-${transaction.paymentInfo?.status?.toLowerCase() || 'pending'}">
                            ${transaction.paymentInfo?.status?.toUpperCase() || 'PENDING'}
                        </span>
                    </div>
                    
                    <div class="mb-3">
                        <p class="font-medium text-charcoal">${transaction.user?.name || 'N/A'}</p>
                        <p class="text-sm text-gray-600">${transaction.user?.email || 'N/A'}</p>
                    </div>
                    
                    <div class="space-y-2">
                        ${transaction.orderItems?.slice(0, 2).map(item => `
                            <div class="flex items-center gap-3 text-sm">
                                <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMkMxNC40NzcgMTIgMTAgMTYuNDc3IDEwIDIyQzEwIDI3LjUyMyAxNC40NzcgMzIgMjAgMzJDMjUuNTIzIDMyIDMwIDI3LjUyMyAzMCAyMkMzMCAxNi40NzcgMjUuNTIzIDEyIDIwIDEyWk0yMCAyNkMxNy43OTEgMjYgMTYgMjQuMjA5IDE2IDIyQzE2IDE5Ljc5MSAxNy43OTEgMTggMjAgMThDMjIuMjA5IDE4IDI0IDE5Ljc5MSAyNCAyMkMyNCAyNC4yMDkgMjIuMjA5IDI2IDIwIDI2WiIgZmlsbD0iIzlDQTBBNiIvPgo8L3N2Zz4K'}" 
                                     alt="${item.name}" class="w-10 h-10 object-cover rounded">
                                <div class="flex-1">
                                    <p class="font-medium text-charcoal">${item.name}</p>
                                    <p class="text-gray-600">Qty: ${item.quantity} × ₹${item.price}</p>
                                </div>
                            </div>
                        `).join('')}
                        ${transaction.orderItems?.length > 2 ? `<p class="text-sm text-gray-500">+${transaction.orderItems.length - 2} more items</p>` : ''}
                    </div>
                </div>
                
                <div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">Amount</p>
                        <p class="text-xl font-bold text-gold">₹${(transaction.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">Payment Method</p>
                        <p class="font-medium text-charcoal">${transaction.paymentMethod?.toUpperCase() || 'N/A'}</p>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm text-gray-600">Transaction ID</p>
                        <p class="font-medium text-charcoal">${transaction.paymentInfo?.razorpayPaymentId || transaction.paymentInfo?.stripePaymentIntentId || 'N/A'}</p>
                    </div>
                </div>
                
                <div class="flex flex-col gap-2">
                    <button onclick="viewTransactionDetails('${transaction._id}')" 
                            class="w-full bg-gold text-white px-4 py-2 rounded-lg hover:bg-charcoal transition-colors text-sm">
                        <i class="fas fa-eye mr-2"></i>View Details
                    </button>
                    
                    ${transaction.paymentInfo?.status === 'completed' && transaction.status !== 'cancelled' ? `
                        <button onclick="openRefundModal('${transaction._id}')" 
                                class="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                            <i class="fas fa-undo mr-2"></i>Process Refund
                        </button>
                    ` : ''}
                    
                    <button onclick="printInvoice('${transaction._id}')" 
                            class="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        <i class="fas fa-print mr-2"></i>Print Invoice
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = transactionsHTML;
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
    loadTransactions();
}

// View transaction details
async function viewTransactionDetails(transactionId) {
    try {
        const response = await api.getOrder(transactionId);
        if (response.success) {
            const transaction = response.order;
            currentTransactionId = transactionId;
            renderTransactionModal(transaction);
            document.getElementById('transaction-modal').classList.remove('hidden');
        } else {
            throw new Error('Failed to load transaction details');
        }
    } catch (error) {
        console.error('❌ Error loading transaction details:', error);
        showToast('Failed to load transaction details', 'error');
    }
}

// Render transaction modal
function renderTransactionModal(transaction) {
    const container = document.getElementById('transaction-modal-content');
    
    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-charcoal mb-3">Transaction Information</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-gray-600">Order ID</p>
                        <p class="font-medium">#${transaction._id.slice(-8)}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Transaction Date</p>
                        <p class="font-medium">${new Date(transaction.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Payment Status</p>
                        <span class="px-2 py-1 rounded-full text-xs font-medium payment-status status-${transaction.paymentInfo?.status?.toLowerCase() || 'pending'}">
                            ${transaction.paymentInfo?.status?.toUpperCase() || 'PENDING'}
                        </span>
                    </div>
                    <div>
                        <p class="text-gray-600">Amount</p>
                        <p class="font-bold text-gold">₹${(transaction.totalAmount || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-charcoal mb-3">Payment Details</h4>
                <div class="space-y-2 text-sm">
                    <div>
                        <p class="text-gray-600">Payment Method</p>
                        <p class="font-medium">${transaction.paymentMethod?.toUpperCase() || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Transaction ID</p>
                        <p class="font-medium">${transaction.paymentInfo?.razorpayPaymentId || transaction.paymentInfo?.stripePaymentIntentId || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Paid At</p>
                        <p class="font-medium">${transaction.paidAt ? new Date(transaction.paidAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-charcoal mb-3">Customer Information</h4>
                <div class="space-y-2 text-sm">
                    <div>
                        <p class="text-gray-600">Name</p>
                        <p class="font-medium">${transaction.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600">Email</p>
                        <p class="font-medium">${transaction.user?.email || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            ${transaction.cancellationDetails?.refundAmount ? `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-charcoal mb-3">Refund Information</h4>
                    <div class="space-y-2 text-sm">
                        <div>
                            <p class="text-gray-600">Refund Amount</p>
                            <p class="font-medium text-red-600">₹${transaction.cancellationDetails.refundAmount}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Refund Status</p>
                            <p class="font-medium">${transaction.cancellationDetails.refundStatus}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Refund Method</p>
                            <p class="font-medium">${transaction.cancellationDetails.refundMethod}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Refunded At</p>
                            <p class="font-medium">${transaction.cancellationDetails.refundedAt ? new Date(transaction.cancellationDetails.refundedAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Modal functions
function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
    currentTransactionId = null;
}

function openRefundModal(transactionId) {
    currentTransactionId = transactionId;
    document.getElementById('refund-modal').classList.remove('hidden');
    
    const transaction = transactions.find(t => t._id === transactionId);
    if (transaction) {
        document.getElementById('refund-amount').value = transaction.totalAmount || 0;
    }
}

function closeRefundModal() {
    document.getElementById('refund-modal').classList.add('hidden');
    document.getElementById('refund-form').reset();
    currentTransactionId = null;
}

// Handle refund
async function handleRefund(e) {
    e.preventDefault();
    
    try {
        const refundAmount = parseFloat(document.getElementById('refund-amount').value);
        const refundMethod = document.getElementById('refund-method').value;
        const refundReason = document.getElementById('refund-reason').value;
        
        if (!currentTransactionId) {
            showToast('No transaction selected', 'error');
            return;
        }
        
        const response = await api.processRefund(currentTransactionId, {
            refundAmount,
            refundMethod,
            reason: refundReason
        });
        
        if (response.success) {
            showToast('Refund processed successfully!', 'success');
            closeRefundModal();
            loadTransactions();
            loadStatistics();
        } else {
            throw new Error('Failed to process refund');
        }
    } catch (error) {
        console.error('❌ Error processing refund:', error);
        showToast('Failed to process refund', 'error');
    }
}

// Print invoice
function printInvoice(transactionId) {
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction) {
        showToast('Transaction not found', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice #${transaction._id.slice(-8)} - Laiq Bags</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-info { margin-bottom: 20px; }
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
                    <h2>Invoice #${transaction._id.slice(-8)}</h2>
                    <p>Date: ${new Date(transaction.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                
                <div class="invoice-info">
                    <h3>Invoice Information</h3>
                    <p><strong>Payment Status:</strong> ${transaction.paymentInfo?.status?.toUpperCase()}</p>
                    <p><strong>Payment Method:</strong> ${transaction.paymentMethod?.toUpperCase()}</p>
                    <p><strong>Transaction ID:</strong> ${transaction.paymentInfo?.razorpayPaymentId || transaction.paymentInfo?.stripePaymentIntentId || 'N/A'}</p>
                </div>
                
                <div class="customer-info">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${transaction.user?.name}</p>
                    <p><strong>Email:</strong> ${transaction.user?.email}</p>
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
                            ${transaction.orderItems?.map(item => `
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
                    <p><strong>Total Amount: ₹${(transaction.totalAmount || 0).toLocaleString()}</strong></p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Export transactions to CSV
function exportTransactions() {
    const csvContent = [
        ['Order ID', 'Customer', 'Email', 'Amount', 'Payment Method', 'Status', 'Date', 'Transaction ID'],
        ...transactions.map(transaction => [
            transaction._id.slice(-8),
            transaction.user?.name || 'N/A',
            transaction.user?.email || 'N/A',
            transaction.totalAmount || 0,
            transaction.paymentMethod,
            transaction.paymentInfo?.status || 'N/A',
            new Date(transaction.createdAt).toLocaleDateString('en-IN'),
            transaction.paymentInfo?.razorpayPaymentId || transaction.paymentInfo?.stripePaymentIntentId || 'N/A'
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Transactions exported successfully!', 'success');
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
window.closeTransactionModal = closeTransactionModal;
window.openRefundModal = openRefundModal;
window.closeRefundModal = closeRefundModal;
window.viewTransactionDetails = viewTransactionDetails;
window.printInvoice = printInvoice;
window.changePage = changePage;
window.exportTransactions = exportTransactions;
