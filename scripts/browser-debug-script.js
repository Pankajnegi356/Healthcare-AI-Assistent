// Frontend Debug Script - To run in browser console
console.log('🔍 Frontend Question Debug Script');
console.log('================================');

// Instructions for user
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Copy and paste this entire script into browser console (F12)');
console.log('2. Go through the consultation flow');
console.log('3. When you reach the questions section, the script will log details');
console.log('4. Compare MCQ vs Descriptive question counts\n');

// Monitor flowState changes
let lastFlowState = null;

function debugQuestionState() {
  // Try to access React state through DOM elements
  const consultationPanel = document.querySelector('[class*="consultation"]');
  
  console.log('\n🔍 Current Page State Analysis:');
  console.log('Time:', new Date().toLocaleTimeString());
  
  // Check for question elements
  const questionElements = document.querySelectorAll('[class*="question"], textarea, [class*="mcq"]');
  console.log('📝 Question elements found:', questionElements.length);
  
  // Check for MCQ options
  const mcqOptions = document.querySelectorAll('[class*="mcq-option"]');
  console.log('🔘 MCQ options found:', mcqOptions.length);
  
  // Check for textareas (descriptive questions)
  const textareas = document.querySelectorAll('textarea');
  console.log('📝 Textareas found:', textareas.length);
  
  // Check for question badges
  const questionBadges = document.querySelectorAll('[class*="badge"]:has-text("Multiple Choice"), [class*="badge"]:has-text("Descriptive")');
  console.log('🏷️ Question type badges found:', questionBadges.length);
  
  // Try to detect current step
  const stepIndicators = document.querySelectorAll('[class*="progress-step"]');
  const activeSteps = document.querySelectorAll('[class*="active"]');
  console.log('📊 Step indicators:', stepIndicators.length, 'Active:', activeSteps.length);
  
  // Look for question count indicators
  const questionCounters = document.querySelectorAll('*');
  for (let element of questionCounters) {
    if (element.textContent && element.textContent.includes('of') && element.textContent.includes('Question')) {
      console.log('📊 Question counter found:', element.textContent);
    }
  }
  
  console.log('----------------------------------------');
}

// Set up periodic monitoring
console.log('🔄 Starting automatic monitoring (every 3 seconds)');
const monitorInterval = setInterval(debugQuestionState, 3000);

// Manual trigger function
window.debugQuestions = debugQuestionState;

console.log('\n✅ Debug script loaded!');
console.log('💡 Type debugQuestions() anytime to check current state');
console.log('🛑 Type clearInterval(' + monitorInterval + ') to stop monitoring');

// Initial check
debugQuestionState();
