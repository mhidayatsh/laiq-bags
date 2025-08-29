// Script to check server status and verify updated code
const http = require('http');
const https = require('https');

console.log('🔍 Checking server status...\n');

// Check common ports
const ports = [3000, 3001, 5000, 8000, 4000, 5001];

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      console.log(`✅ Port ${port}: Server is running (Status: ${res.statusCode})`);
      resolve({ port, status: 'running', statusCode: res.statusCode });
    }).on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log(`❌ Port ${port}: No server running`);
        resolve({ port, status: 'not-running' });
      } else {
        console.log(`⚠️ Port ${port}: Error - ${err.message}`);
        resolve({ port, status: 'error', error: err.message });
      }
    });
    
    req.setTimeout(3000, () => {
      console.log(`⏰ Port ${port}: Connection timeout`);
      req.destroy();
      resolve({ port, status: 'timeout' });
    });
  });
}

async function checkAllPorts() {
  console.log('🔍 Checking all common ports...\n');
  
  const results = [];
  for (const port of ports) {
    const result = await checkPort(port);
    results.push(result);
  }
  
  const runningServers = results.filter(r => r.status === 'running');
  
  if (runningServers.length === 0) {
    console.log('\n❌ No servers found running on common ports!');
    console.log('\n💡 To start the server, run:');
    console.log('   npm start');
    console.log('   or');
    console.log('   node server.js');
    console.log('   or');
    console.log('   npm run dev');
  } else {
    console.log(`\n✅ Found ${runningServers.length} server(s) running:`);
    runningServers.forEach(server => {
      console.log(`   - Port ${server.port} (Status: ${server.statusCode})`);
    });
    
    console.log('\n💡 If stock updates are not working:');
    console.log('   1. Restart the server to load updated code');
    console.log('   2. Check server logs for stock update messages');
    console.log('   3. Verify the order creation process');
  }
}

// Check if there are any Node.js processes running
async function checkNodeProcesses() {
  console.log('\n🔍 Checking for Node.js processes...\n');
  
  const { exec } = require('child_process');
  
  exec('ps aux | grep node | grep -v grep', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Error checking processes:', error.message);
      return;
    }
    
    if (stdout.trim()) {
      console.log('📋 Node.js processes found:');
      console.log(stdout);
    } else {
      console.log('❌ No Node.js processes found');
    }
  });
}

// Main function
async function main() {
  await checkAllPorts();
  await checkNodeProcesses();
  
  console.log('\n📋 Next Steps:');
  console.log('1. If no server is running, start it with: npm start');
  console.log('2. If server is running but stock updates not working:');
  console.log('   - Restart the server to load updated code');
  console.log('   - Check server logs for stock update messages');
  console.log('   - Test with a new order');
  console.log('3. Run debug script: node scripts/debug-stock-update.js');
}

main().catch(console.error);
