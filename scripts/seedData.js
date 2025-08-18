const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');

// Sample products data
const sampleProducts = [
  {
    name: "Classic Backpack",
    description: "A timeless backpack perfect for daily use. Features multiple compartments and comfortable shoulder straps.",
    price: 2499,
    images: [{
      public_id: "sample1",
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
    }],
    category: "backpack",
    type: "backpack",
    size: "35 × 25 × 12 cm",
    material: "Premium Canvas",
    stock: 50,
    featured: true,
    bestSeller: true,
    colors: ["Black", "Brown", "Navy"],
    specifications: {
      dimensions: "35 × 25 × 12 cm",
      weight: "1.2 kg",
      capacity: "25L",
      features: ["Laptop compartment", "Water bottle holder", "Anti-theft design"]
    }
  },
  {
    name: "Elegant Sling",
    description: "A sleek sling bag that combines style with functionality. Perfect for your essentials.",
    price: 1799,
    images: [{
      public_id: "sample2",
      url: "https://images.unsplash.com/photo-1526178613658-3f1622045557?auto=format&fit=crop&w=400&q=80"
    }],
    category: "sling",
    type: "sling",
    size: "25 × 18 × 8 cm",
    material: "Leather",
    stock: 30,
    featured: true,
    colors: ["Brown", "Black"],
    specifications: {
      dimensions: "25 × 18 × 8 cm",
      weight: "0.8 kg",
      capacity: "8L",
      features: ["Adjustable strap", "Multiple pockets", "Premium leather"]
    }
  },
  {
    name: "Urban Tote",
    description: "A versatile tote bag that's perfect for work, shopping, or casual outings.",
    price: 2199,
    images: [{
      public_id: "sample3",
      url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80"
    }],
    category: "handbag",
    type: "handbag",
    size: "35 × 25 × 10 cm",
    material: "Cotton Blend",
    stock: 40,
    newArrival: true,
    colors: ["Beige", "Gray", "Black"],
    specifications: {
      dimensions: "35 × 25 × 10 cm",
      weight: "0.9 kg",
      capacity: "20L",
      features: ["Reusable", "Eco-friendly", "Spacious"]
    }
  }
];

// Sample admin user
const adminUser = {
  name: "Admin User",
  email: "admin@laiqbags.com",
  password: "admin123",
  phone: "9876543210",
  role: "admin",
  emailVerified: true,
  address: {
    street: "Admin Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India"
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  seedData();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function seedData() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    
    console.log('🗑️ Cleared existing data');

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminUser.password, 12);
    const admin = await User.create({
      ...adminUser,
      password: hashedPassword
    });
    
    console.log('👤 Admin user created:', admin.email);

    // Create products
    const products = await Product.create(
      sampleProducts.map(product => ({
        ...product,
        createdBy: admin._id
      }))
    );
    
    console.log('📦 Products created:', products.length);

    console.log('✅ Sample data seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Email: admin@laiqbags.com');
    console.log('Password: admin123');
    console.log('\n🔗 API URL: http://localhost:3001/api');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
} 