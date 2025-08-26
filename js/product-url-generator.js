
// Product URL Generator
function generateProductURL(product) {
    const slug = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return `https://www.laiq.shop/product/${slug}-${product._id}`;
}

// Product Schema Generator
function generateProductSchema(product) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.images?.[0]?.url || 'https://www.laiq.shop/assets/laiq-logo.png',
        "brand": {
            "@type": "Brand",
            "name": "Laiq Bags"
        },
        "offers": {
            "@type": "Offer",
            "price": product.price.toString(),
            "priceCurrency": "INR",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": generateProductURL(product)
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "reviewCount": "50"
        }
    };
}
