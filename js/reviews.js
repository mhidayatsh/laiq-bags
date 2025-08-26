// Review functionality
let currentProductId = null;
let currentReviews = [];
let currentPage = 1;
let hasMoreReviews = false;

// Initialize reviews
function initializeReviews() {
    console.log('📝 Initializing reviews...');
    
    // Get product ID from URL - try multiple methods
    let productId = null;
    
    // Method 1: URL search params
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id');
    
    // Method 2: URL path (for product detail pages)
    if (!productId) {
        const pathParts = window.location.pathname.split('/');
        const productIndex = pathParts.findIndex(part => part === 'product');
        if (productIndex !== -1 && pathParts[productIndex + 1]) {
            productId = pathParts[productIndex + 1];
        }
    }
    
    // Method 3: Check if we're on a product page with data attribute
    if (!productId) {
        const productElement = document.querySelector('[data-product-id]');
        if (productElement) {
            productId = productElement.dataset.productId;
        }
    }
    
    // Method 4: Check for product ID in page title or meta tags
    if (!productId) {
        const metaProductId = document.querySelector('meta[name="product-id"]');
        if (metaProductId) {
            productId = metaProductId.getAttribute('content');
        }
    }
    
    currentProductId = productId;
    
    console.log('🔍 Product ID detection:', {
        urlParams: urlParams.get('id'),
        pathParts: window.location.pathname.split('/'),
        productElement: !!document.querySelector('[data-product-id]'),
        metaTag: !!document.querySelector('meta[name="product-id"]'),
        finalProductId: currentProductId
    });
    
    if (!currentProductId) {
        console.log('❌ No product ID found in URL or page elements');
        return;
    }
    
    // Load reviews
    loadReviews();
    
    // Initialize review modal
    initializeReviewModal();
    
    console.log('✅ Reviews initialized for product:', currentProductId);
}

// Load reviews for product
async function loadReviews() {
    try {
        console.log('📝 Loading reviews for product:', currentProductId);
        
        const response = await api.getProductReviews(currentProductId);
        
        if (response.success) {
            currentReviews = response.reviews;
            renderReviews();
            updateReviewStats();
        }
    } catch (error) {
        console.error('❌ Error loading reviews:', error);
        showToast('Failed to load reviews', 'error');
    }
}

// Render reviews
function renderReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) {
        console.error('❌ Reviews container not found');
        return;
    }
    
    console.log('📝 Rendering reviews:', currentReviews.length);
    
    if (currentReviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-charcoal/40 text-6xl mb-4">💬</div>
                <h3 class="text-xl font-semibold mb-2">No Reviews Yet</h3>
                <p class="text-charcoal/60 mb-6">Be the first to review this product!</p>
                <button id="write-first-review-btn" class="bg-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-charcoal transition-colors">
                    Write First Review
                </button>
            </div>
        `;
        
        // Add event listener for first review button
        const firstReviewBtn = document.getElementById('write-first-review-btn');
        if (firstReviewBtn) {
            firstReviewBtn.addEventListener('click', openReviewModal);
            console.log('✅ Added first review button listener');
        } else {
            console.warn('⚠️ First review button not found');
        }
        return;
    }
    
    const reviewsHTML = currentReviews.map(review => {
        console.log('📝 Rendering review:', {
            reviewId: review._id,
            userId: review.user?._id,
            currentUserId: getCurrentUserId(),
            isOwnReview: review.user?._id === getCurrentUserId()
        });
        
        return `
            <div class="border border-beige rounded-lg p-6" data-review-id="${review._id}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-semibold">
                            ${review.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div class="font-semibold">${review.user?.name || 'Anonymous'}</div>
                            <div class="text-sm text-charcoal/60">${formatDate(review.createdAt)}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-semibold text-lg mb-2">${review.title}</h4>
                    <p class="text-charcoal/80">${review.comment}</p>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button class="helpful-btn text-sm text-charcoal/60 hover:text-gold transition-colors" data-review-id="${review._id}">
                            👍 Helpful (${review.helpful?.length || 0})
                        </button>
                        ${review.verified ? '<span class="text-gold text-sm">✓ Verified Purchase</span>' : ''}
                    </div>
                    
                    ${isCustomerLoggedIn() && review.user?._id === getCurrentUserId() ? `
                        <div class="flex gap-2">
                            <button class="edit-review-btn text-sm text-gold hover:text-charcoal transition-colors" data-review-id="${review._id}">
                                Edit
                            </button>
                            <button class="delete-review-btn text-sm text-red-500 hover:text-red-700 transition-colors" data-review-id="${review._id}">
                                Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = reviewsHTML;
    console.log('✅ Reviews HTML rendered');
    
    // Add event listeners
    addReviewEventListeners();
}

// Add review event listeners
function addReviewEventListeners() {
    console.log('🔧 Adding review event listeners...');
    
    // Helpful buttons
    const helpfulButtons = document.querySelectorAll('.helpful-btn');
    console.log('👍 Found helpful buttons:', helpfulButtons.length);
    
    helpfulButtons.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', handleHelpfulClick);
            console.log(`✅ Added helpful listener to button ${index + 1}`);
        } else {
            console.warn(`⚠️ Helpful button ${index + 1} is null`);
        }
    });
    
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-review-btn');
    console.log('✏️ Found edit buttons:', editButtons.length);
    
    editButtons.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', handleEditReview);
            console.log(`✅ Added edit listener to button ${index + 1}`);
        } else {
            console.warn(`⚠️ Edit button ${index + 1} is null`);
        }
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-review-btn');
    console.log('🗑️ Found delete buttons:', deleteButtons.length);
    
    deleteButtons.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', handleDeleteReview);
            console.log(`✅ Added delete listener to button ${index + 1}`);
        } else {
            console.warn(`⚠️ Delete button ${index + 1} is null`);
        }
    });
    
    console.log('✅ Review event listeners added');
}

// Handle helpful click
async function handleHelpfulClick(e) {
    if (!isCustomerLoggedIn()) {
        showToast('Please login to mark reviews as helpful', 'error');
        return;
    }
    
    const reviewId = e.currentTarget.dataset.reviewId;
    const btn = e.currentTarget;
    
    console.log('👍 Helpful click:', {
        reviewId,
        button: btn,
        buttonExists: !!btn
    });
    
    if (!btn) {
        console.error('❌ Helpful button not found');
        return;
    }
    
    try {
        const response = await api.markReviewHelpful(reviewId);
        
        if (response.success) {
            // Update the helpful count
            const count = response.helpfulCount;
            
            // Safer approach: Use try-catch for button update
            try {
                btn.textContent = `👍 Helpful (${count})`;
                
                if (response.isHelpful) {
                    btn.classList.add('text-gold');
                } else {
                    btn.classList.remove('text-gold');
                }
                
                console.log('✅ Helpful count updated:', count);
            } catch (buttonError) {
                console.warn('⚠️ Button update failed, reloading reviews:', buttonError);
                loadReviews(); // Reload reviews if button update fails
            }
        }
    } catch (error) {
        console.error('❌ Error marking review helpful:', error);
        showToast('Failed to mark review as helpful', 'error');
    }
}

// Handle edit review
function handleEditReview(e) {
    const reviewId = e.currentTarget.dataset.reviewId;
    console.log('✏️ Edit review clicked:', {
        reviewId,
        dataset: e.currentTarget.dataset,
        currentProductId
    });
    
    if (!reviewId || reviewId === 'undefined') {
        console.error('❌ Invalid review ID for editing:', reviewId);
        showToast('Review ID not found. Please try again.', 'error');
        return;
    }
    
    const review = currentReviews.find(r => r._id === reviewId);
    console.log('🔍 Found review for editing:', review);
    
    if (review && review._id) {
        openReviewModal(review);
    } else {
        console.error('❌ Review not found for editing:', reviewId);
        showToast('Review not found for editing', 'error');
    }
}

// Handle delete review
async function handleDeleteReview(e) {
    const reviewId = e.currentTarget.dataset.reviewId;
    
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }
    
    try {
        const response = await api.deleteReview(reviewId);
        
        if (response.success) {
            showToast('Review deleted successfully', 'success');
            loadReviews(); // Reload reviews
        }
    } catch (error) {
        console.error('❌ Error deleting review:', error);
        showToast('Failed to delete review', 'error');
    }
}

// Update review stats
function updateReviewStats() {
    if (currentReviews.length === 0) {
        document.getElementById('average-rating').textContent = '0';
        document.getElementById('total-reviews').textContent = '0';
        return;
    }
    
    const totalRating = currentReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / currentReviews.length).toFixed(1);
    
    document.getElementById('average-rating').textContent = averageRating;
    document.getElementById('total-reviews').textContent = currentReviews.length;
    
    // Update stars display
    const starsContainer = document.querySelector('#average-rating').parentElement.querySelector('.flex');
    if (starsContainer) {
        starsContainer.innerHTML = generateStars(averageRating);
    }
}

// Initialize review modal
function initializeReviewModal() {
    const writeReviewBtn = document.getElementById('write-review-btn');
    const reviewModal = document.getElementById('review-modal');
    const closeButtons = document.querySelectorAll('.close-review-modal');
    const reviewForm = document.getElementById('review-form');
    const ratingStars = document.querySelectorAll('.rating-star');
    const commentTextarea = document.getElementById('review-comment');
    
    console.log('🔧 Initializing review modal:', {
        writeReviewBtn: !!writeReviewBtn,
        reviewModal: !!reviewModal,
        closeButtons: closeButtons.length,
        reviewForm: !!reviewForm,
        ratingStars: ratingStars.length,
        commentTextarea: !!commentTextarea
    });
    
    // Write review button
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', () => openReviewModal());
    }
    
    // Close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeReviewModal);
    });
    
    // Close on backdrop click
    if (reviewModal) {
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) {
                closeReviewModal();
            }
        });
    }
    
    // Rating stars
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
        });
    });
    
    // Comment character count
    if (commentTextarea) {
        commentTextarea.addEventListener('input', () => {
            const count = commentTextarea.value.length;
            document.getElementById('comment-count').textContent = count;
        });
    }
    
    // Form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    
    console.log('✅ Review modal initialized');
}

// Open review modal
function openReviewModal(review = null) {
    if (!isCustomerLoggedIn()) {
        showToast('Please login to write a review', 'error');
        return;
    }
    
    const modal = document.getElementById('review-modal');
    const form = document.getElementById('review-form');
    const ratingInput = document.getElementById('review-rating');
    const titleInput = document.getElementById('review-title');
    const commentInput = document.getElementById('review-comment');
    
    console.log('📝 Opening review modal:', {
        review,
        reviewId: review?._id,
        mode: review ? 'edit' : 'new',
        currentProductId
    });
    
    if (review && review._id) {
        // Edit mode
        document.querySelector('#review-modal h3').textContent = 'Edit Review';
        ratingInput.value = review.rating;
        titleInput.value = review.title;
        commentInput.value = review.comment;
        setRating(review.rating);
        form.dataset.reviewId = review._id;
        form.dataset.mode = 'edit';
        
        // Update character count
        document.getElementById('comment-count').textContent = commentInput.value.length;
        
        console.log('✅ Edit mode set:', {
            reviewId: form.dataset.reviewId,
            mode: form.dataset.mode,
            rating: ratingInput.value,
            title: titleInput.value,
            comment: commentInput.value
        });
    } else {
        // New review mode
        document.querySelector('#review-modal h3').textContent = 'Write a Review';
        form.reset();
        ratingInput.value = '';
        setRating(0);
        delete form.dataset.reviewId;
        form.dataset.mode = 'new';
        
        // Reset character count
        document.getElementById('comment-count').textContent = '0';
        
        console.log('✅ New review mode set:', {
            reviewId: form.dataset.reviewId,
            mode: form.dataset.mode,
            currentProductId
        });
    }
    
    modal.classList.remove('opacity-0', 'pointer-events-none');
}

// Close review modal
function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    const form = document.getElementById('review-form');
    
    // Clear form data
    form.reset();
    delete form.dataset.reviewId;
    delete form.dataset.mode;
    
    // Reset rating
    setRating(0);
    
    // Reset character count
    document.getElementById('comment-count').textContent = '0';
    
    console.log('🔒 Modal closed, form reset:', {
        reviewId: form.dataset.reviewId,
        mode: form.dataset.mode
    });
    
    modal.classList.add('opacity-0', 'pointer-events-none');
}

// Set rating
function setRating(rating) {
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('review-rating');
    
    ratingInput.value = rating;
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-gold');
            star.classList.remove('text-charcoal/20');
        } else {
            star.classList.remove('text-gold');
            star.classList.add('text-charcoal/20');
        }
    });
}

// Handle review submit
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const mode = form.dataset.mode;
    const reviewId = form.dataset.reviewId;
    
    const rating = parseInt(formData.get('rating'));
    const title = formData.get('title').trim();
    const comment = formData.get('comment').trim();
    
    console.log('📝 Review submission data:', {
        mode,
        reviewId,
        currentProductId,
        rating,
        title,
        comment,
        formDataset: form.dataset
    });
    
    // Validate product ID
    if (!currentProductId) {
        console.error('❌ No product ID available');
        showToast('Product information not found. Please refresh the page.', 'error');
        return;
    }
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        showToast('Please select a valid rating (1-5 stars)', 'error');
        return;
    }
    
    // Validate title
    if (!title || title.length < 3) {
        showToast('Please enter a review title (minimum 3 characters)', 'error');
        return;
    }
    
    // Validate comment
    if (!comment || comment.length < 10) {
        showToast('Please enter a review comment (minimum 10 characters)', 'error');
        return;
    }
    
    const reviewData = {
        rating,
        title,
        comment,
        productId: currentProductId
    };
    
    try {
        let response;
        
        if (mode === 'edit') {
            if (!reviewId || reviewId === 'undefined') {
                console.error('❌ Review ID is undefined or invalid in edit mode:', reviewId);
                showToast('Review ID not found. Please try again.', 'error');
                return;
            }
            console.log('🔄 Updating review:', reviewId);
            response = await api.updateReview(reviewId, reviewData);
        } else {
            console.log('➕ Creating new review');
            response = await api.createReview(reviewData);
        }
        
        console.log('✅ Review response:', response);
        
        if (response.success) {
            showToast(mode === 'edit' ? 'Review updated successfully' : 'Review submitted successfully', 'success');
            closeReviewModal();
            // Reload reviews using the correct function
            if (typeof loadProductReviews === 'function' && typeof getCurrentProductId === 'function') {
                const productId = getCurrentProductId();
                if (productId) {
                    loadProductReviews(productId);
                }
            } else {
                loadReviews(); // Fallback
            }
        }
    } catch (error) {
        console.error('❌ Error submitting review:', error);
        console.error('❌ Error details:', {
            message: error.message,
            status: error.message.includes('400') ? '400' : 'Other',
            reviewData,
            mode,
            reviewId,
            currentProductId
        });
        
        if (error.message.includes('400')) {
            showToast('Please check your review data', 'error');
        } else if (error.message.includes('403')) {
            showToast('You can only edit your own reviews', 'error');
        } else if (error.message.includes('404')) {
            showToast('Review not found', 'error');
        } else {
            showToast('Failed to submit review', 'error');
        }
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Use the getCurrentUserId function from product.js
// This function is already defined in product.js and handles all storage locations

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeReviews();
}); 