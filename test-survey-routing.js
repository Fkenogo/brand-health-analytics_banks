#!/usr/bin/env node

/**
 * Simple test to verify survey routing functionality
 * This test checks if the survey access button routing is correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function testSurveyRouting() {
  console.log('🧪 Testing Survey Routing...\n');

  try {
    // Read the SubscriberDashboardPage component
    const dashboardPath = path.join(__dirname, 'src', 'pages', 'SubscriberDashboardPage.tsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

    // Check if the survey access button exists
    const hasSurveyButton = dashboardContent.includes('Survey Access');
    console.log(`1. Survey access button exists: ${hasSurveyButton}`);

    if (!hasSurveyButton) {
      console.log('❌ Survey access button not found in dashboard');
      return false;
    }

    // Check the navigation logic
    const hasNavigateImport = dashboardContent.includes('useNavigate');
    console.log(`2. useNavigate hook imported: ${hasNavigateImport}`);

    // Check if the button has correct navigation
    const hasSurveyNavigation = dashboardContent.includes('navigate(`/survey/${activeCountry}`)');
    console.log(`3. Survey navigation uses dynamic country: ${hasSurveyNavigation}`);

    // Check if the button is properly structured
    const hasButtonStructure = dashboardContent.includes('<button') && 
                              dashboardContent.includes('onClick={() => navigate(`/survey/${activeCountry}`)');
    console.log(`4. Button structure correct: ${hasButtonStructure}`);

    // Read the App.tsx to verify routing
    const appPath = path.join(__dirname, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    // Check if survey route exists
    const hasSurveyRoute = appContent.includes('/survey/:country') && 
                          appContent.includes('SurveyPage');
    console.log(`5. Survey route defined in App.tsx: ${hasSurveyRoute}`);

    // Check if SurveyPage is imported
    const hasSurveyPageImport = appContent.includes('import SurveyPage from');
    console.log(`6. SurveyPage imported: ${hasSurveyPageImport}`);

    const allChecksPass = hasSurveyButton && hasNavigateImport && hasSurveyNavigation && 
                         hasButtonStructure && hasSurveyRoute && hasSurveyPageImport;

    if (allChecksPass) {
      console.log('\n✅ All routing checks PASSED');
      console.log('The survey access button should work correctly');
      return true;
    } else {
      console.log('\n❌ Some routing checks FAILED');
      console.log('Issues found:');
      if (!hasSurveyButton) console.log('  - Survey access button missing');
      if (!hasNavigateImport) console.log('  - useNavigate hook not imported');
      if (!hasSurveyNavigation) console.log('  - Survey navigation not configured');
      if (!hasButtonStructure) console.log('  - Button structure incorrect');
      if (!hasSurveyRoute) console.log('  - Survey route not defined');
      if (!hasSurveyPageImport) console.log('  - SurveyPage not imported');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
const success = testSurveyRouting();
process.exit(success ? 0 : 1);