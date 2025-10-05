// Real-time frontend test for MCQ and Descriptive Questions
console.log('🔍 Real-time Frontend Test for Question Generation');
console.log('==============================================\n');

async function testQuestionGeneration() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('📍 Testing Question Generation Endpoints...\n');
    
    // Test 1: MCQ Questions
    console.log('1. Testing MCQ Question Generation:');
    console.log('   Request: symptoms="chest pain", questionType="mcq"');
    
    const mcqTest = await fetch(`${baseUrl}/api/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: 'chest pain and shortness of breath',
        mode: 'patient',
        sessionId: `test-mcq-${Date.now()}`,
        questionType: 'mcq'
      })
    });
    
    if (mcqTest.ok) {
      const mcqData = await mcqTest.json();
      console.log('   ✅ MCQ Response received');
      console.log(`   📋 Structure: ${Object.keys(mcqData).join(', ')}`);
      
      if (mcqData.followUpMCQs && mcqData.followUpMCQs.length > 0) {
        console.log(`   📝 MCQ Count: ${mcqData.followUpMCQs.length}`);
        console.log(`   💬 Sample MCQ: "${mcqData.followUpMCQs[0].question}"`);
        console.log(`   🔘 Options: ${mcqData.followUpMCQs[0].options?.map(o => o.text).join(', ') || 'No options found'}`);
      } else {
        console.log('   ⚠️  No MCQs found in response');
      }
    } else {
      console.log(`   ❌ MCQ Test failed: ${mcqTest.status} ${mcqTest.statusText}`);
    }
    
    console.log('\n');
    
    // Test 2: Descriptive Questions
    console.log('2. Testing Descriptive Question Generation:');
    console.log('   Request: symptoms="headache", questionType="descriptive"');
    
    const descriptiveTest = await fetch(`${baseUrl}/api/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms: 'persistent headache and dizziness',
        mode: 'patient',
        sessionId: `test-descriptive-${Date.now()}`,
        questionType: 'descriptive'
      })
    });
    
    if (descriptiveTest.ok) {
      const descriptiveData = await descriptiveTest.json();
      console.log('   ✅ Descriptive Response received');
      console.log(`   📋 Structure: ${Object.keys(descriptiveData).join(', ')}`);
      
      if (descriptiveData.questions && descriptiveData.questions.length > 0) {
        console.log(`   📝 Question Count: ${descriptiveData.questions.length}`);
        console.log(`   💭 Sample Question: "${descriptiveData.questions[0]}"`);
      } else {
        console.log('   ⚠️  No descriptive questions found in response');
      }
    } else {
      console.log(`   ❌ Descriptive Test failed: ${descriptiveTest.status} ${descriptiveTest.statusText}`);
    }
    
    console.log('\n🎯 Frontend Integration Status:');
    console.log('If both tests passed, the API is working correctly.');
    console.log('If questions appear in the UI, the frontend integration is fixed.');
    console.log('If questions don\'t appear, there may be UI rendering issues.');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Run the test
testQuestionGeneration();
