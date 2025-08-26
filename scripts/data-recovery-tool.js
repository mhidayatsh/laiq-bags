const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

class DataRecoveryTool {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        await mongoose.connection.close();
        console.log('✅ Disconnected from MongoDB');
    }

    // Export current data as backup
    async exportCurrentData() {
        console.log('📤 Exporting current data...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData = {};

        try {
            // Export users
            const users = await User.find({}).lean();
            backupData.users = users;
            console.log(`📋 Exported ${users.length} users`);

            // Export products
            const products = await Product.find({}).lean();
            backupData.products = products;
            console.log(`📦 Exported ${products.length} products`);

            // Export orders
            const orders = await Order.find({}).lean();
            backupData.orders = orders;
            console.log(`📋 Exported ${orders.length} orders`);

            // Export carts
            const carts = await Cart.find({}).lean();
            backupData.carts = carts;
            console.log(`🛒 Exported ${carts.length} carts`);

            // Save to file
            const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`💾 Backup saved to: ${backupFile}`);

            return backupFile;
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            throw error;
        }
    }

    // List available backups
    listBackups() {
        const files = fs.readdirSync(this.backupDir);
        const backups = files
            .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified);

        console.log('📁 Available backups:');
        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.filename}`);
            console.log(`   Size: ${(backup.size / 1024).toFixed(2)} KB`);
            console.log(`   Created: ${backup.created.toLocaleString()}`);
            console.log(`   Modified: ${backup.modified.toLocaleString()}`);
            console.log('');
        });

        return backups;
    }

    // Restore data from backup
    async restoreFromBackup(backupFile) {
        console.log(`🔄 Restoring from backup: ${backupFile}`);
        
        try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            
            // Clear existing data
            await User.deleteMany({});
            await Product.deleteMany({});
            await Order.deleteMany({});
            await Cart.deleteMany({});
            console.log('🗑️ Cleared existing data');

            // Restore users
            if (backupData.users && backupData.users.length > 0) {
                const users = await User.insertMany(backupData.users);
                console.log(`👥 Restored ${users.length} users`);
            }

            // Restore products
            if (backupData.products && backupData.products.length > 0) {
                const products = await Product.insertMany(backupData.products);
                console.log(`📦 Restored ${products.length} products`);
            }

            // Restore orders
            if (backupData.orders && backupData.orders.length > 0) {
                const orders = await Order.insertMany(backupData.orders);
                console.log(`📋 Restored ${orders.length} orders`);
            }

            // Restore carts
            if (backupData.carts && backupData.carts.length > 0) {
                const carts = await Cart.insertMany(backupData.carts);
                console.log(`🛒 Restored ${carts.length} carts`);
            }

            console.log('✅ Data restoration completed successfully!');
        } catch (error) {
            console.error('❌ Error restoring data:', error);
            throw error;
        }
    }

    // Create sample data based on common patterns
    async createSampleData() {
        console.log('🎨 Creating sample data...');
        
        try {
            // Sample customers
            const sampleCustomers = [
                {
                    name: "John Doe",
                    email: "john@example.com",
                    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i", // "Password123@"
                    phone: "9876543210",
                    role: "customer",
                    emailVerified: true,
                    address: {
                        street: "123 Main St",
                        city: "Mumbai",
                        state: "Maharashtra",
                        pincode: "400001",
                        country: "India"
                    }
                },
                {
                    name: "Jane Smith",
                    email: "jane@example.com",
                    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i", // "Password123@"
                    phone: "9876543211",
                    role: "customer",
                    emailVerified: true,
                    address: {
                        street: "456 Oak Ave",
                        city: "Delhi",
                        state: "Delhi",
                        pincode: "110001",
                        country: "India"
                    }
                },
                {
                    name: "Mike Johnson",
                    email: "mike@example.com",
                    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i", // "Password123@"
                    phone: "9876543212",
                    role: "customer",
                    emailVerified: true,
                    address: {
                        street: "789 Pine Rd",
                        city: "Bangalore",
                        state: "Karnataka",
                        pincode: "560001",
                        country: "India"
                    }
                }
            ];

            // Sample products (more comprehensive)
            const sampleProducts = [
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
                    category: "handbag",
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
                    name: "Travel Duffel Bag",
                    description: "Durable duffel bag perfect for gym, travel, and sports activities.",
                    price: 1599,
                    images: [{ public_id: "duffel-bag", url: "/assets/placeholder-bag-4.jpg" }],
                    category: "travel",
                    type: "travel",
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
                    category: "laptop",
                    type: "laptop",
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
                }
            ];

            // Create customers
            const customers = await User.insertMany(sampleCustomers);
            console.log(`👥 Created ${customers.length} sample customers`);

            // Get admin user for createdBy field
            const adminUser = await User.findOne({ role: 'admin' });
            if (!adminUser) {
                throw new Error('Admin user not found. Please run seedData.js first.');
            }

            // Create products with createdBy field
            const productsWithCreator = sampleProducts.map(product => ({
                ...product,
                createdBy: adminUser._id
            }));
            
            const products = await Product.insertMany(productsWithCreator);
            console.log(`📦 Created ${products.length} sample products`);

            console.log('✅ Sample data created successfully!');
            console.log('\n📋 Sample Customer Credentials:');
            console.log('Email: john@example.com, Password: Password123@');
            console.log('Email: jane@example.com, Password: Password123@');
            console.log('Email: mike@example.com, Password: Password123@');

        } catch (error) {
            console.error('❌ Error creating sample data:', error);
            throw error;
        }
    }

    // Show current database status
    async showDatabaseStatus() {
        console.log('📊 Current Database Status:');
        
        try {
            const userCount = await User.countDocuments();
            const productCount = await Product.countDocuments();
            const orderCount = await Order.countDocuments();
            const cartCount = await Cart.countDocuments();

            console.log(`👥 Users: ${userCount}`);
            console.log(`📦 Products: ${productCount}`);
            console.log(`📋 Orders: ${orderCount}`);
            console.log(`🛒 Carts: ${cartCount}`);

            // Show user details
            const users = await User.find({}, 'name email role');
            console.log('\n👤 Users in database:');
            users.forEach(user => {
                console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
            });

            // Show product details
            const products = await Product.find({}, 'name price category');
            console.log('\n📦 Products in database:');
            products.forEach(product => {
                console.log(`  - ${product.name} (₹${product.price}) - ${product.category}`);
            });

        } catch (error) {
            console.error('❌ Error getting database status:', error);
        }
    }
}

// Main execution
async function main() {
    const tool = new DataRecoveryTool();
    
    try {
        await tool.connect();
        
        console.log('\n🔧 Data Recovery Tool');
        console.log('===================');
        console.log('1. Export current data');
        console.log('2. List available backups');
        console.log('3. Restore from backup');
        console.log('4. Create sample data');
        console.log('5. Show database status');
        console.log('6. Exit');
        
        // For now, let's show the current status and create sample data
        await tool.showDatabaseStatus();
        
        console.log('\n🎨 Creating comprehensive sample data...');
        await tool.createSampleData();
        
        console.log('\n📊 Updated Database Status:');
        await tool.showDatabaseStatus();
        
        // Export current data as backup
        console.log('\n💾 Creating backup of current data...');
        await tool.exportCurrentData();
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await tool.disconnect();
    }
}

// Run the tool
if (require.main === module) {
    main();
}

module.exports = DataRecoveryTool;
