#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Laiq Bags Quick Fix Script');
console.log('==============================\n');

// Check if server is running
async function checkServerStatus() {
    return new Promise((resolve) => {
        exec('lsof -i :3001', (error, stdout) => {
            if (stdout) {
                console.log('✅ HTTP Server is running on port 3001');
                resolve(true);
            } else {
                console.log('❌ HTTP Server is not running on port 3001');
                resolve(false);
            }
        });
    });
}

// Check if HTTPS server is running
async function checkHttpsStatus() {
    return new Promise((resolve) => {
        exec('lsof -i :3443', (error, stdout) => {
            if (stdout) {
                console.log('✅ HTTPS Server is running on port 3443');
                resolve(true);
            } else {
                console.log('❌ HTTPS Server is not running on port 3443');
                resolve(false);
            }
        });
    });
}

// Check MongoDB connection
async function checkMongoDB() {
    return new Promise((resolve) => {
        exec('mongosh --eval "db.runCommand({ping: 1})" --quiet', (error, stdout) => {
            if (!error && stdout.includes('ok')) {
                console.log('✅ MongoDB is accessible');
                resolve(true);
            } else {
                console.log('❌ MongoDB connection failed');
                resolve(false);
            }
        });
    });
}

// Clear Node.js cache
function clearCache() {
    console.log('\n🧹 Clearing Node.js cache...');
    
    const cacheDirs = [
        path.join(process.cwd(), 'node_modules/.cache'),
        path.join(process.cwd(), '.next'),
        path.join(process.cwd(), 'dist')
    ];
    
    cacheDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                fs.rmSync(dir, { recursive: true, force: true });
                console.log(`   ✅ Cleared: ${dir}`);
            } catch (error) {
                console.log(`   ⚠️  Could not clear: ${dir}`);
            }
        }
    });
}

// Restart server
function restartServer() {
    console.log('\n🔄 Restarting server...');
    
    // Kill existing processes
    exec('pkill -f "node server.js"', (error) => {
        if (error) {
            console.log('   ℹ️  No existing server process found');
        } else {
            console.log('   ✅ Killed existing server process');
        }
        
        // Start server
        console.log('   🚀 Starting server...');
        const serverProcess = exec('node server.js', (error, stdout, stderr) => {
            if (error) {
                console.log(`   ❌ Server failed to start: ${error.message}`);
            }
        });
        
        serverProcess.stdout.on('data', (data) => {
            console.log(`   📝 ${data.trim()}`);
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.log(`   ⚠️  ${data.trim()}`);
        });
        
        // Wait a bit then check status
        setTimeout(async () => {
            console.log('\n📊 Checking server status...');
            await checkServerStatus();
            await checkHttpsStatus();
            console.log('\n✅ Quick fix completed!');
            process.exit(0);
        }, 5000);
    });
}

// Main function
async function main() {
    console.log('🔍 Checking current status...\n');
    
    const httpRunning = await checkServerStatus();
    const httpsRunning = await checkHttpsStatus();
    const mongoConnected = await checkMongoDB();
    
    console.log('\n📋 Status Summary:');
    console.log(`   HTTP Server: ${httpRunning ? '✅ Running' : '❌ Stopped'}`);
    console.log(`   HTTPS Server: ${httpsRunning ? '✅ Running' : '❌ Stopped'}`);
    console.log(`   MongoDB: ${mongoConnected ? '✅ Connected' : '❌ Disconnected'}`);
    
    if (!httpRunning || !httpsRunning || !mongoConnected) {
        console.log('\n⚠️  Issues detected. Applying fixes...');
        clearCache();
        restartServer();
    } else {
        console.log('\n✅ All systems are running properly!');
        console.log('💡 If you\'re still experiencing issues, try:');
        console.log('   1. Check browser console for errors');
        console.log('   2. Verify network connectivity');
        console.log('   3. Check MongoDB Atlas status');
        console.log('   4. Run: npm run dev');
    }
}

// Run the script
main().catch(console.error);
