const fs = require('fs');
const path = require('path');

// Files to check for domain consistency
const filesToCheck = [
    'index.html',
    'about.html',
    'contact.html',
    'product.html',
    'shop.html',
    'sitemap.xml',
    'robots.txt',
    'js/api.js',
    'js/analytics-tracker.js',
    'routes/auth.js',
    'utils/emailService.js',
    'config.env.example',
    'scripts/generate-sitemap.js',
    'scripts/optimize-seo.js'
];

// Patterns to check
const patterns = {
    'localhost': /localhost/g,
    'http://localhost:3001': /http:\/\/localhost:3001/g,
    'http://localhost:8000': /http:\/\/localhost:8000/g,
    'non-www laiq.shop': /https:\/\/laiq\.shop/g,
    'www.laiq.shop': /https:\/\/www\.laiq\.shop/g,
    'info@laiq.shop': /info@www\.laiq\.shop/g
};

function checkFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { exists: false, content: null };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const results = {};
        
        for (const [patternName, pattern] of Object.entries(patterns)) {
            const matches = content.match(pattern);
            results[patternName] = matches ? matches.length : 0;
        }
        
        return { exists: true, content, results };
    } catch (error) {
        return { exists: false, error: error.message, content: null };
    }
}

function generateReport() {
    console.log('🔍 Checking domain consistency across codebase...\n');
    
    let totalIssues = 0;
    const report = {
        files: {},
        summary: {
            totalFiles: 0,
            filesWithIssues: 0,
            totalIssues: 0
        }
    };
    
    for (const file of filesToCheck) {
        const filePath = path.join(__dirname, '..', file);
        const result = checkFile(filePath);
        
        if (!result.exists) {
            console.log(`❌ ${file}: File not found`);
            continue;
        }
        
        report.summary.totalFiles++;
        let fileIssues = 0;
        const issues = [];
        
        // Check for problematic patterns
        if (result.results['localhost'] > 0) {
            issues.push(`⚠️  ${result.results['localhost']} localhost references`);
            fileIssues += result.results['localhost'];
        }
        
        if (result.results['http://localhost:3001'] > 0) {
            issues.push(`❌ ${result.results['http://localhost:3001']} http://localhost:3001 references`);
            fileIssues += result.results['http://localhost:3001'];
        }
        
        if (result.results['http://localhost:8000'] > 0) {
            issues.push(`❌ ${result.results['http://localhost:8000']} http://localhost:8000 references`);
            fileIssues += result.results['http://localhost:8000'];
        }
        
        if (result.results['non-www laiq.shop'] > 0) {
            issues.push(`⚠️  ${result.results['non-www laiq.shop']} non-www laiq.shop references`);
            fileIssues += result.results['non-www laiq.shop'];
        }
        
        if (result.results['info@laiq.shop'] > 0) {
            issues.push(`❌ ${result.results['info@laiq.shop']} info@laiq.shop references`);
            fileIssues += result.results['info@laiq.shop'];
        }
        
        // Check for correct patterns
        const correctWww = result.results['www.laiq.shop'];
        
        if (fileIssues > 0) {
            console.log(`❌ ${file}: ${fileIssues} issues found`);
            issues.forEach(issue => console.log(`   ${issue}`));
            report.summary.filesWithIssues++;
            report.summary.totalIssues += fileIssues;
            totalIssues += fileIssues;
        } else if (correctWww > 0) {
            console.log(`✅ ${file}: ${correctWww} correct www.laiq.shop references`);
        } else {
            console.log(`ℹ️  ${file}: No domain references found`);
        }
        
        report.files[file] = {
            issues: fileIssues,
            correctWww: correctWww,
            details: issues
        };
    }
    
    console.log('\n📊 Summary:');
    console.log(`📁 Total files checked: ${report.summary.totalFiles}`);
    console.log(`❌ Files with issues: ${report.summary.filesWithIssues}`);
    console.log(`🔧 Total issues found: ${report.summary.totalIssues}`);
    
    if (totalIssues === 0) {
        console.log('\n🎉 All files are using the correct domain!');
        console.log('✅ www.laiq.shop is properly configured everywhere.');
    } else {
        console.log('\n🚨 Issues found that need to be fixed:');
        console.log('1. Replace localhost URLs with https://www.laiq.shop');
        console.log('2. Fix email addresses (remove www from email)');
        console.log('3. Ensure all production URLs use www.laiq.shop');
    }
    
    return report;
}

// Check specific critical files for detailed analysis
function checkCriticalFiles() {
    console.log('\n🔍 Detailed analysis of critical files:\n');
    
    const criticalFiles = [
        'sitemap.xml',
        'robots.txt',
        'index.html',
        'js/api.js'
    ];
    
    for (const file of criticalFiles) {
        const filePath = path.join(__dirname, '..', file);
        const result = checkFile(filePath);
        
        if (!result.exists) {
            console.log(`❌ ${file}: File not found`);
            continue;
        }
        
        console.log(`📄 ${file}:`);
        console.log(`   - www.laiq.shop references: ${result.results['www.laiq.shop']}`);
        console.log(`   - localhost references: ${result.results['localhost']}`);
        console.log(`   - non-www laiq.shop: ${result.results['non-www laiq.shop']}`);
        
        // Show specific lines with issues
        if (result.results['localhost'] > 0 || result.results['non-www laiq.shop'] > 0) {
            const lines = result.content.split('\n');
            console.log('   📍 Lines with issues:');
            
            lines.forEach((line, index) => {
                if (line.includes('localhost') || line.includes('laiq.shop')) {
                    const lineNum = index + 1;
                    const trimmed = line.trim().substring(0, 80);
                    console.log(`      Line ${lineNum}: ${trimmed}${trimmed.length === 80 ? '...' : ''}`);
                }
            });
        }
        console.log('');
    }
}

// Run the check
if (require.main === module) {
    const report = generateReport();
    checkCriticalFiles();
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'domain-consistency-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
}

module.exports = { generateReport, checkCriticalFiles };
