const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    // Color information for the cart item
    color: {
        name: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true
        }
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    optimisticConcurrency: false, // Disable optimistic concurrency completely
    versionKey: false, // Remove version key completely
    timestamps: false, // Disable automatic timestamps to avoid conflicts
    strict: false, // Allow flexible schema
    minimize: false // Don't remove empty objects
});

// Update timestamp on save
cartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate total amount
cartSchema.methods.getTotalAmount = function() {
    return this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
};

// Calculate total items
cartSchema.methods.getTotalItems = function() {
    return this.items.reduce((total, item) => {
        return total + item.quantity;
    }, 0);
};

// Add item to cart using atomic operation - NO VERSION CONFLICTS
cartSchema.methods.addItem = async function(productId, quantity = 1, productData = null) {
    try {
        // Use atomic findOneAndUpdate to avoid version conflicts
        const result = await this.constructor.findOneAndUpdate(
            { 
                _id: this._id,
                'items.product': productId 
            },
            { 
                $inc: { 'items.$.quantity': quantity },
                $set: { updatedAt: Date.now() }
            },
            { new: true, lean: false }
        );
        
        if (result) {
            // Item exists, quantity updated
            console.log('✅ Cart item quantity updated atomically');
            return result;
        } else {
            // Item doesn't exist, add new item
            if (!productData) {
                throw new Error('Product data required for new cart item');
            }
            
            const newItem = {
                product: productId,
                quantity: quantity,
                price: productData.price,
                name: productData.name,
                image: productData.image,
                color: productData.color || { name: 'Default', code: '#000000' }
            };
            
            const updatedCart = await this.constructor.findOneAndUpdate(
                { _id: this._id },
                { 
                    $push: { items: newItem },
                    $set: { updatedAt: Date.now() }
                },
                { new: true, lean: false }
            );
            
            console.log('✅ New cart item added atomically');
            return updatedCart;
        }
    } catch (error) {
        console.error('❌ Add to cart error:', error);
        throw error;
    }
};

// Remove item from cart - NO VERSION CONFLICTS
cartSchema.methods.removeItem = async function(productId) {
    try {
        const result = await this.constructor.findOneAndUpdate(
            { _id: this._id },
            { 
                $pull: { items: { product: productId } },
                $set: { updatedAt: Date.now() }
            },
            { new: true, lean: false }
        );
        
        console.log('✅ Cart item removed atomically');
        return result;
    } catch (error) {
        console.error('❌ Remove from cart error:', error);
        throw error;
    }
};

// Update item quantity - NO VERSION CONFLICTS
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
    try {
        if (quantity <= 0) {
            return await this.removeItem(productId);
        }
        
        const result = await this.constructor.findOneAndUpdate(
            { 
                _id: this._id,
                'items.product': productId 
            },
            { 
                $set: { 
                    'items.$.quantity': quantity,
                    updatedAt: Date.now()
                }
            },
            { new: true, lean: false }
        );
        
        console.log('✅ Cart item quantity updated atomically');
        return result;
    } catch (error) {
        console.error('❌ Update cart quantity error:', error);
        throw error;
    }
};

// Clear cart - NO VERSION CONFLICTS
cartSchema.methods.clearCart = async function() {
    try {
        const result = await this.constructor.findOneAndUpdate(
            { _id: this._id },
            { 
                $set: { 
                    items: [],
                    updatedAt: Date.now()
                }
            },
            { new: true, lean: false }
        );
        
        console.log('✅ Cart cleared atomically');
        return result;
    } catch (error) {
        console.error('❌ Clear cart error:', error);
        throw error;
    }
};

// Add database indexes for better performance
cartSchema.index({ user: 1 }); // Index on user field for fast cart lookups
cartSchema.index({ 'items.product': 1 }); // Index on product references
cartSchema.index({ updatedAt: -1 }); // Index on updatedAt for sorting

// Ensure proper model export
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 