#!/usr/bin/env node

/**
 * Test All Customer Modals Close Functionality
 * This script tests if all customer-related modals can be properly closed
 */

console.log('🧪 Testing All Customer Modals Close Functionality...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
    console.log('🌐 Browser environment detected');
    
    // Wait for DOM to be ready
    function waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // Test function for a specific modal
    function testModalClose(modalId, modalName) {
        return new Promise((resolve) => {
            console.log(`🧪 Testing ${modalName} modal...`);
            
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`❌ ${modalName} modal not found!`);
                resolve(false);
                return;
            }
            
            // Check if closeModal function exists
            if (typeof window.closeModal !== 'function') {
                console.error(`❌ closeModal function not found for ${modalName}!`);
                resolve(false);
                return;
            }
            
            // Show modal first
            modal.classList.remove('hidden');
            console.log(`📱 ${modalName} modal shown`);
            
            // Wait a bit then close
            setTimeout(() => {
                console.log(`🔒 Closing ${modalName} modal...`);
                window.closeModal(modalId);
                
                // Check if modal is hidden
                setTimeout(() => {
                    if (modal.classList.contains('hidden')) {
                        console.log(`✅ ${modalName} modal successfully closed!`);
                        resolve(true);
                    } else {
                        console.error(`❌ ${modalName} modal not closed properly!`);
                        resolve(false);
                    }
                }, 100);
            }, 500);
        });
    }
    
    // Main test function
    async function testAllCustomerModals() {
        console.log('⏳ Waiting for DOM to be ready...');
        await waitForDOM();
        
        console.log('✅ DOM ready, testing all customer modals...');
        
        const modalsToTest = [
            { id: 'customer-profile-modal', name: 'Customer Profile' },
            { id: 'edit-customer-modal', name: 'Edit Customer' },
            { id: 'customer-orders-modal', name: 'Customer Orders' },
            { id: 'customer-wishlist-modal', name: 'Customer Wishlist' },
            { id: 'customer-cart-modal', name: 'Customer Cart' }
        ];
        
        let successCount = 0;
        let totalCount = modalsToTest.length;
        
        console.log(`📋 Testing ${totalCount} customer modals...`);
        
        for (const modal of modalsToTest) {
            const success = await testModalClose(modal.id, modal.name);
            if (success) successCount++;
            
            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n📊 Test Results:`);
        console.log(`✅ Successfully closed: ${successCount}/${totalCount} modals`);
        
        if (successCount === totalCount) {
            console.log('🎉 All customer modals are working perfectly!');
        } else {
            console.log('⚠️ Some modals have issues. Check the logs above.');
        }
        
        return successCount === totalCount;
    }
    
    // Run test
    testAllCustomerModals().then(success => {
        if (success) {
            console.log('🎉 All customer modal tests completed successfully!');
        } else {
            console.error('💥 Some customer modal tests failed!');
        }
    });
    
} else {
    console.log('🖥️ Node.js environment detected');
    console.log('ℹ️ This test script is designed for browser environment');
}

console.log('📋 All customer modals test script loaded!');
