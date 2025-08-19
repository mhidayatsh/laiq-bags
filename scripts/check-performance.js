#!/usr/bin/env node

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'mdhidayatullahsheikh786@gmail.com';
const ADMIN_PASSWORD = 'Mdhidayat786@';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(50), 'cyan');
  log(message, 'bright');
  log('='.repeat(50), 'cyan');
}

function logMetric(label, value, unit = '') {
  log(`${label}: ${colors.green}${value}${colors.reset}${unit}`, 'bright');
}

async function loginAsAdmin() {
  try {
    log('🔐 Logging in as admin...', 'yellow');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success) {
      log('✅ Admin login successful', 'green');
      return response.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    log('❌ Admin login failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return null;
  }
}

async function getPerformanceStats(token) {
  try {
    log('📊 Fetching performance statistics...', 'yellow');
    
    const response = await axios.get(`${API_BASE}/products/performance/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('✅ Performance data retrieved successfully', 'green');
      return response.data.performance;
    } else {
      throw new Error('Failed to get performance data');
    }
  } catch (error) {
    log('❌ Failed to get performance stats', 'red');
    log(`Error: ${error.message}`, 'red');
    return null;
  }
}

function formatUptime(uptime) {
  if (uptime.hours > 0) {
    return `${uptime.hours}h ${uptime.minutes}m ${uptime.seconds}s`;
  } else if (uptime.minutes > 0) {
    return `${uptime.minutes}m ${uptime.seconds}s`;
  } else {
    return `${uptime.seconds}s`;
  }
}

function displaySummary(summary) {
  logHeader('📈 PERFORMANCE SUMMARY');
  
  logMetric('Uptime', formatUptime(summary.uptime));
  logMetric('Total Requests', summary.requests.total.toLocaleString());
  logMetric('Requests/Second', summary.requests.perSecond);
  logMetric('Error Rate', summary.requests.errorRate);
  logMetric('Slow Queries', summary.slowQueries);
}

function displayTopEndpoints(endpoints) {
  logHeader('🔥 TOP ENDPOINTS');
  
  if (endpoints.length === 0) {
    log('No endpoint data available', 'yellow');
    return;
  }

  endpoints.slice(0, 10).forEach((endpoint, index) => {
    const status = endpoint.errorCount === 0 ? '✅' : 
                   endpoint.errorCount < 5 ? '⚠️' : '❌';
    
    log(`${status} ${endpoint.endpoint}`, 'bright');
    log(`   Requests: ${endpoint.count.toLocaleString()} | Avg Duration: ${endpoint.avgDuration.toFixed(2)}ms | Errors: ${endpoint.errorCount}`, 'reset');
  });
}

function displaySlowQueries(slowQueries) {
  logHeader('🐌 SLOW QUERIES (>1s)');
  
  if (slowQueries.length === 0) {
    log('✅ No slow queries detected', 'green');
    return;
  }

  slowQueries.slice(0, 5).forEach((query, index) => {
    log(`${index + 1}. ${query.operation}`, 'red');
    log(`   Duration: ${query.duration}ms | Time: ${new Date(query.timestamp).toLocaleString()}`, 'reset');
  });
}

function displayDatabasePerformance(dbMetrics) {
  logHeader('🗄️ DATABASE PERFORMANCE');
  
  if (dbMetrics.length === 0) {
    log('No database metrics available', 'yellow');
    return;
  }

  dbMetrics.slice(0, 5).forEach((metric, index) => {
    const operation = metric.operation.replace('DB:products:', '');
    log(`${index + 1}. ${operation}`, 'bright');
    log(`   Count: ${metric.count} | Avg: ${metric.avgDuration.toFixed(2)}ms | Min: ${metric.minDuration}ms | Max: ${metric.maxDuration}ms`, 'reset');
  });
}

function displayCachePerformance(cacheMetrics) {
  logHeader('💾 CACHE PERFORMANCE');
  
  if (cacheMetrics.length === 0) {
    log('No cache metrics available', 'yellow');
    return;
  }

  cacheMetrics.forEach((metric, index) => {
    log(`${index + 1}. ${metric.operation}`, 'bright');
    log(`   Hits: ${metric.hits} | Misses: ${metric.misses} | Hit Rate: ${metric.hitRate}`, 'reset');
  });
}

async function main() {
  logHeader('🚀 LAIQ BAGS PERFORMANCE MONITOR');
  
  // Check if server is running
  try {
    await axios.get(`${API_BASE}/health`);
    log('✅ Server is running', 'green');
  } catch (error) {
    log('❌ Server is not running', 'red');
    log('Please start the server first: node server.js', 'yellow');
    process.exit(1);
  }

  // Login as admin
  const token = await loginAsAdmin();
  if (!token) {
    process.exit(1);
  }

  // Get performance stats
  const performance = await getPerformanceStats(token);
  if (!performance) {
    process.exit(1);
  }

  // Display all sections
  displaySummary(performance.summary);
  displayTopEndpoints(performance.topEndpoints);
  displaySlowQueries(performance.slowQueries);
  displayDatabasePerformance(performance.database);
  displayCachePerformance(performance.cache);

  logHeader('✅ PERFORMANCE CHECK COMPLETE');
  log('💡 Tip: Use the web dashboard at http://localhost:3001/admin-performance.html for detailed charts', 'cyan');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log('❌ Script failed', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main };
