# Laiq Bags - E-commerce Website

A modern, responsive e-commerce website for Laiq Bags brand.

## 🚀 Features Completed

### ✅ Core Features
- **Responsive Design** - Mobile and desktop optimized
- **Product Catalog** - Shop page with filtering and search
- **Shopping Cart** - Add/remove items, quantity management
- **Wishlist** - Save favorite products
- **User Authentication** - Customer login/register
- **Order Management** - Complete checkout flow
- **Admin Panel** - Product, order, customer management
- **Reviews System** - Product reviews and ratings
- **Password Recovery** - Email-based reset system

### ✅ Technical Features
- **Backend API** - Node.js + Express + MongoDB
- **Frontend** - HTML5 + Tailwind CSS + JavaScript
- **Authentication** - JWT tokens
- **File Upload** - Product images
- **Search & Filter** - Product discovery
- **Responsive UI** - Mobile-first design

## 🔧 Current Status

### ✅ Working Features
- Customer registration and login
- Product browsing and search
- Cart and wishlist management
- Checkout process (COD)
- Order confirmation
- Admin panel
- Customer profile
- Product reviews

### 🚧 Next Steps

#### 1. Payment Gateway Integration
- [ ] **Razorpay Setup**
  - Create Razorpay account
  - Get API keys
  - Test payment flow
- [ ] **Stripe Setup**
  - Create Stripe account
  - Get API keys
  - Test payment flow

#### 2. Email Notifications
- [ ] **Order Confirmation Emails**
- [ ] **Shipping Updates**
- [ ] **Password Reset Emails**

#### 3. Advanced Features
- [ ] **Order Tracking**
- [ ] **Inventory Management**
- [ ] **Discount Coupons**
- [ ] **Analytics Dashboard**

#### 4. Production Deployment
- [ ] **Domain Setup**
- [ ] **SSL Certificate**
- [ ] **Database Optimization**
- [ ] **Performance Optimization**

## 🛠️ Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Python 3 (for local server)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd Laiq_Bags

# Install dependencies
npm install

# Setup environment
cp config.env.example config.env
# Edit config.env with your MongoDB URI

# Start development environment
./dev.sh
```

### Development Scripts
```bash
# Start complete development environment
./dev.sh

# Start backend only
./start-server.sh

# Start frontend only
python3 -m http.server 8000

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. API Timeout Errors
```bash
# Check server status
npm run monitor

# Apply quick fixes
npm run quick-fix

# Restart server
npm run restart
```

#### 2. Products/Orders Not Loading
- **Timeout Issues**: API requests timing out after 20-30 seconds
- **Solution**: Increased timeout to 60 seconds, reduced payload size
- **Check**: Server performance with monitoring script

#### 3. Analytics Errors
- **DOM Element Issues**: Analytics elements not found
- **Solution**: Added safe element checking
- **Check**: Browser console for specific element IDs

#### 4. Server Performance
```bash
# Monitor server health
npm run monitor

# Check MongoDB connection
mongosh --eval "db.runCommand({ping: 1})"

# Clear cache and restart
npm run quick-fix
```

### Performance Optimization
- **Reduced API payload**: Products limit from 20 to 10
- **Increased timeouts**: From 30s to 60s
- **Better error handling**: Graceful fallbacks for missing elements
- **Connection pooling**: Optimized MongoDB settings

### Monitoring Tools
- **Server Monitor**: Real-time health checks
- **Quick Fix Script**: Automated issue resolution
- **Performance Metrics**: Response time tracking
```

## 📱 Access URLs

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Admin Panel**: http://localhost:8000/admin-login.html

## 🔐 Default Credentials

### Admin
- Email: admin@laiqbags.com
- Password: admin123

### Test Customer
- Email: test@example.com
- Password: test123

## 📊 Database Schema

### Collections
- **Users** - Customer accounts
- **Products** - Product catalog
- **Orders** - Order management
- **Reviews** - Product reviews
- **Wishlists** - User wishlists

## 🚀 Deployment

### Environment Variables
```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

### Production Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📞 Support

For support and questions:
- Email: mdhidayatulahsheikh786@gmail.com
- WhatsApp: +91 99999 99999

---

**Laiq Bags - Carry Style with Confidence** 👜 