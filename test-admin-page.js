const puppeteer = require('puppeteer');

async function testAdminPage() {
    console.log('🧪 Testing admin page functionality...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Browser Error:', msg.text());
            } else if (msg.type() === 'warning') {
                console.warn('⚠️ Browser Warning:', msg.text());
            } else {
                console.log('📱 Browser Log:', msg.text());
            }
        });
        
        // Navigate to admin page
        console.log('🌐 Navigating to admin page...');
        await page.goto('http://localhost:3001/admin.html', { waitUntil: 'networkidle2' });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Check if admin login is required
        const currentUrl = page.url();
        if (currentUrl.includes('admin-login')) {
            console.log('🔐 Admin login required, testing login flow...');
            
            // Fill login form
            await page.type('#email', 'admin@laiqbags.com');
            await page.type('#password', 'admin123');
            await page.click('#login-btn');
            
            // Wait for redirect
            await page.waitForTimeout(3000);
        }
        
        // Check current URL
        const finalUrl = page.url();
        console.log('📍 Current URL:', finalUrl);
        
        if (finalUrl.includes('admin.html')) {
            console.log('✅ Successfully on admin page');
            
            // Test navigation to products section
            console.log('📦 Testing products section...');
            await page.click('[data-section="products"]');
            await page.waitForTimeout(2000);
            
            // Check if products table is visible
            const productsTable = await page.$('#products-table-body');
            if (productsTable) {
                console.log('✅ Products table found');
                
                // Check table content
                const tableContent = await page.evaluate(() => {
                    const tbody = document.getElementById('products-table-body');
                    return tbody ? tbody.innerHTML : 'No table body found';
                });
                
                if (tableContent.includes('Loading products') || tableContent.includes('No products found') || tableContent.includes('tr')) {
                    console.log('✅ Products table content loaded');
                } else {
                    console.log('❌ Products table content issue:', tableContent.substring(0, 100));
                }
            } else {
                console.log('❌ Products table not found');
            }
            
            // Test navigation to discounts section
            console.log('🎯 Testing discounts section...');
            await page.click('[data-section="discounts"]');
            await page.waitForTimeout(2000);
            
            // Check if discounts table is visible
            const discountsTable = await page.$('#discounts-table-body');
            if (discountsTable) {
                console.log('✅ Discounts table found');
                
                // Check table content
                const discountsContent = await page.evaluate(() => {
                    const tbody = document.getElementById('discounts-table-body');
                    return tbody ? tbody.innerHTML : 'No discounts table body found';
                });
                
                if (discountsContent.includes('No active discounts found') || discountsContent.includes('tr')) {
                    console.log('✅ Discounts table content loaded');
                } else {
                    console.log('❌ Discounts table content issue:', discountsContent.substring(0, 100));
                }
            } else {
                console.log('❌ Discounts table not found');
            }
            
            // Test navigation to dashboard
            console.log('📊 Testing dashboard section...');
            await page.click('[data-section="dashboard"]');
            await page.waitForTimeout(2000);
            
            // Check dashboard stats
            const dashboardStats = await page.evaluate(() => {
                const stats = {};
                const elements = document.querySelectorAll('[id$="-count"], [id$="-total"]');
                elements.forEach(el => {
                    if (el.id) {
                        stats[el.id] = el.textContent;
                    }
                });
                return stats;
            });
            
            console.log('📊 Dashboard stats:', dashboardStats);
            
        } else {
            console.log('❌ Failed to reach admin page');
        }
        
        // Take screenshot
        await page.screenshot({ path: 'admin-page-test.png', fullPage: true });
        console.log('📸 Screenshot saved as admin-page-test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run test
testAdminPage().catch(console.error);
