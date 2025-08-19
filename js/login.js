// Function to show login error
function showLoginError(message) {
  // Remove any existing error message
  const existingError = document.getElementById('login-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Create new error message
  const errorDiv = document.createElement('div');
  errorDiv.id = 'login-error';
  errorDiv.className = 'mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm';
  errorDiv.innerHTML = `
    <div class="flex items-center">
      <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      ${message}
    </div>
  `;
  
  // Insert error message after the form
  const form = document.getElementById('login-form');
  if (form) {
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
  }
}

// Show/Hide password functionality
function initializePasswordToggle() {
  const togglePassword = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const passwordEye = document.getElementById('password-eye');
  const passwordEyeSlash = document.getElementById('password-eye-slash');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      if (type === 'text') {
        passwordEye.classList.add('hidden');
        passwordEyeSlash.classList.remove('hidden');
      } else {
        passwordEye.classList.remove('hidden');
        passwordEyeSlash.classList.add('hidden');
      }
    });
  }
}

// Customer Login Handler
document.addEventListener('DOMContentLoaded', function() {
  // Initialize password toggle functionality
  initializePasswordToggle();
  
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Clear previous error messages
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) {
        errorDiv.remove();
      }
      
      try {
        console.log('🔐 Attempting customer login...');
        
        const response = await api.customerLogin(email, password);
        
        if (response.success && response.token) {
          console.log('✅ Customer login successful');
          
          // Store the single token
          localStorage.setItem('customerToken', response.token);
          // Also store user details for immediate UI updates
          if (response.user) {
              localStorage.setItem('customerUser', JSON.stringify(response.user));
          }
          
          // Show success message
          showToast('Login successful! Redirecting...', 'success');
          
          // Redirect to home page
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1500);
        } else {
          // Handle cases where login is not successful but doesn't throw an error
          showLoginError(response.message || 'An unknown error occurred.');
        }
      } catch (error) {
        console.error('❌ Customer login failed:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        // Check for specific error types
        if (error.message.includes('Email address not found')) {
          errorMessage = 'Email address not found. Please check your email or register a new account.';
        } else if (error.message.includes('Incorrect password')) {
          errorMessage = 'Incorrect password. Please check your password and try again.';
        } else if (error.message.includes('Access denied')) {
          errorMessage = 'This email is registered as admin. Please use admin login instead.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Rate limit exceeded')) {
          // Extract retry time from error message
          const retryMatch = error.message.match(/(\d+) seconds/);
          const retrySeconds = retryMatch ? retryMatch[1] : 60;
          errorMessage = `Too many login attempts. Please wait ${retrySeconds} seconds before trying again.`;
          
          // Disable form for retry period
          const submitBtn = document.querySelector('button[type="submit"]');
          const emailInput = document.getElementById('email');
          const passwordInput = document.getElementById('password');
          
          if (submitBtn) submitBtn.disabled = true;
          if (emailInput) emailInput.disabled = true;
          if (passwordInput) passwordInput.disabled = true;
          
          // Re-enable after retry period
          setTimeout(() => {
            if (submitBtn) submitBtn.disabled = false;
            if (emailInput) emailInput.disabled = false;
            if (passwordInput) passwordInput.disabled = false;
            
            // Update error message
            const errorDiv = document.getElementById('login-error');
            if (errorDiv) {
              errorDiv.innerHTML = `
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                  You can now try logging in again.
                </div>
              `;
              errorDiv.className = 'mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg text-sm';
            }
          }, retrySeconds * 1000);
        }
        
        showLoginError(errorMessage);
      }
    });
  }
});
