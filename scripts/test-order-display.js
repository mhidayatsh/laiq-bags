#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Sample order data structure for testing
const sampleOrder = {
    _id: 'test_order_123',
    createdAt: new Date(),
    status: 'processing',
    totalAmount: 24126.9,
    user: {
        name: 'Md Hidayatullah',
        email: 'hidayatshaikh0777@gmail.com'
    },
    shippingInfo: {
        street: 'madanpura, maulana Azad road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400008',
        country: 'India'
    },
    paymentInfo: {
        id: 'COD',
        status: 'pending'
    },
    orderItems: [
        {
            name: 'Urban Tote',
            description: 'Stylish urban tote bag',
            price: 1539.3,
            quantity: 2,
            color: { name: 'Navy Blue', code: '#1e3a8a' },
            size: 'Medium',
            category: 'General',
            stockCount: 0,
            image: 'https://example.com/urban-tote.jpg'
        },
        {
            name: 'Test Product 2',
            description: 'Test product description',
            price: 699.3,
            quantity: 1,
            color: { name: 'Black', code: '#000000' },
            size: 'Large',
            category: 'General',
            stockCount: 0,
            image: 'https://example.com/test-product.jpg'
        },
        {
            name: 'Classic Backpack',
            description: 'Classic backpack design',
            price: 2499,
            quantity: 1,
            color: { name: 'Brown', code: '#92400e' },
            size: 'Standard',
            category: 'General',
            stockCount: 0,
            image: 'https://example.com/backpack.jpg'
        }
    ]
};

// Helper function to safely extract color information (same as in admin.js)
function getColorDisplay(color) {
    if (!color) return null;
    
    // If color is a string, return as is
    if (typeof color === 'string') return color;
    
    // If color is an object with name property
    if (color.name) return color.name;
    
    // If color is an object with other properties, try to find a displayable value
    if (typeof color === 'object') {
        // Check common color properties
        if (color.value) return color.value;
        if (color.label) return color.label;
        if (color.code) return color.code;
        
        // If it's an array, take the first item
        if (Array.isArray(color) && color.length > 0) {
            return getColorDisplay(color[0]);
        }
    }
    
    return 'N/A';
}

// Test function to simulate order details display
function testOrderDisplay(order) {
    console.log('🔍 Testing Order Details Display');
    console.log('================================\n');
    
    // Test order information
    console.log('📋 Order Information:');
    console.log(`   Order ID: #${order._id.slice(-8)}`);
    console.log(`   Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
    console.log(`   Status: ${order.status.toUpperCase()}`);
    console.log(`   Total Amount: ₹${(order.totalAmount || 0).toLocaleString()}\n`);
    
    // Test customer information
    console.log('👤 Customer Information:');
    console.log(`   Name: ${order.user?.name || 'N/A'}`);
    console.log(`   Email: ${order.user?.email || 'N/A'}\n`);
    
    // Test shipping address
    console.log('📍 Shipping Address:');
    if (order.shippingInfo) {
        console.log(`   ${order.shippingInfo.street || 'N/A'}`);
        console.log(`   ${order.shippingInfo.city || ''}, ${order.shippingInfo.state || ''} - ${order.shippingInfo.pincode || ''}`);
        console.log(`   ${order.shippingInfo.country || 'India'}\n`);
    } else {
        console.log('   Address not available\n');
    }
    
    // Test payment information
    console.log('💳 Payment Information:');
    console.log(`   Method: ${order.paymentInfo?.id || 'N/A'}`);
    console.log(`   Status: ${order.paymentInfo?.status || 'N/A'}\n`);
    
    // Test order items with color and quantity
    console.log('📦 Order Items:');
    order.orderItems?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}`);
        console.log(`      Description: ${item.description || 'No description'}`);
        console.log(`      Color: ${getColorDisplay(item.color)} (Raw: ${JSON.stringify(item.color)})`);
        console.log(`      Size: ${item.size || 'N/A'}`);
        console.log(`      Category: ${item.category || 'General'}`);
        console.log(`      Price: ₹${(item.price || 0).toLocaleString()}`);
        console.log(`      Quantity: ${item.quantity || 1}`);
        console.log(`      Stock: ${item.stockCount || 0} units`);
        console.log(`      Image: ${item.image || 'No image'}\n`);
    });
    
    // Test HTML generation
    console.log('🌐 HTML Generation Test:');
    const orderItemsHTML = order.orderItems?.map(item => `
        <div class="flex items-center gap-3 p-3 bg-white rounded border">
            <img src="${item.image || 'default-image.jpg'}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-charcoal truncate">${item.name}</h3>
                <p class="text-sm text-gray-600 mt-1">${item.description || 'No description'}</p>
                
                <!-- Color and Size Information -->
                <div class="flex flex-wrap gap-2 mt-2">
                    ${item.color ? `
                        <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Color: ${item.color}
                        </span>
                    ` : ''}
                    ${item.size ? `
                        <span class="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            Size: ${item.size}
                        </span>
                    ` : ''}
                    ${item.category ? `
                        <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            ${item.category}
                        </span>
                    ` : ''}
                </div>
                
                <div class="flex justify-between items-center mt-2">
                    <span class="text-gold font-bold">₹${(item.price || 0).toLocaleString()}</span>
                    <span class="text-sm text-gray-600">
                        Qty: ${item.quantity || 1}
                    </span>
                </div>
                
                <div class="mt-2 text-xs text-gray-500">
                    Stock: ${item.stockCount || 0} units
                </div>
            </div>
        </div>
    `).join('') || '<p class="text-charcoal/60 text-center">No items found</p>';
    
    console.log('✅ HTML generated successfully');
    console.log(`   Total items: ${order.orderItems?.length || 0}`);
    console.log(`   Items with color: ${order.orderItems?.filter(item => item.color).length || 0}`);
    console.log(`   Items with size: ${order.orderItems?.filter(item => item.size).length || 0}`);
    console.log(`   Total quantity: ${order.orderItems?.reduce((sum, item) => sum + (item.quantity || 1), 0)}`);
}

// Test the sample order
console.log('🚀 Starting Order Display Test\n');
testOrderDisplay(sampleOrder);
console.log('\n✅ Test completed successfully!');
console.log('\n💡 To test with real data:');
console.log('   1. Start your server: npm run dev');
console.log('   2. Open admin panel in browser');
console.log('   3. Go to Orders section');
console.log('   4. Click "View Details" on any order');
console.log('   5. Check if color and quantity are displayed');

process.exit(0);
