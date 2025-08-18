# Admin Password Reset System - Laiq Bags

## Overview
Admin ke liye complete password reset system add kiya gaya hai jo secure aur user-friendly hai.

## Features Added

### 1. Backend API Routes
- **POST** `/api/auth/admin/forgot-password` - Admin ke liye password reset email send karta hai
- **PUT** `/api/auth/admin/reset-password/:token` - Admin ka password reset karta hai

### 2. Frontend Pages
- **admin-reset-password.html** - Admin password reset page
- **admin-login.html** - Updated with "Forgot Password" functionality

## How It Works

### Step 1: Admin Forgot Password Request
1. Admin login page par "Forgot Password?" button click karta hai
2. Modal open hota hai jahan admin apna email enter karta hai
3. System check karta hai ki email admin role ke saath exist karta hai ya nahi
4. Agar admin found hota hai, to reset token generate hota hai
5. Reset link email ke through send hota hai

### Step 2: Password Reset Process
1. Admin email mein reset link click karta hai
2. `admin-reset-password.html` page open hota hai with token
3. Admin new password aur confirm password enter karta hai
4. System password validation karta hai (minimum 6 characters, passwords match)
5. Password successfully update ho jata hai

## Security Features

### 1. Role-Based Access
- Sirf admin role wale users hi password reset kar sakte hain
- Customer accounts ke liye separate system hai

### 2. Token Security
- Reset tokens 10 minutes ke liye valid hote hain
- Tokens SHA-256 hash ke through secure kiye gaye hain
- Expired tokens automatically invalid ho jate hain

### 3. Email Verification
- Reset link sirf registered admin email par send hota hai
- Email verification mandatory hai

## API Endpoints

### Forgot Password Request
```http
POST /api/auth/admin/forgot-password
Content-Type: application/json

{
  "email": "admin@laiqbags.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent to: admin@laiqbags.com"
}
```

### Reset Password
```http
PUT /api/auth/admin/reset-password/:token
Content-Type: application/json

{
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully. You can now login with your new password."
}
```

## Error Handling

### Common Error Responses
1. **Invalid Email**: `"No admin account found with this email address"`
2. **Invalid Token**: `"Password reset token is invalid or has expired"`
3. **Password Mismatch**: `"Passwords do not match"`
4. **Short Password**: `"Password must be at least 6 characters long"`
5. **Email Send Failure**: `"Email could not be sent. Please try again later."`

## Frontend Features

### Admin Login Page Updates
- "Forgot Password?" button added
- Modal-based password reset form
- Real-time validation
- Success/error message display
- Auto-close functionality

### Admin Reset Password Page
- Clean, modern UI design
- Password strength validation
- Real-time password matching
- Loading states
- Auto-redirect after success

## Testing

### Test Commands
```bash
# Test forgot password request
curl -X POST http://localhost:3001/api/auth/admin/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@laiqbags.com"}'

# Test password reset (replace TOKEN with actual token)
curl -X PUT http://localhost:3001/api/auth/admin/reset-password/TOKEN \
  -H "Content-Type: application/json" \
  -d '{"password": "newpassword123", "confirmPassword": "newpassword123"}'
```

## Files Modified/Created

### New Files
- `admin-reset-password.html` - Admin password reset page

### Modified Files
- `routes/auth.js` - Added admin password reset routes
- `admin-login.html` - Added forgot password functionality

## Usage Instructions

### For Admins
1. Admin login page par jao
2. "Forgot Password?" button click karo
3. Apna admin email enter karo
4. Email check karo aur reset link click karo
5. New password set karo
6. Login karo with new password

### For Developers
1. Server restart karo after changes
2. Test admin email: `admin@laiqbags.com`
3. Check server logs for debugging
4. Monitor email sending functionality

## Security Notes
- Reset tokens automatically expire after 10 minutes
- Only admin role users can use this system
- All passwords are hashed before storage
- Email verification is required
- Rate limiting can be added for production

## Future Enhancements
1. Rate limiting for password reset requests
2. SMS verification option
3. Two-factor authentication
4. Password history tracking
5. Account lockout after failed attempts 