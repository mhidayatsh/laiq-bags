#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🧪 Running comprehensive server tests...\n');

const tests = [
  { name: 'Main Page', path: '/', expectedStatus: 200 },
  { name: 'Health Check', path: '/api/health', expectedStatus: 200 },
  { name: 'CSS File', path: '/css/styles.css', expectedStatus: 200 },
  { name: 'JavaScript File', path: '/js/main.js', expectedStatus: 200 },
  { name: 'Logo Image', path: '/assets/laiq-logo.png', expectedStatus: 200 },
  { name: 'Favicon', path: '/favicon.ico', expectedStatus: 200 },
  { name: 'Web Manifest', path: '/site.webmanifest', expectedStatus: 200 },
  { name: 'Settings API', path: '/api/settings', expectedStatus: 200 }
];

let passedTests = 0;
let totalTests = tests.length;

function runTest(test, index) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: test.path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      const success = res.statusCode === test.expectedStatus;
      const status = success ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}/${totalTests}: ${test.name} (${res.statusCode})`);
      
      if (success) passedTests++;
      resolve();
    });

    req.on('error', (error) => {
      console.log(`❌ Test ${index + 1}/${totalTests}: ${test.name} (Error: ${error.message})`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`❌ Test ${index + 1}/${totalTests}: ${test.name} (Timeout)`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runAllTests() {
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the server configuration.');
  }
}

runAllTests();
