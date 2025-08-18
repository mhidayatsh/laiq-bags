#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Configuration
const config = {
    httpPort: 3001,
    httpsPort: 3443,
    checkInterval: 5000, // 5 seconds
    timeout: 10000 // 10 seconds
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Health check function
function checkServer(port, protocol = 'http') {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/health',
            method: 'GET',
            timeout: config.timeout
        };

        const req = (protocol === 'https' ? https : http).request(options, (res) => {
            const responseTime = Date.now() - startTime;
            const status = res.statusCode === 200 ? 'OK' : 'ERROR';
            const color = res.statusCode === 200 ? colors.green : colors.red;
            
            console.log(`${color}${protocol.toUpperCase()} ${port}: ${status} (${res.statusCode}) - ${responseTime}ms${colors.reset}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const healthData = JSON.parse(data);
                    if (healthData.uptime) {
                        console.log(`   Uptime: ${Math.floor(healthData.uptime / 3600)}h ${Math.floor((healthData.uptime % 3600) / 60)}m`);
                    }
                    if (healthData.memory) {
                        const mem = healthData.memory;
                        const usedMB = Math.round(mem.used / 1024 / 1024);
                        const totalMB = Math.round(mem.total / 1024 / 1024);
                        console.log(`   Memory: ${usedMB}MB / ${totalMB}MB (${Math.round(usedMB/totalMB*100)}%)`);
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            });
            
            resolve({ status: 'OK', responseTime, statusCode: res.statusCode });
        });

        req.on('error', (err) => {
            const responseTime = Date.now() - startTime;
            console.log(`${colors.red}${protocol.toUpperCase()} ${port}: ERROR - ${err.message} (${responseTime}ms)${colors.reset}`);
            resolve({ status: 'ERROR', error: err.message, responseTime });
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`${colors.yellow}${protocol.toUpperCase()} ${port}: TIMEOUT after ${config.timeout}ms${colors.reset}`);
            resolve({ status: 'TIMEOUT', responseTime: config.timeout });
        });

        req.end();
    });
}

// Database connection check
async function checkDatabase() {
    try {
        const response = await fetch('http://localhost:3001/api/health/db');
        const data = await response.json();
        
        if (data.success) {
            console.log(`${colors.green}Database: CONNECTED${colors.reset}`);
            if (data.data) {
                console.log(`   Collections: ${data.data.collections || 'N/A'}`);
                console.log(`   Status: ${data.data.status || 'N/A'}`);
            }
        } else {
            console.log(`${colors.red}Database: ERROR - ${data.message || 'Unknown error'}${colors.reset}`);
        }
    } catch (error) {
        console.log(`${colors.red}Database: UNREACHABLE - ${error.message}${colors.reset}`);
    }
}

// Main monitoring loop
async function startMonitoring() {
    console.log(`${colors.cyan}🚀 Starting Laiq Bags Server Monitor${colors.reset}`);
    console.log(`${colors.blue}Monitoring servers every ${config.checkInterval/1000} seconds...${colors.reset}\n`);

    setInterval(async () => {
        console.log(`\n${colors.magenta}📊 Health Check - ${new Date().toLocaleTimeString()}${colors.reset}`);
        console.log('─'.repeat(50));
        
        // Check HTTP server
        await checkServer(config.httpPort, 'http');
        
        // Check HTTPS server
        await checkServer(config.httpsPort, 'https');
        
        // Check database
        await checkDatabase();
        
        console.log('─'.repeat(50));
    }, config.checkInterval);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}🛑 Monitoring stopped${colors.reset}`);
    process.exit(0);
});

// Start monitoring
startMonitoring().catch(console.error);
