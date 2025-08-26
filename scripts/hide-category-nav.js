const fs = require('fs');
const path = require('path');

// List of category pages to update
const categoryPages = [
    'handbags.html',
    'laptop-bags.html', 
    'travel-bags.html',
    'sling-bags.html'
];

function hideCategoryNav() {
    console.log('🔧 Hiding category navigation from all pages...');
    
    // Update each category page
    categoryPages.forEach(page => {
        const filePath = path.join(__dirname, '..', page);
        
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Replace the category navigation div to add 'hidden' class
            const oldPattern = /<!-- Category Navigation -->\s*<div class="category-nav mb-8">/g;
            const newPattern = '<!-- Category Navigation (Temporarily Hidden) -->\n        <div class="category-nav mb-8 hidden">';
            
            if (content.includes('<!-- Category Navigation -->')) {
                content = content.replace(oldPattern, newPattern);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Updated ${page}`);
            } else {
                console.log(`⚠️ No category navigation found in ${page}`);
            }
        } else {
            console.log(`❌ File not found: ${page}`);
        }
    });
    
    console.log('\n🎉 Category navigation hidden from all pages!');
    console.log('📝 To show again, remove the "hidden" class from the category-nav divs.');
}

hideCategoryNav();
