const fs = require('fs');
const path = require('path');

// List of unused images to delete
const unusedImages = [
    // Duplicate favicon files (black/white versions)
    'assets/favicon-16x16-black.png',
    'assets/favicon-16x16-white.png',
    'assets/favicon-32x32-black.png',
    'assets/favicon-32x32-white.png',
    'assets/favicon-48x48-black.png',
    'assets/favicon-48x48-white.png',
    
    // Numbered PNG files (old versions)
    'assets/16.png',
    'assets/32.png',
    'assets/48.png',
    'assets/180.png',
    'assets/192.png',
    'assets/512.png',
    
    // Duplicate logo files
    'assets/laiq-logo-original.png',
    
    // Unused image files
    'assets/l.png',
    'assets/l2.jpeg',
    'assets/l2.png',
    'assets/hbhjkj.jpeg',
    'assets/hbhjkj.png',
    
    // Unused placeholder files (PNG versions)
    'assets/placeholder-avatar-1.png',
    'assets/placeholder-avatar-2.png',
    'assets/placeholder-avatar-3.png',
    'assets/placeholder-bag-1.png',
    'assets/placeholder-bag-2.png',
    'assets/placeholder-bag-3.png',
    'assets/placeholder-bag-4.png',
    'assets/placeholder-bag-5.png',
    'assets/placeholder-bag-6.png',
    
    // Unused JPEG placeholder files
    'assets/placeholder-avatar-1.jpeg',
    'assets/placeholder-avatar-2.jpeg',
    'assets/placeholder-avatar-3.jpeg',
    'assets/placeholder-bag-1.jpeg',
    'assets/placeholder-bag-2.jpeg',
    'assets/placeholder-bag-3.jpeg',
    'assets/placeholder-bag-4.jpeg',
    'assets/placeholder-bag-5.jpeg',
    'assets/placeholder-bag-6.jpeg',
    
    // Other unused files
    'assets/placeholder-avatar-1 (1).png',
    'assets/placeholder-bag-5 (1).jpg'
];

console.log('🧹 Starting cleanup of unused images...\n');

let deletedCount = 0;
let errorCount = 0;

unusedImages.forEach(imagePath => {
    try {
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`✅ Deleted: ${imagePath}`);
            deletedCount++;
        } else {
            console.log(`⚠️  Not found: ${imagePath}`);
        }
    } catch (error) {
        console.log(`❌ Error deleting ${imagePath}: ${error.message}`);
        errorCount++;
    }
});

console.log('\n📊 Cleanup Summary:');
console.log(`✅ Successfully deleted: ${deletedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log(`📁 Total unused files processed: ${unusedImages.length}`);

// Calculate space saved
let totalSizeSaved = 0;
unusedImages.forEach(imagePath => {
    try {
        if (fs.existsSync(imagePath)) {
            const stats = fs.statSync(imagePath);
            totalSizeSaved += stats.size;
        }
    } catch (error) {
        // File might have been deleted already
    }
});

if (totalSizeSaved > 0) {
    const sizeInMB = (totalSizeSaved / (1024 * 1024)).toFixed(2);
    console.log(`💾 Space saved: ${sizeInMB} MB`);
}

console.log('\n🎉 Cleanup completed! Your assets folder is now optimized.');
