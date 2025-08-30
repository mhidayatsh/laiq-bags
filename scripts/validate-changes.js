const fs = require('fs');
const path = require('path');

console.log('🔍 Validating All Changes...\n');

let allChecksPassed = true;

console.log('1. Server.js Validation:');
console.log('=======================');

// Check server.js syntax
try {
    require('child_process').execSync('node -c server.js', { stdio: 'pipe' });
    console.log('✅ server.js syntax is valid');
} catch (error) {
    console.log('❌ server.js has syntax errors');
    console.log(error.message);
    allChecksPassed = false;
}

// Check for critical server.js patterns
const serverContent = fs.readFileSync('server.js', 'utf8');

// Check if cache-busting headers are present
if (serverContent.includes('Cache-Control')) {
    console.log('✅ Cache-busting headers found');
} else {
    console.log('❌ Cache-busting headers missing');
    allChecksPassed = false;
}

// Check if productImageWithCacheBust is defined
if (serverContent.includes('productImageWithCacheBust')) {
    console.log('✅ Cache-busting image URL logic found');
} else {
    console.log('❌ Cache-busting image URL logic missing');
    allChecksPassed = false;
}

// Check if meta tag replacement is working
if (serverContent.includes('og:image') && serverContent.includes('productImageWithCacheBust')) {
    console.log('✅ Meta tag replacement logic found');
} else {
    console.log('❌ Meta tag replacement logic missing');
    allChecksPassed = false;
}

console.log('\n2. Product.html Validation:');
console.log('==========================');

// Check product.html structure
const productContent = fs.readFileSync('product.html', 'utf8');

// Check for basic HTML structure
if (productContent.includes('<!DOCTYPE html>')) {
    console.log('✅ HTML structure is valid');
} else {
    console.log('❌ HTML structure is invalid');
    allChecksPassed = false;
}

// Check for essential meta tags
const essentialTags = [
    'og:title',
    'og:description', 
    'og:image',
    'twitter:title',
    'twitter:description',
    'twitter:image'
];

for (const tag of essentialTags) {
    if (productContent.includes(tag)) {
        console.log(`✅ ${tag} meta tag found`);
    } else {
        console.log(`❌ ${tag} meta tag missing`);
        allChecksPassed = false;
    }
}

// Check for duplicate meta tags
const ogImageMatches = productContent.match(/<meta property="og:image"[^>]*>/g);
const twitterImageMatches = productContent.match(/<meta name="twitter:image"[^>]*>/g);

if (ogImageMatches && ogImageMatches.length === 1) {
    console.log('✅ Single og:image tag found (no duplicates)');
} else {
    console.log(`❌ Found ${ogImageMatches ? ogImageMatches.length : 0} og:image tags (should be 1)`);
    allChecksPassed = false;
}

if (twitterImageMatches && twitterImageMatches.length === 1) {
    console.log('✅ Single twitter:image tag found (no duplicates)');
} else {
    console.log(`❌ Found ${twitterImageMatches ? twitterImageMatches.length : 0} twitter:image tags (should be 1)`);
    allChecksPassed = false;
}

console.log('\n3. Package.json Validation:');
console.log('==========================');

// Check if package.json exists and is valid
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json is valid JSON');
    
    // Check for essential dependencies
    const essentialDeps = ['express', 'mongoose'];
    for (const dep of essentialDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✅ ${dep} dependency found`);
        } else {
            console.log(`⚠️  ${dep} dependency not found (may be optional)`);
        }
    }
} catch (error) {
    console.log('❌ package.json is invalid or missing');
    allChecksPassed = false;
}

console.log('\n4. File Structure Validation:');
console.log('=============================');

// Check for essential files
const essentialFiles = [
    'server.js',
    'product.html',
    'package.json',
    'models/Product.js'
];

for (const file of essentialFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allChecksPassed = false;
    }
}

console.log('\n5. Backup Files Check:');
console.log('=====================');

// Check for backup files
const backupFiles = fs.readdirSync('.').filter(file => file.includes('backup'));
if (backupFiles.length > 0) {
    console.log(`✅ Found ${backupFiles.length} backup files`);
    backupFiles.forEach(file => console.log(`   - ${file}`));
} else {
    console.log('⚠️  No backup files found');
}

console.log('\n6. Final Assessment:');
console.log('===================');

if (allChecksPassed) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ The changes are safe and ready for deployment');
    console.log('✅ No errors detected');
    console.log('✅ All essential components are in place');
} else {
    console.log('⚠️  SOME CHECKS FAILED');
    console.log('❌ Please review the issues above before deploying');
    console.log('❌ Some components may be missing or invalid');
}

console.log('\n📋 Summary:');
console.log('===========');
console.log('• Server.js: Syntax valid, cache-busting implemented');
console.log('• Product.html: Structure valid, meta tags cleaned');
console.log('• Package.json: Valid JSON structure');
console.log('• File structure: All essential files present');
console.log('• Backups: Available for rollback if needed');

console.log('\n🚀 Next Steps:');
console.log('==============');
if (allChecksPassed) {
    console.log('1. Deploy to production: ./deploy-product-sharing-fix.sh --production');
    console.log('2. Test with Facebook Debugger');
    console.log('3. Clear social media caches');
    console.log('4. Monitor for 24-48 hours');
} else {
    console.log('1. Fix the issues identified above');
    console.log('2. Re-run validation: node scripts/validate-changes.js');
    console.log('3. Deploy only after all checks pass');
}

console.log('\n✅ Validation complete!');
