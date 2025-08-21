const https = require('https');
const http = require('http');

// Configuration
const SITE_URL = 'https://laiq.shop';
const API_URL = 'https://laiq.shop/api/health';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
const TIMEOUT = 10000; // 10 seconds

console.log('🔧 Keep-alive script started for Laiq Bags');
console.log(`🌐 Target URL: ${SITE_URL}`);
console.log(`⏰ Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);
console.log('💓 Starting keep-alive pings...\n');

function pingServer() {
  const timestamp = new Date().toISOString();
  
  // Ping the main site
  const siteReq = https.get(SITE_URL, { timeout: TIMEOUT }, (res) => {
    console.log(`✅ [${timestamp}] Site ping successful: ${res.statusCode}`);
  });
  
  siteReq.on('error', (err) => {
    console.log(`❌ [${timestamp}] Site ping failed: ${err.message}`);
  });
  
  siteReq.on('timeout', () => {
    console.log(`⏰ [${timestamp}] Site ping timeout`);
    siteReq.destroy();
  });
  
  // Ping the API health endpoint
  const apiReq = https.get(API_URL, { timeout: TIMEOUT }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const healthData = JSON.parse(data);
        console.log(`🏥 [${timestamp}] API health: ${healthData.status} | DB: ${healthData.database?.status} | Uptime: ${healthData.system?.uptime?.hours}h ${healthData.system?.uptime?.minutes}m`);
      } catch (e) {
        console.log(`🏥 [${timestamp}] API health: ${res.statusCode} (parse error)`);
      }
    });
  });
  
  apiReq.on('error', (err) => {
    console.log(`❌ [${timestamp}] API ping failed: ${err.message}`);
  });
  
  apiReq.on('timeout', () => {
    console.log(`⏰ [${timestamp}] API ping timeout`);
    apiReq.destroy();
  });
}

// Start the first ping immediately
pingServer();

// Set up recurring pings
setInterval(pingServer, PING_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Keep-alive script stopped by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Keep-alive script stopped by system');
  process.exit(0);
});

console.log('🚀 Keep-alive script is running. Press Ctrl+C to stop.\n');
