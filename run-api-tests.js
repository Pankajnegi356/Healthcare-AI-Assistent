import { apiTestService } from './client/src/services/api-test-service.ts';
import fetch from 'node-fetch';

// Configure global fetch for Node.js environment
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = fetch.Headers;
  globalThis.Request = fetch.Request;
  globalThis.Response = fetch.Response;
}

// Override fetch to use absolute URLs
const originalFetch = globalThis.fetch;
globalThis.fetch = function(url, options) {
  // Convert relative URLs to absolute URLs
  if (typeof url === 'string' && url.startsWith('/')) {
    url = `http://localhost:3000${url}`;
  }
  return originalFetch(url, options);
};

// Standalone script to run API tests
async function runAPITests() {
  console.log('🚀 Starting API Test Service...\n');
  console.log('📍 Testing against: http://localhost:3000\n');
  
  try {
    
    const testSuites = await apiTestService.runAllTests();
    
    console.log('📊 Test Results Summary:');
    console.log('========================\n');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   Status: ${suite.overallStatus.toUpperCase()}`);
      console.log(`   Tests: ${suite.passedTests}/${suite.totalTests} passed`);
      console.log(`   Duration: ${suite.duration}ms`);
      
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
      
      // Show failed tests details
      const failedTests = suite.tests.filter(t => t.status === 'fail');
      if (failedTests.length > 0) {
        console.log('   ❌ Failed Tests:');
        failedTests.forEach(test => {
          console.log(`      - ${test.testName}: ${test.error}`);
        });
      }
      
      console.log('');
    });
    
    console.log('📈 Overall Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`);
    
  } catch (error) {
    console.error('❌ Error running API tests:', error);
  }
}

// Run the tests
runAPITests();
