// Toast notification function
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium shadow-lg transform transition-all duration-300 translate-x-full`;
  
  // Set background color based on type
  switch(type) {
    case 'success':
      toast.className += ' bg-green-500';
      break;
    case 'error':
      toast.className += ' bg-red-500';
      break;
    case 'warning':
      toast.className += ' bg-yellow-500';
      break;
    default:
      toast.className += ' bg-blue-500';
  }
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);
}

// Customer Registration Handler
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // Prevent form from submitting normally
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const address = document.getElementById('address').value;
      
      // Validation
      if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
      }
      
      if (password.length < 8) {
        showToast('Password must be at least 8 characters!', 'error');
        return;
      }
      
      // Check password complexity
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        showToast('Password must contain uppercase, lowercase, number and special character!', 'error');
        return;
      }
      
      if (phone.length !== 10 || !/^\d+$/.test(phone)) {
        showToast('Please enter a valid 10-digit phone number!', 'error');
        return;
      }
      
      try {
        console.log('📝 Attempting customer registration...');
        
        const response = await api.customerRegister({
          name,
          email,
          phone,
          password,
          address
        });
        
        if (response.success) {
          console.log('✅ Customer registration successful');
          
          // Store token and user data (using the same keys as login)
          localStorage.setItem('customerToken', response.token);
          localStorage.setItem('customerUser', JSON.stringify(response.user));
          
          // Show success message
          showToast('Registration successful! Welcome to Laiq Bags!', 'success');
          
          // Redirect to home page after 2 seconds
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Customer registration failed:', error);
        
        let errorMessage = 'Registration failed. Please try again.';
        if (error.message.includes('User already exists')) {
          errorMessage = 'User already exists with this email.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Please check your input and try again.';
        }
        
        showToast(errorMessage, 'error');
      }
    });
  }
});
