const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: [true, 'Please provide a review title'],
        trim: true,
        maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Please provide a review comment'],
        trim: true,
        maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        public_id: {
            type: String,
            required: true
        }
    }],
    helpful: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        helpful: {
            type: Boolean,
            default: true
        }
    }],
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent user from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get average rating and number of reviews
reviewSchema.statics.getAverageRating = async function(productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                avgRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            ratings: stats[0].avgRating,
            numOfReviews: stats[0].numOfReviews
        });
    } else {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            ratings: 0,
            numOfReviews: 0
        });
    }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
    this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before remove
reviewSchema.pre('deleteOne', { document: true, query: false }, function() {
    this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema); 