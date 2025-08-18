#!/usr/bin/env node

/**
 * Test Customer Cart Modal Close Functionality
 * This script tests if the customer cart modal can be properly closed
 */

console.log('🧪 Testing Customer Cart Modal Close Functionality...');

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
    
    // Test function
    async function testCustomerCartModal() {
        console.log('⏳ Waiting for DOM to be ready...');
        await waitForDOM();
        
        console.log('✅ DOM ready, testing customer cart modal...');
        
        // Test 1: Check if modal exists
        const modal = document.getElementById('customer-cart-modal');
        if (!modal) {
            console.error('❌ Customer cart modal not found!');
            return false;
        }
        console.log('✅ Customer cart modal found');
        
        // Test 2: Check if closeModal function exists
        if (typeof window.closeModal !== 'function') {
            console.error('❌ closeModal function not found!');
            return false;
        }
        console.log('✅ closeModal function found');
        
        // Test 3: Test modal close functionality
        console.log('🧪 Testing modal close functionality...');
        
        // Show modal first
        modal.classList.remove('hidden');
        console.log('📱 Modal shown');
        
        // Wait a bit then close
        setTimeout(() => {
            console.log('🔒 Closing modal...');
            window.closeModal('customer-cart-modal');
            
            // Check if modal is hidden
            setTimeout(() => {
                if (modal.classList.contains('hidden')) {
                    console.log('✅ Modal successfully closed!');
                } else {
                    console.error('❌ Modal not closed properly!');
                }
            }, 100);
        }, 500);
        
        return true;
    }
    
    // Run test
    testCustomerCartModal().then(success => {
        if (success) {
            console.log('🎉 Customer cart modal test completed successfully!');
        } else {
            console.error('💥 Customer cart modal test failed!');
        }
    });
    
} else {
    console.log('🖥️ Node.js environment detected');
    console.log('ℹ️ This test script is designed for browser environment');
}

console.log('📋 Customer cart modal test script loaded!');
