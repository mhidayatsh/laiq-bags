// Verification Script for Enhanced Order Management Fixes
console.log('🔍 Verifying Enhanced Order Management Fixes');
console.log('===========================================');

// Test 1: Check if API functions exist
function testApiFunctions() {
    console.log('\n🧪 Test 1: Checking API Functions');
    console.log('--------------------------------');
    
    if (typeof api !== 'undefined') {
        console.log('✅ API service is available');
        
        if (typeof api.getAdminDashboard === 'function') {
            console.log('✅ getAdminDashboard function exists');
        } else {
            console.log('❌ getAdminDashboard function missing');
        }
        
        if (typeof api.getDashboardStats === 'function') {
            console.log('✅ getDashboardStats function exists (backward compatibility)');
        } else {
            console.log('❌ getDashboardStats function missing');
        }
        
        if (typeof api.getAdminOrders === 'function') {
            console.log('✅ getAdminOrders function exists');
        } else {
            console.log('❌ getAdminOrders function missing');
        }
    } else {
        console.log('❌ API service not available');
    }
}

// Test 2: Check if enhanced order management functions exist
function testEnhancedOrderManagement() {
    console.log('\n🧪 Test 2: Checking Enhanced Order Management Functions');
    console.log('----------------------------------------------------');
    
    if (typeof checkAdminAuth === 'function') {
        console.log('✅ checkAdminAuth function exists');
    } else {
        console.log('❌ checkAdminAuth function missing');
    }
    
    if (typeof loadStatistics === 'function') {
        console.log('✅ loadStatistics function exists');
    } else {
        console.log('❌ loadStatistics function missing');
    }
    
    if (typeof loadOrders === 'function') {
        console.log('✅ loadOrders function exists');
    } else {
        console.log('❌ loadOrders function missing');
    }
    
    if (typeof showToast === 'function') {
        console.log('✅ showToast function exists');
    } else {
        console.log('❌ showToast function missing');
    }
}

// Test 3: Check if fix functions exist
function testFixFunctions() {
    console.log('\n🧪 Test 3: Checking Fix Functions');
    console.log('--------------------------------');
    
    if (typeof fixEnhancedOrderManagement !== 'undefined') {
        console.log('✅ fixEnhancedOrderManagement object exists');
        
        if (typeof fixEnhancedOrderManagement.runAllFixes === 'function') {
            console.log('✅ runAllFixes function exists');
        } else {
            console.log('❌ runAllFixes function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.fixMissingApiFunctions === 'function') {
            console.log('✅ fixMissingApiFunctions function exists');
        } else {
            console.log('❌ fixMissingApiFunctions function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.fixAuthenticationLogic === 'function') {
            console.log('✅ fixAuthenticationLogic function exists');
        } else {
            console.log('❌ fixAuthenticationLogic function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.fixLoadStatistics === 'function') {
            console.log('✅ fixLoadStatistics function exists');
        } else {
            console.log('❌ fixLoadStatistics function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.fixApiErrorHandling === 'function') {
            console.log('✅ fixApiErrorHandling function exists');
        } else {
            console.log('❌ fixApiErrorHandling function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.fixShowToast === 'function') {
            console.log('✅ fixShowToast function exists');
        } else {
            console.log('❌ fixShowToast function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.addGlobalErrorHandler === 'function') {
            console.log('✅ addGlobalErrorHandler function exists');
        } else {
            console.log('❌ addGlobalErrorHandler function missing');
        }
        
        if (typeof fixEnhancedOrderManagement.initializeEnhancedOrderManagement === 'function') {
            console.log('✅ initializeEnhancedOrderManagement function exists');
        } else {
            console.log('❌ initializeEnhancedOrderManagement function missing');
        }
    } else {
        console.log('❌ fixEnhancedOrderManagement object missing');
    }
}

// Test 4: Check if debug functions exist
function testDebugFunctions() {
    console.log('\n🧪 Test 4: Checking Debug Functions');
    console.log('-----------------------------------');
    
    if (typeof checkAuthState === 'function') {
        console.log('✅ checkAuthState function exists');
    } else {
        console.log('❌ checkAuthState function missing');
    }
    
    if (typeof clearAllAuth === 'function') {
        console.log('✅ clearAllAuth function exists');
    } else {
        console.log('❌ clearAllAuth function missing');
    }
    
    if (typeof switchToAdmin === 'function') {
        console.log('✅ switchToAdmin function exists');
    } else {
        console.log('❌ switchToAdmin function missing');
    }
    
    if (typeof switchToCustomer === 'function') {
        console.log('✅ switchToCustomer function exists');
    } else {
        console.log('❌ switchToCustomer function missing');
    }
    
    if (typeof testApiCalls === 'function') {
        console.log('✅ testApiCalls function exists');
    } else {
        console.log('❌ testApiCalls function missing');
    }
}

// Test 5: Check authentication state
function testAuthenticationState() {
    console.log('\n🧪 Test 5: Checking Authentication State');
    console.log('----------------------------------------');
    
    const adminToken = localStorage.getItem('token');
    const adminUser = localStorage.getItem('user');
    const customerToken = localStorage.getItem('customerToken');
    const customerUser = localStorage.getItem('customerUser');
    
    console.log('🔑 Admin Token:', adminToken ? '✅ Present' : '❌ Missing');
    console.log('👤 Admin User:', adminUser ? '✅ Present' : '❌ Missing');
    console.log('🔑 Customer Token:', customerToken ? '✅ Present' : '❌ Missing');
    console.log('👤 Customer User:', customerUser ? '✅ Present' : '❌ Missing');
    
    if (adminUser) {
        try {
            const userData = JSON.parse(adminUser);
            console.log('👤 Admin Role:', userData.role || 'N/A');
            console.log('👤 Admin Email:', userData.email || 'N/A');
        } catch (error) {
            console.log('❌ Error parsing admin user data:', error.message);
        }
    }
    
    if (customerUser) {
        try {
            const userData = JSON.parse(customerUser);
            console.log('👤 Customer Role:', userData.role || 'N/A');
            console.log('👤 Customer Email:', userData.email || 'N/A');
        } catch (error) {
            console.log('❌ Error parsing customer user data:', error.message);
        }
    }
}

// Test 6: Check if we're on the right page
function testPageContext() {
    console.log('\n🧪 Test 6: Checking Page Context');
    console.log('--------------------------------');
    
    console.log('📍 Current URL:', window.location.href);
    console.log('📄 Page Title:', document.title);
    
    if (window.location.pathname.includes('enhanced-order-management.html')) {
        console.log('✅ On enhanced order management page');
    } else {
        console.log('⚠️ Not on enhanced order management page');
    }
    
    if (document.getElementById('orders-container')) {
        console.log('✅ Orders container found');
    } else {
        console.log('❌ Orders container not found');
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running all verification tests...');
    
    testApiFunctions();
    testEnhancedOrderManagement();
    testFixFunctions();
    testDebugFunctions();
    testAuthenticationState();
    testPageContext();
    
    console.log('\n✅ All verification tests completed!');
}

// Auto-run tests when script loads
runAllTests();

// Export functions for manual testing
window.verifyFixes = {
    runAllTests,
    testApiFunctions,
    testEnhancedOrderManagement,
    testFixFunctions,
    testDebugFunctions,
    testAuthenticationState,
    testPageContext
};

console.log('\n🎯 Available verification functions:');
console.log('- verifyFixes.runAllTests() - Run all tests');
console.log('- verifyFixes.testApiFunctions() - Test API functions');
console.log('- verifyFixes.testEnhancedOrderManagement() - Test enhanced order management');
console.log('- verifyFixes.testFixFunctions() - Test fix functions');
console.log('- verifyFixes.testDebugFunctions() - Test debug functions');
console.log('- verifyFixes.testAuthenticationState() - Test authentication state');
console.log('- verifyFixes.testPageContext() - Test page context');
