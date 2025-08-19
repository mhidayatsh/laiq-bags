#!/usr/bin/env node

/**
 * Comprehensive Production Issues Fix Script
 * Fixes MongoDB connection, static file serving, and environment configuration issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting comprehensive production issues fix...\n');

// 1. Check and fix environment configuration
console.log('📋 Step 1: Checking environment configuration...');

const configPath = path.join(__dirname, 'config.env');
const productionConfigPath = path.join(__dirname, 'config.env.production');

if (!fs.existsSync(configPath)) {
  console.log('❌ config.env not found, creating from example...');
  const examplePath = path.join(__dirname, 'config.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, configPath);
    console.log('✅ Created config.env from example');
  } else {
    console.log('❌ config.env.example not found');
  }
}

// 2. Fix MongoDB connection string
console.log('\n🔗 Step 2: Checking MongoDB connection...');

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  const mongoUriMatch = configContent.match(/MONGODB_URI=(.+)/);
  
  if (mongoUriMatch) {
    const mongoUri = mongoUriMatch[1].trim();
    console.log('📡 Current MongoDB URI:', mongoUri.substring(0, 50) + '...');
    
    // Test MongoDB connection
    console.log('🧪 Testing MongoDB connection...');
    try {
      const mongoose = require('mongoose');
      mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      
      setTimeout(() => {
        if (mongoose.connection.readyState === 1) {
          console.log('✅ MongoDB connection successful');
          mongoose.disconnect();
        } else {
          console.log('❌ MongoDB connection failed');
          console.log('💡 Please check your MongoDB Atlas configuration');
        }
      }, 6000);
    } catch (error) {
      console.log('❌ MongoDB connection error:', error.message);
    }
  } else {
    console.log('❌ MONGODB_URI not found in config.env');
  }
} catch (error) {
  console.log('❌ Error reading config.env:', error.message);
}

// 3. Fix static file serving
console.log('\n📁 Step 3: Checking static file structure...');

const requiredDirs = ['assets', 'css', 'js', 'uploads'];
const requiredFiles = [
  'index.html',
  'favicon.ico',
  'site.webmanifest',
  'assets/laiq-logo.png',
  'css/styles.css',
  'js/main.js'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Directory missing: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`✅ Directory exists: ${dir}`);
  }
});

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File missing: ${file}`);
  } else {
    console.log(`✅ File exists: ${file}`);
  }
});

// 4. Fix package.json scripts
console.log('\n📦 Step 4: Checking package.json...');

try {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // Add/update essential scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "start": "node server.js",
    "dev": "NODE_ENV=development node server.js",
    "prod": "NODE_ENV=production node server.js",
    "restart": "pkill -f 'node server.js' && npm start"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json scripts');
} catch (error) {
  console.log('❌ Error updating package.json:', error.message);
}

// 5. Create production environment file
console.log('\n🌍 Step 5: Setting up production environment...');

const productionConfig = `# Production Environment Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
MONGODB_URI=${process.env.MONGODB_URI || 'mongodb+srv://laiqbags:CVnxzKLO8U6WtY2A@cluster0.eoti40j.mongodb.net/laiq_bags_production?retryWrites=true&w=majority&appName=Cluster0'}

# Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_R6phvDnUNW
RAZORPAY_KEY_SECRET=xzg73Bh1a3QPPePk1Dr

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hida7149@gmail.com
EMAIL_PASS=xmgr afzj tcef vmdv

# JWT Configuration
JWT_SECRET=6741df7bc1e5d0aa28ca314d7f86954d2eb3870ecea64cd533a7490ba7954126
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=https://www.laiq.shop

# Security Configuration
ENCRYPTION_KEY=7cc8264468b77ed7a80964d8c13d1ab9
SESSION_SECRET=1175f0fbb9df4eaebcf83df83ee30793
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Production-specific settings
ENABLE_BASE_LIMITER=true
`;

fs.writeFileSync(productionConfigPath, productionConfig);
console.log('✅ Created production environment configuration');

// 6. Create startup scripts
console.log('\n🚀 Step 6: Creating startup scripts...');

const startScript = `#!/bin/bash
echo "🚀 Starting Laiq Bags Production Server..."

# Set production environment
export NODE_ENV=production

# Check if port is available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is already in use. Stopping existing process..."
    pkill -f "node server.js"
    sleep 2
fi

# Start the server
echo "🔧 Starting server with production configuration..."
node server.js
`;

const restartScript = `#!/bin/bash
echo "🔄 Restarting Laiq Bags Server..."

# Stop existing processes
echo "🛑 Stopping existing server processes..."
pkill -f "node server.js"
sleep 2

# Start the server
echo "🚀 Starting server..."
npm start
`;

fs.writeFileSync(path.join(__dirname, 'start-production.sh'), startScript);
fs.writeFileSync(path.join(__dirname, 'restart-server.sh'), restartScript);

// Make scripts executable
try {
  execSync('chmod +x start-production.sh restart-server.sh');
  console.log('✅ Created and made startup scripts executable');
} catch (error) {
  console.log('⚠️  Could not make scripts executable (this is normal on Windows)');
}

// 7. Create health check endpoint
console.log('\n🏥 Step 7: Creating health check...');

const healthCheckScript = `#!/usr/bin/env node

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
`;

fs.writeFileSync(path.join(__dirname, 'health-check.js'), healthCheckScript);

// 8. Create comprehensive test script
console.log('\n🧪 Step 8: Creating comprehensive test script...');

const testScript = `#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🧪 Running comprehensive server tests...\\n');

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
      console.log(\`\${status} Test \${index + 1}/\${totalTests}: \${test.name} (\${res.statusCode})\`);
      
      if (success) passedTests++;
      resolve();
    });

    req.on('error', (error) => {
      console.log(\`❌ Test \${index + 1}/\${totalTests}: \${test.name} (Error: \${error.message})\`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(\`❌ Test \${index + 1}/\${totalTests}: \${test.name} (Timeout)\`);
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
  
  console.log(\`\\n📊 Test Results: \${passedTests}/\${totalTests} tests passed\`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the server configuration.');
  }
}

runAllTests();
`;

fs.writeFileSync(path.join(__dirname, 'test-server.js'), testScript);

// 9. Create deployment checklist
console.log('\n📋 Step 9: Creating deployment checklist...');

const deploymentChecklist = `# Production Deployment Checklist

## ✅ Pre-Deployment Checks
- [ ] MongoDB Atlas connection string is correct
- [ ] All environment variables are set
- [ ] SSL certificates are configured (if using HTTPS)
- [ ] Domain DNS is pointing to the server
- [ ] Firewall allows port 3001 (or configured port)

## 🚀 Deployment Steps
1. Upload all files to production server
2. Install dependencies: \`npm install\`
3. Set environment variables
4. Start server: \`npm run prod\` or \`./start-production.sh\`
5. Test all endpoints

## 🧪 Post-Deployment Tests
- [ ] Main page loads correctly
- [ ] Static files (CSS, JS, images) load
- [ ] API endpoints respond
- [ ] Database operations work
- [ ] Payment gateway integration works
- [ ] Email functionality works

## 🔧 Troubleshooting
- Check server logs: \`tail -f server.log\`
- Test MongoDB connection: \`node test-mongodb-connection.js\`
- Run health check: \`node health-check.js\`
- Run comprehensive tests: \`node test-server.js\`

## 📞 Support
If issues persist, check:
1. Server logs for error messages
2. MongoDB Atlas dashboard for connection issues
3. Network connectivity and firewall settings
4. Environment variable configuration
`;

fs.writeFileSync(path.join(__dirname, 'DEPLOYMENT_CHECKLIST.md'), deploymentChecklist);

console.log('\n🎉 Comprehensive production issues fix completed!');
console.log('\n📋 Next steps:');
console.log('1. Review the deployment checklist: DEPLOYMENT_CHECKLIST.md');
console.log('2. Test the server locally: node test-server.js');
console.log('3. Deploy to production using: ./start-production.sh');
console.log('4. Monitor server health: node health-check.js');
console.log('\n🔧 If you need to restart the server: ./restart-server.sh');
