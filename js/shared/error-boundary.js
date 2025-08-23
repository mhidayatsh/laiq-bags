// Error Boundary Handling Module
// Provides comprehensive error handling and user experience improvements

class ErrorBoundary {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 5;
        this.errorWindow = 60000; // 1 minute
        this.lastErrorTime = 0;
        this.errorCallbacks = [];
        this.recoveryStrategies = new Map();
        this.globalErrorHandler = null;
        
        this.initialize();
    }

    // Initialize error boundary
    initialize() {
        console.log('🛡️ Initializing Error Boundary...');
        
        // Setup global error handlers
        this.setupGlobalErrorHandlers();
        
        // Setup unhandled promise rejection handler
        this.setupPromiseRejectionHandler();
        
        // Setup network error handler
        this.setupNetworkErrorHandler();
        
        // Setup recovery strategies
        this.setupRecoveryStrategies();
        
        console.log('✅ Error Boundary initialized');
    }

    // Setup global error handlers
    setupGlobalErrorHandlers() {
        // Window error handler
        this.globalErrorHandler = (event, source, lineno, colno, error) => {
            this.handleError(error, {
                type: 'runtime',
                source: source,
                line: lineno,
                column: colno,
                stack: error?.stack
            });
        };

        window.addEventListener('error', this.globalErrorHandler);

        // Unhandled rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'promise',
                source: 'unhandledrejection'
            });
        });
    }

    // Setup promise rejection handler
    setupPromiseRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            
            this.handleError(event.reason, {
                type: 'promise',
                source: 'unhandledrejection',
                stack: event.reason?.stack
            });
        });
    }

    // Setup network error handler
    setupNetworkErrorHandler() {
        // Intercept fetch errors
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Handle HTTP errors
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            } catch (error) {
                this.handleError(error, {
                    type: 'network',
                    source: 'fetch',
                    url: args[0],
                    options: args[1]
                });
                throw error;
            }
        };
    }

    // Setup recovery strategies
    setupRecoveryStrategies() {
        // Authentication errors
        this.recoveryStrategies.set('auth', {
            pattern: /(unauthorized|forbidden|token expired|authentication)/i,
            action: async (error) => {
                console.log('🔄 Attempting authentication recovery...');
                
                if (window.authModule) {
                    const refreshed = await window.authModule.refreshToken();
                    if (refreshed) {
                        return { recovered: true, action: 'retry' };
                    } else {
                        window.authModule.redirectToLogin('admin');
                        return { recovered: false, action: 'redirect' };
                    }
                }
                
                return { recovered: false, action: 'redirect' };
            }
        });

        // Network errors
        this.recoveryStrategies.set('network', {
            pattern: /(network|fetch|timeout|connection)/i,
            action: async (error) => {
                console.log('🔄 Attempting network recovery...');
                
                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { recovered: true, action: 'retry' };
            }
        });

        // Rate limiting errors
        this.recoveryStrategies.set('rateLimit', {
            pattern: /(rate limit|too many requests|429)/i,
            action: async (error) => {
                console.log('🔄 Rate limit detected, waiting...');
                
                // Wait longer for rate limit
                await new Promise(resolve => setTimeout(resolve, 10000));
                return { recovered: true, action: 'retry' };
            }
        });

        // Server errors
        this.recoveryStrategies.set('server', {
            pattern: /(500|502|503|504|internal server error)/i,
            action: async (error) => {
                console.log('🔄 Server error detected, waiting...');
                
                // Wait and retry for server errors
                await new Promise(resolve => setTimeout(resolve, 5000));
                return { recovered: true, action: 'retry' };
            }
        });
    }

    // Handle errors with recovery strategies
    async handleError(error, context = {}) {
        const now = Date.now();
        
        // Check error rate limiting
        if (now - this.lastErrorTime < this.errorWindow) {
            this.errorCount++;
        } else {
            this.errorCount = 1;
            this.lastErrorTime = now;
        }

        // Log error
        this.logError(error, context);

        // Check if we should stop processing errors
        if (this.errorCount > this.maxErrors) {
            console.error('🚨 Too many errors, stopping error processing');
            this.showCriticalError();
            return;
        }

        // Try to recover from error
        const recovery = await this.attemptRecovery(error, context);
        
        // Notify error callbacks
        this.notifyErrorCallbacks(error, context, recovery);

        // Show user-friendly error message
        this.showUserError(error, context, recovery);
    }

    // Log error with context
    logError(error, context) {
        const errorInfo = {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            type: context.type || 'unknown',
            source: context.source || 'unknown',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...context
        };

        console.error('❌ Error Boundary caught error:', errorInfo);
        
        // Send to error tracking service if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: errorInfo.message,
                fatal: false
            });
        }
    }

    // Attempt to recover from error
    async attemptRecovery(error, context) {
        const errorMessage = error?.message || '';
        
        for (const [strategyName, strategy] of this.recoveryStrategies) {
            if (strategy.pattern.test(errorMessage)) {
                try {
                    console.log(`🔄 Attempting ${strategyName} recovery strategy...`);
                    const result = await strategy.action(error);
                    console.log(`✅ Recovery strategy ${strategyName} result:`, result);
                    return { strategy: strategyName, ...result };
                } catch (recoveryError) {
                    console.error(`❌ Recovery strategy ${strategyName} failed:`, recoveryError);
                }
            }
        }

        return { recovered: false, action: 'none' };
    }

    // Show user-friendly error message
    showUserError(error, context, recovery) {
        const errorMessage = this.getUserFriendlyMessage(error, context, recovery);
        const errorType = this.getErrorType(context);
        
        // Show toast notification
        if (typeof showToast === 'function') {
            showToast(errorMessage, errorType);
        } else {
            // Fallback to console
            console.error(`[${errorType.toUpperCase()}] ${errorMessage}`);
        }

        // Show error modal for critical errors
        if (errorType === 'critical') {
            this.showErrorModal(errorMessage, error, context);
        }
    }

    // Get user-friendly error message
    getUserFriendlyMessage(error, context, recovery) {
        const errorMessage = error?.message || 'An unexpected error occurred';
        
        if (recovery?.recovered) {
            return `Issue resolved automatically. ${errorMessage}`;
        }

        switch (context.type) {
            case 'auth':
                return 'Authentication required. Please login again.';
            case 'network':
                return 'Network connection issue. Please check your internet connection.';
            case 'server':
                return 'Server temporarily unavailable. Please try again later.';
            case 'rateLimit':
                return 'Too many requests. Please wait a moment before trying again.';
            default:
                return errorMessage;
        }
    }

    // Get error type for UI
    getErrorType(context) {
        switch (context.type) {
            case 'auth':
                return 'warning';
            case 'network':
                return 'error';
            case 'server':
                return 'error';
            case 'rateLimit':
                return 'warning';
            default:
                return 'error';
        }
    }

    // Show error modal for critical errors
    showErrorModal(message, error, context) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('error-modal');
        if (!modal) {
            modal = this.createErrorModal();
        }

        // Update modal content
        const title = modal.querySelector('.error-title');
        const content = modal.querySelector('.error-content');
        const details = modal.querySelector('.error-details');

        if (title) title.textContent = 'Error Occurred';
        if (content) content.textContent = message;
        if (details) {
            details.innerHTML = `
                <strong>Error Type:</strong> ${context.type || 'Unknown'}<br>
                <strong>Source:</strong> ${context.source || 'Unknown'}<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
            `;
        }

        // Show modal
        modal.style.display = 'flex';
    }

    // Create error modal
    createErrorModal() {
        const modal = document.createElement('div');
        modal.id = 'error-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex items-center mb-4">
                    <div class="bg-red-100 p-2 rounded-full mr-3">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="error-title text-lg font-semibold text-gray-900">Error Occurred</h3>
                </div>
                <p class="error-content text-gray-600 mb-4"></p>
                <div class="error-details text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded"></div>
                <div class="flex justify-end space-x-3">
                    <button onclick="this.closest('#error-modal').style.display='none'" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Close
                    </button>
                    <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Reload Page
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    // Show critical error (too many errors)
    showCriticalError() {
        const message = 'Too many errors occurred. Please reload the page or contact support.';
        
        if (typeof showToast === 'function') {
            showToast(message, 'critical');
        }
        
        this.showErrorModal(message, new Error('Critical Error'), { type: 'critical' });
    }

    // Subscribe to error events
    onError(callback) {
        this.errorCallbacks.push(callback);
        return () => {
            const index = this.errorCallbacks.indexOf(callback);
            if (index > -1) {
                this.errorCallbacks.splice(index, 1);
            }
        };
    }

    // Notify error callbacks
    notifyErrorCallbacks(error, context, recovery) {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error, context, recovery);
            } catch (callbackError) {
                console.error('❌ Error in error callback:', callbackError);
            }
        });
    }

    // Wrap async function with error handling
    wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                await this.handleError(error, {
                    ...context,
                    source: 'wrapped-function',
                    functionName: fn.name || 'anonymous'
                });
                throw error;
            }
        };
    }

    // Wrap synchronous function with error handling
    wrapSync(fn, context = {}) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError(error, {
                    ...context,
                    source: 'wrapped-function',
                    functionName: fn.name || 'anonymous'
                });
                throw error;
            }
        };
    }

    // Add custom recovery strategy
    addRecoveryStrategy(name, pattern, action) {
        this.recoveryStrategies.set(name, { pattern, action });
        console.log(`✅ Added recovery strategy: ${name}`);
    }

    // Remove recovery strategy
    removeRecoveryStrategy(name) {
        this.recoveryStrategies.delete(name);
        console.log(`🗑️ Removed recovery strategy: ${name}`);
    }

    // Get error statistics
    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            lastErrorTime: this.lastErrorTime,
            recoveryStrategies: this.recoveryStrategies.size,
            errorCallbacks: this.errorCallbacks.length
        };
    }

    // Reset error count
    resetErrorCount() {
        this.errorCount = 0;
        this.lastErrorTime = 0;
        console.log('🔄 Error count reset');
    }

    // Cleanup error boundary
    cleanup() {
        if (this.globalErrorHandler) {
            window.removeEventListener('error', this.globalErrorHandler);
        }
        
        this.errorCallbacks = [];
        this.recoveryStrategies.clear();
        
        console.log('🧹 Error Boundary cleaned up');
    }
}

// Create global instance
const errorBoundary = new ErrorBoundary();

// Export for use in other modules
window.errorBoundary = errorBoundary;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = errorBoundary;
}

console.log('🛡️ Error Boundary loaded and ready');
