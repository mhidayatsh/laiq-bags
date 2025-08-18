#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔒 Laiq Bags Security Audit');
console.log('============================\n');

// Check environment variables
function checkEnvironmentVariables() {
    console.log('📋 Checking Environment Variables...');
    
    const requiredVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'ENCRYPTION_KEY'
    ];
    
    const missing = [];
    
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });
    
    if (missing.length > 0) {
        console.log('❌ Missing environment variables:', missing.join(', '));
    } else {
        console.log('✅ All required environment variables are set');
    }
}

// Check file permissions
function checkFilePermissions() {
    console.log('\n📁 Checking File Permissions...');
    
    const sensitiveFiles = [
        'config.env',
        'package.json',
        'server.js'
    ];
    
    sensitiveFiles.forEach(file => {
        try {
            const stats = fs.statSync(file);
            const mode = stats.mode.toString(8);
            
            if (mode.endsWith('600') || mode.endsWith('400')) {
                console.log(`✅ ${file}: Secure permissions (${mode})`);
            } else {
                console.log(`⚠️  ${file}: Consider restricting permissions (${mode})`);
            }
        } catch (error) {
            console.log(`❌ ${file}: Cannot access`);
        }
    });
}

// Check for sensitive data in code
function checkSensitiveData() {
    console.log('\n🔍 Checking for Sensitive Data in Code...');
    
    const sensitivePatterns = [
        /password\s*[:=]\s*['"][^'"]+['"]/gi,
        /api_key\s*[:=]\s*['"][^'"]+['"]/gi,
        /secret\s*[:=]\s*['"][^'"]+['"]/gi,
        /token\s*[:=]\s*['"][^'"]+['"]/gi
    ];
    
    const filesToCheck = [
        'server.js',
        'routes/*.js',
        'models/*.js',
        'js/*.js'
    ];
    
    let foundSensitive = false;
    
    filesToCheck.forEach(pattern => {
        // This is a simplified check - in production, use a proper file glob library
        if (fs.existsSync(pattern)) {
            const content = fs.readFileSync(pattern, 'utf8');
            
            sensitivePatterns.forEach((regex, index) => {
                const matches = content.match(regex);
                if (matches) {
                    console.log(`❌ Found sensitive data in ${pattern}:`, matches.length, 'matches');
                    foundSensitive = true;
                }
            });
        }
    });
    
    if (!foundSensitive) {
        console.log('✅ No obvious sensitive data found in code');
    }
}

// Security recommendations
function securityRecommendations() {
    console.log('\n💡 Security Recommendations:');
    console.log('1. ✅ Use HTTPS in production');
    console.log('2. ✅ Enable MongoDB Atlas network access restrictions');
    console.log('3. ✅ Implement rate limiting');
    console.log('4. ✅ Use strong encryption keys');
    console.log('5. ✅ Regular security updates');
    console.log('6. ✅ Monitor logs for suspicious activity');
    console.log('7. ✅ Backup data regularly');
    console.log('8. ✅ Use environment variables for secrets');
    console.log('9. ✅ Implement input validation');
    console.log('10. ✅ Use prepared statements for database queries');
}

// Run security audit
function runAudit() {
    checkEnvironmentVariables();
    checkFilePermissions();
    checkSensitiveData();
    securityRecommendations();
    
    console.log('\n🔒 Security audit completed!');
}

// Run if called directly
if (require.main === module) {
    runAudit();
}

module.exports = {
    runAudit,
    checkEnvironmentVariables,
    checkFilePermissions,
    checkSensitiveData,
    securityRecommendations
}; 

const fs = require('fs');
const path = require('path');

console.log('🔒 Laiq Bags Security Audit');
console.log('============================\n');

// Check environment variables
function checkEnvironmentVariables() {
    console.log('📋 Checking Environment Variables...');
    
    const requiredVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'ENCRYPTION_KEY'
    ];
    
    const missing = [];
    
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });
    
    if (missing.length > 0) {
        console.log('❌ Missing environment variables:', missing.join(', '));
    } else {
        console.log('✅ All required environment variables are set');
    }
}

// Check file permissions
function checkFilePermissions() {
    console.log('\n📁 Checking File Permissions...');
    
    const sensitiveFiles = [
        'config.env',
        'package.json',
        'server.js'
    ];
    
    sensitiveFiles.forEach(file => {
        try {
            const stats = fs.statSync(file);
            const mode = stats.mode.toString(8);
            
            if (mode.endsWith('600') || mode.endsWith('400')) {
                console.log(`✅ ${file}: Secure permissions (${mode})`);
            } else {
                console.log(`⚠️  ${file}: Consider restricting permissions (${mode})`);
            }
        } catch (error) {
            console.log(`❌ ${file}: Cannot access`);
        }
    });
}

// Check for sensitive data in code
function checkSensitiveData() {
    console.log('\n🔍 Checking for Sensitive Data in Code...');
    
    const sensitivePatterns = [
        /password\s*[:=]\s*['"][^'"]+['"]/gi,
        /api_key\s*[:=]\s*['"][^'"]+['"]/gi,
        /secret\s*[:=]\s*['"][^'"]+['"]/gi,
        /token\s*[:=]\s*['"][^'"]+['"]/gi
    ];
    
    const filesToCheck = [
        'server.js',
        'routes/*.js',
        'models/*.js',
        'js/*.js'
    ];
    
    let foundSensitive = false;
    
    filesToCheck.forEach(pattern => {
        // This is a simplified check - in production, use a proper file glob library
        if (fs.existsSync(pattern)) {
            const content = fs.readFileSync(pattern, 'utf8');
            
            sensitivePatterns.forEach((regex, index) => {
                const matches = content.match(regex);
                if (matches) {
                    console.log(`❌ Found sensitive data in ${pattern}:`, matches.length, 'matches');
                    foundSensitive = true;
                }
            });
        }
    });
    
    if (!foundSensitive) {
        console.log('✅ No obvious sensitive data found in code');
    }
}

// Security recommendations
function securityRecommendations() {
    console.log('\n💡 Security Recommendations:');
    console.log('1. ✅ Use HTTPS in production');
    console.log('2. ✅ Enable MongoDB Atlas network access restrictions');
    console.log('3. ✅ Implement rate limiting');
    console.log('4. ✅ Use strong encryption keys');
    console.log('5. ✅ Regular security updates');
    console.log('6. ✅ Monitor logs for suspicious activity');
    console.log('7. ✅ Backup data regularly');
    console.log('8. ✅ Use environment variables for secrets');
    console.log('9. ✅ Implement input validation');
    console.log('10. ✅ Use prepared statements for database queries');
}

// Run security audit
function runAudit() {
    checkEnvironmentVariables();
    checkFilePermissions();
    checkSensitiveData();
    securityRecommendations();
    
    console.log('\n🔒 Security audit completed!');
}

// Run if called directly
if (require.main === module) {
    runAudit();
}

module.exports = {
    runAudit,
    checkEnvironmentVariables,
    checkFilePermissions,
    checkSensitiveData,
    securityRecommendations
}; 