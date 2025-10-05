// Frontend API Integration Test
console.log('🔍 Frontend API Integration Test');
console.log('================================\n');

// Test if the frontend can properly communicate with the API
async function testFrontendIntegration() {
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('❌ This test needs to run in a browser environment');
    return;
  }
  
  console.log('🌐 Testing frontend API integration...');
  
  try {
    // Test 1: Check if fetch is available
    console.log('1. Checking fetch availability...');
    if (typeof fetch !== 'undefined') {
      console.log('   ✅ Fetch API available');
    } else {
      console.log('   ❌ Fetch API not available');
      return;
    }
    
    // Test 2: Test basic connectivity
    console.log('2. Testing API connectivity...');
    const healthCheck = await fetch('/api/sessions', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthCheck.status === 404 || healthCheck.status === 405) {
      console.log('   ✅ API endpoint reachable (expected 404/405 for GET on sessions)');
    } else {
      console.log(`   ⚠️  Unexpected status: ${healthCheck.status}`);
    }
    
    // Test 3: Test session creation from frontend
    console.log('3. Testing session creation from frontend...');
    const sessionData = {
      sessionId: `frontend-test-${Date.now()}`,
      mode: 'patient',
      patientInfo: { age: 25, gender: 'female' }
    };
    
    const sessionResponse = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      console.log('   ✅ Frontend session creation successful');
      console.log(`   📝 Session ID: ${session.sessionId}`);
      
      // Test 4: Test MCQ generation from frontend
      console.log('4. Testing MCQ generation from frontend...');
      const mcqResponse = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: 'chest pain and difficulty breathing',
          mode: 'patient',
          sessionId: session.sessionId,
          questionType: 'mcq'
        })
      });
      
      if (mcqResponse.ok) {
        const mcqData = await mcqResponse.json();
        console.log('   ✅ Frontend MCQ generation successful');
        console.log(`   📋 MCQs generated: ${mcqData.followUpMCQs?.length || 0}`);
        
        if (mcqData.followUpMCQs && mcqData.followUpMCQs.length > 0) {
          console.log(`   💬 Sample MCQ: ${mcqData.followUpMCQs[0].question}`);
        }
      } else {
        const mcqError = await mcqResponse.text();
        console.log(`   ❌ Frontend MCQ generation failed: ${mcqError}`);
      }
      
      // Test 5: Test descriptive generation from frontend
      console.log('5. Testing descriptive generation from frontend...');
      const descriptiveResponse = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: 'persistent headache and nausea',
          mode: 'patient',
          sessionId: session.sessionId,
          questionType: 'descriptive'
        })
      });
      
      if (descriptiveResponse.ok) {
        const descriptiveData = await descriptiveResponse.json();
        console.log('   ✅ Frontend descriptive generation successful');
        console.log(`   📝 Questions generated: ${descriptiveData.questions?.length || 0}`);
        
        if (descriptiveData.questions && descriptiveData.questions.length > 0) {
          console.log(`   💭 Sample question: ${descriptiveData.questions[0]}`);
        }
      } else {
        const descriptiveError = await descriptiveResponse.text();
        console.log(`   ❌ Frontend descriptive generation failed: ${descriptiveError}`);
      }
      
    } else {
      const sessionError = await sessionResponse.text();
      console.log(`   ❌ Frontend session creation failed: ${sessionError}`);
    }
    
    console.log('\n🎯 Frontend Integration Summary:');
    console.log('If tests passed, the issue is likely in the UI components or form handling.');
    console.log('If tests failed, there\'s a communication issue between frontend and backend.');
    
  } catch (error) {
    console.error('❌ Frontend integration test error:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testFrontendIntegration();
}

// Export for manual running
window.testFrontendIntegration = testFrontendIntegration;
