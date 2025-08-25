#!/usr/bin/env node

/**
 * Domain Consistency Fix Script
 * Ensures all URLs use www.laiq.shop consistently
 */

const fs = require('fs');
const path = require('path');

// Function to recursively find all files
function findFiles(dir, extensions = ['.html', '.js', '.md']) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            results = results.concat(findFiles(filePath, extensions));
        } else if (extensions.some(ext => file.endsWith(ext))) {
            results.push(filePath);
        }
    });
    
    return results;
}

// Function to replace content in a file
function replaceInFile(filePath, oldString, newString) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Replace all occurrences
        content = content.replace(new RegExp(oldString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newString);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function
function fixDomainConsistency() {
    console.log('🔧 Starting domain consistency fix...');
    
    const files = findFiles('.');
    let fixedCount = 0;
    
    // Replace patterns
    const replacements = [
        {
            old: 'https://www.www.laiq.shop',
            new: 'https://www.laiq.shop'
        },
        {
            old: 'www.www.laiq.shop',
            new: 'www.laiq.shop'
        },
        {
            old: 'info@www.www.laiq.shop',
            new: 'info@laiq.shop'
        }
    ];
    
    files.forEach(file => {
        let fileFixed = false;
        
        replacements.forEach(replacement => {
            if (replaceInFile(file, replacement.old, replacement.new)) {
                fileFixed = true;
            }
        });
        
        if (fileFixed) {
            fixedCount++;
        }
    });
    
    console.log(`\n🎉 Domain consistency fix completed!`);
    console.log(`📊 Files processed: ${files.length}`);
    console.log(`🔧 Files fixed: ${fixedCount}`);
    
    // Special handling for domain-fixer.js
    const domainFixerPath = './js/domain-fixer.js';
    if (fs.existsSync(domainFixerPath)) {
        console.log('\n⚠️  Note: domain-fixer.js needs manual review as it contains domain-specific logic');
    }
}

// Run the fix
fixDomainConsistency();
