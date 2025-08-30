
// Sitemap Updater for Product Pages
async function updateProductSitemap() {
    try {
        const response = await fetch('https://www.laiq.shop/api/products');
        const products = await response.json();
        
        const productUrls = products.map(product => {
            const slug = product.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            return `https://www.laiq.shop/product/${slug}-${product._id}`;
        });
        
        console.log('Product URLs for sitemap:', productUrls);
        
        // Submit to Google Search Console
        productUrls.forEach(url => {
            // You can implement Google Search Console API submission here
            console.log('Submit for indexing:', url);
        });
        
    } catch (error) {
        console.error('Error updating product sitemap:', error);
    }
}

// Call this function after products are updated
// updateProductSitemap();
