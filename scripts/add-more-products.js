const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');

// Additional sample products
const additionalProducts = [
    {
        name: "Travel Duffel Bag",
        description: "Durable duffel bag perfect for gym, travel, and sports activities.",
        price: 1599,
        images: [{ public_id: "duffel-bag", url: "/assets/placeholder-bag-4.jpg" }],
        category: "travel-bag",
        type: "backpack",
        size: "50 × 25 × 25 cm",
        material: "Nylon",
        stock: 30,
        colors: ["Black", "Blue", "Red"],
        specifications: {
            dimensions: { length: "50", width: "25", height: "25", display: "50 × 25 × 25 cm" },
            weight: "0.8 kg",
            capacity: "40L",
            features: ["Water-resistant", "Durable", "Lightweight", "Multiple pockets"]
        }
    },
    {
        name: "Laptop Messenger Bag",
        description: "Professional messenger bag with dedicated laptop protection and business organization.",
        price: 2299,
        images: [{ public_id: "messenger-bag", url: "/assets/placeholder-bag-5.jpg" }],
        category: "laptop-bag",
        type: "handbag",
        size: "42 × 32 × 8 cm",
        material: "Canvas & Leather",
        stock: 20,
        featured: true,
        colors: ["Brown", "Black", "Navy"],
        specifications: {
            dimensions: { length: "42", width: "32", height: "8", display: "42 × 32 × 8 cm" },
            weight: "1.2 kg",
            capacity: "20L",
            features: ["Laptop protection", "Business organization", "Professional design"]
        }
    },
    {
        name: "Premium Leather Backpack",
        description: "Handcrafted premium leather backpack with multiple compartments and laptop sleeve.",
        price: 3499,
        images: [{ public_id: "leather-backpack", url: "/assets/placeholder-bag-1.jpg" }],
        category: "backpack",
        type: "backpack",
        size: "40 × 30 × 15 cm",
        material: "Genuine Leather",
        stock: 25,
        featured: true,
        bestSeller: true,
        colors: ["Brown", "Black", "Tan"],
        specifications: {
            dimensions: { length: "40", width: "30", height: "15", display: "40 × 30 × 15 cm" },
            weight: "1.5 kg",
            capacity: "30L",
            features: ["Laptop compartment", "Water bottle holder", "Anti-theft design", "Premium leather"]
        }
    },
    {
        name: "Stylish Crossbody Bag",
        description: "Elegant crossbody bag perfect for daily essentials and casual outings.",
        price: 1899,
        images: [{ public_id: "crossbody-bag", url: "/assets/placeholder-bag-2.jpg" }],
        category: "sling",
        type: "sling",
        size: "28 × 20 × 8 cm",
        material: "Canvas & Leather",
        stock: 40,
        featured: true,
        colors: ["Navy", "Beige", "Black"],
        specifications: {
            dimensions: { length: "28", width: "20", height: "8", display: "28 × 20 × 8 cm" },
            weight: "0.6 kg",
            capacity: "12L",
            features: ["Adjustable strap", "Multiple pockets", "Water-resistant"]
        }
    },
    {
        name: "Professional Tote Bag",
        description: "Spacious tote bag ideal for work, shopping, and travel with organized compartments.",
        price: 2799,
        images: [{ public_id: "tote-bag", url: "/assets/placeholder-bag-3.jpg" }],
        category: "tote",
        type: "handbag",
        size: "38 × 28 × 12 cm",
        material: "Cotton Blend",
        stock: 35,
        newArrival: true,
        colors: ["Gray", "Black", "Beige"],
        specifications: {
            dimensions: { length: "38", width: "28", height: "12", display: "38 × 28 × 12 cm" },
            weight: "1.1 kg",
            capacity: "25L",
            features: ["Reusable", "Eco-friendly", "Spacious", "Organized compartments"]
        }
    },
    {
        name: "Compact Waist Bag",
        description: "Modern waist bag perfect for hands-free carrying during workouts and outdoor activities.",
        price: 899,
        images: [{ public_id: "waist-bag", url: "/assets/placeholder-bag-6.jpg" }],
        category: "sling",
        type: "sling",
        size: "20 × 15 × 6 cm",
        material: "Nylon",
        stock: 50,
        colors: ["Black", "Gray", "Blue"],
        specifications: {
            dimensions: { length: "20", width: "15", height: "6", display: "20 × 15 × 6 cm" },
            weight: "0.3 kg",
            capacity: "5L",
            features: ["Adjustable waist strap", "Water-resistant", "Lightweight", "Multiple compartments"]
        }
    },
    {
        name: "Executive Briefcase",
        description: "Professional briefcase with premium leather finish and organized interior.",
        price: 3999,
        images: [{ public_id: "briefcase", url: "/assets/placeholder-bag-1.jpg" }],
        category: "laptop-bag",
        type: "handbag",
        size: "45 × 35 × 10 cm",
        material: "Premium Leather",
        stock: 15,
        featured: true,
        colors: ["Brown", "Black"],
        specifications: {
            dimensions: { length: "45", width: "35", height: "10", display: "45 × 35 × 10 cm" },
            weight: "1.8 kg",
            capacity: "25L",
            features: ["Laptop protection", "Document organizer", "Premium leather", "Professional design"]
        }
    },
    {
        name: "Weekend Travel Bag",
        description: "Spacious weekend bag perfect for short trips and getaways.",
        price: 1899,
        images: [{ public_id: "weekend-bag", url: "/assets/placeholder-bag-2.jpg" }],
        category: "travel-bag",
        type: "backpack",
        size: "55 × 30 × 20 cm",
        material: "Canvas",
        stock: 25,
        colors: ["Beige", "Navy", "Olive"],
        specifications: {
            dimensions: { length: "55", width: "30", height: "20", display: "55 × 30 × 20 cm" },
            weight: "1.0 kg",
            capacity: "35L",
            features: ["Spacious interior", "Durable canvas", "Weekend perfect", "Easy to carry"]
        }
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    addMoreProducts();
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function addMoreProducts() {
    try {
        // Get admin user for createdBy field
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.error('❌ Admin user not found. Please run seedData.js first.');
            process.exit(1);
        }

        // Check existing products to avoid duplicates
        const existingProducts = await Product.find({}, 'name');
        const existingNames = existingProducts.map(p => p.name.toLowerCase());
        
        // Filter out products that already exist
        const newProducts = additionalProducts.filter(product => 
            !existingNames.includes(product.name.toLowerCase())
        );

        if (newProducts.length === 0) {
            console.log('✅ All products already exist in database');
            process.exit(0);
        }

        // Add createdBy field and slug to products
        const productsWithCreator = newProducts.map(product => ({
            ...product,
            createdBy: adminUser._id,
            slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        }));

        // Create products
        const products = await Product.insertMany(productsWithCreator);
        console.log(`📦 Added ${products.length} new products`);

        // Show all products in database
        const allProducts = await Product.find({}, 'name price category');
        console.log('\n📦 All Products in Database:');
        allProducts.forEach(product => {
            console.log(`  - ${product.name} (₹${product.price}) - ${product.category}`);
        });

        console.log(`\n✅ Successfully added ${products.length} new products!`);
        console.log(`📊 Total products in database: ${allProducts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding products:', error);
        process.exit(1);
    }
}
