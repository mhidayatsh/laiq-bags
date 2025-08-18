#!/usr/bin/env node

/**
 * Authentication Issues Fix Script
 * Fixes common authentication problems in Laiq Bags
 */

console.log('🔧 Starting Authentication Issues Fix...');

// Check if running in browser or Node.js
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
    // Browser environment
    fixAuthInBrowser();
} else {
    // Node.js environment
    console.log('❌ This script should run in browser environment');
    console.log('💡 Open test-auth-state.html in your browser to run this script');
}

function fixAuthInBrowser() {
    console.log('🌐 Running in browser environment');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runFix);
    } else {
        runFix();
    }
}

function runFix() {
    console.log('🚀 Running authentication fix...');
    
    try {
        // Step 1: Check current authentication state
        const currentState = analyzeCurrentState();
        console.log('📊 Current State:', currentState);
        
        // Step 2: Fix token key inconsistencies
        fixTokenKeyInconsistencies();
        
        // Step 3: Clean up invalid tokens
        cleanupInvalidTokens();
        
        // Step 4: Restore proper context
        restoreProperContext();
        
        // Step 5: Verify fix
        const finalState = analyzeCurrentState();
        console.log('✅ Final State:', finalState);
        
        showFixResults(currentState, finalState);
        
    } catch (error) {
        console.error('❌ Error during fix:', error);
        showError('Fix failed: ' + error.message);
    }
}

function analyzeCurrentState() {
    const state = {
        adminToken: !!localStorage.getItem('token'),
        adminUser: !!localStorage.getItem('user'),
        customerToken: !!localStorage.getItem('customerToken'),
        customerUser: !!localStorage.getItem('customerUser'),
        tempAdminToken: !!localStorage.getItem('tempAdminToken'),
        tempCustomerToken: !!localStorage.getItem('tempCustomerToken'),
        hasValidToken: false,
        currentContext: 'none'
    };
    
    // Check if any token is valid
    const tokens = [
        localStorage.getItem('token'),
        localStorage.getItem('customerToken'),
        localStorage.getItem('tempAdminToken'),
        localStorage.getItem('tempCustomerToken')
    ].filter(Boolean);
    
    for (const token of tokens) {
        try {
            const payload = parseJwt(token);
            if (payload && payload.exp && Date.now() < payload.exp * 1000) {
                state.hasValidToken = true;
                break;
            }
        } catch (e) {
            // Invalid token, ignore
        }
    }
    
    // Determine current context
    if (state.adminToken && state.adminUser) {
        state.currentContext = 'admin';
    } else if (state.customerToken && state.customerUser) {
        state.currentContext = 'customer';
    }
    
    return state;
}

function fixTokenKeyInconsistencies() {
    console.log('🔑 Fixing token key inconsistencies...');
    
    // Check if old 'token' key exists and should be 'customerToken'
    const oldToken = localStorage.getItem('token');
    const oldUser = localStorage.getItem('user');
    
    if (oldToken && oldUser) {
        try {
            const payload = parseJwt(oldToken);
            
            // If this is a customer token (no role or role !== 'admin')
            if (!payload.role || payload.role !== 'admin') {
                console.log('🔄 Converting old customer token to new format...');
                
                // Move to customer keys
                localStorage.setItem('customerToken', oldToken);
                localStorage.setItem('customerUser', oldUser);
                
                // Remove old keys
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                console.log('✅ Customer token moved to new keys');
            } else {
                console.log('✅ Admin token is in correct location');
            }
        } catch (error) {
            console.log('⚠️ Could not parse old token, removing...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
}

function cleanupInvalidTokens() {
    console.log('🧹 Cleaning up invalid tokens...');
    
    const keysToCheck = ['token', 'user', 'customerToken', 'customerUser'];
    let cleanedCount = 0;
    
    keysToCheck.forEach(key => {
        const value = localStorage.getItem(key);
        if (value && key.includes('Token')) {
            try {
                const payload = parseJwt(value);
                if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
                    console.log(`⏰ Removing expired token: ${key}`);
                    localStorage.removeItem(key);
                    
                    // Also remove corresponding user data
                    const userKey = key.replace('Token', 'User');
                    if (localStorage.getItem(userKey)) {
                        localStorage.removeItem(userKey);
                        console.log(`🗑️ Removed corresponding user data: ${userKey}`);
                    }
                    
                    cleanedCount++;
                }
            } catch (error) {
                console.log(`❌ Removing invalid token: ${key}`);
                localStorage.removeItem(key);
                cleanedCount++;
            }
        }
    });
    
    console.log(`✅ Cleaned up ${cleanedCount} invalid tokens`);
}

function restoreProperContext() {
    console.log('🔄 Restoring proper authentication context...');
    
    // Check if we have valid tokens in temp storage
    const tempAdminToken = localStorage.getItem('tempAdminToken');
    const tempCustomerToken = localStorage.getItem('tempCustomerToken');
    
    if (tempAdminToken) {
        try {
            const payload = parseJwt(tempAdminToken);
            if (payload && payload.exp && Date.now() < payload.exp * 1000) {
                console.log('🔄 Restoring admin context...');
                localStorage.setItem('token', tempAdminToken);
                localStorage.setItem('user', localStorage.getItem('tempAdminUser') || '{}');
                localStorage.removeItem('tempAdminToken');
                localStorage.removeItem('tempAdminUser');
                console.log('✅ Admin context restored');
            }
        } catch (error) {
            console.log('⚠️ Invalid temp admin token, removing...');
            localStorage.removeItem('tempAdminToken');
            localStorage.removeItem('tempAdminUser');
        }
    }
    
    if (tempCustomerToken) {
        try {
            const payload = parseJwt(tempCustomerToken);
            if (payload && payload.exp && Date.now() < payload.exp * 1000) {
                console.log('🔄 Restoring customer context...');
                localStorage.setItem('customerToken', tempCustomerToken);
                localStorage.setItem('customerUser', localStorage.getItem('tempCustomerUser') || '{}');
                localStorage.removeItem('tempCustomerToken');
                localStorage.removeItem('tempCustomerUser');
                console.log('✅ Customer context restored');
            }
        } catch (error) {
            console.log('⚠️ Invalid temp customer token, removing...');
            localStorage.removeItem('tempCustomerToken');
            localStorage.removeItem('tempCustomerUser');
        }
    }
}

function parseJwt(token) {
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        
        const decoded = atob(base64);
        const jsonPayload = decodeURIComponent(decoded.split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

function showFixResults(before, after) {
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'fix-results';
    resultsDiv.className = 'fixed top-4 right-4 bg-white p-6 rounded-lg shadow-lg border max-w-md z-50';
    resultsDiv.innerHTML = `
        <h3 class="text-lg font-bold mb-4">🔧 Authentication Fix Results</h3>
        <div class="space-y-2 text-sm">
            <div><strong>Before:</strong> ${before.currentContext} (${before.hasValidToken ? 'Valid Token' : 'No Valid Token'})</div>
            <div><strong>After:</strong> ${after.currentContext} (${after.hasValidToken ? 'Valid Token' : 'No Valid Token'})</div>
        </div>
        <div class="mt-4">
            <button onclick="this.parentElement.parentElement.remove()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(resultsDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (resultsDiv.parentElement) {
            resultsDiv.remove();
        }
    }, 10000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fixAuthInBrowser, analyzeCurrentState };
}
