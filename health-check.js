#!/usr/bin/env node

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('✅ Server Health Check:');
      console.log('   Status:', health.status);
      console.log('   Environment:', health.environment);
      console.log('   Timestamp:', health.timestamp);
      console.log('   Security:', health.security);
    } catch (error) {
      console.log('❌ Invalid health check response');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Health check failed:', error.message);
});

req.on('timeout', () => {
  console.log('❌ Health check timeout');
  req.destroy();
});

req.end();
