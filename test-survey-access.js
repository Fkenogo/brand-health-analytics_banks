#!/usr/bin/env node

/**
 * Test script to verify survey access functionality
 * This script tests the survey access button in the admin dashboard
 */

const puppeteer = require('puppeteer');

async function testSurveyAccess() {
  console.log('🧪 Testing Survey Access Functionality...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the admin dashboard
    console.log('1. Navigating to admin dashboard...');
    await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle2' });
    
    // Check if we're on the admin login page
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    // Try to navigate to admin dashboard directly (assuming we're already authenticated)
    console.log('2. Testing admin dashboard access...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
    
    // Check if admin dashboard loaded
    const adminContent = await page.content();
    const hasAdminContent = adminContent.includes('Admin Console') || adminContent.includes('Brand Health Tracking');
    console.log(`   Admin dashboard loaded: ${hasAdminContent}`);
    
    // Look for survey access button
    console.log('3. Looking for survey access button...');
    const surveyButton = await page.$('button:contains("Survey Access")');
    const hasSurveyButton = !!surveyButton;
    console.log(`   Survey access button found: ${hasSurveyButton}`);
    
    if (hasSurveyButton) {
      console.log('4. Testing survey button click...');
      await page.click('button:contains("Survey Access")');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      const currentUrl = page.url();
      console.log(`   Current URL after click: ${currentUrl}`);
      
      const isSurveyUrl = currentUrl.includes('/survey/');
      console.log(`   Navigated to survey URL: ${isSurveyUrl}`);
      
      if (isSurveyUrl) {
        console.log('5. Testing survey page load...');
        const surveyContent = await page.content();
        const hasSurveyContent = surveyContent.includes('Welcome') || surveyContent.includes('Survey');
        console.log(`   Survey page loaded successfully: ${hasSurveyContent}`);
        
        if (hasSurveyContent) {
          console.log('✅ Survey access test PASSED');
          return true;
        } else {
          console.log('❌ Survey page content not found');
          return false;
        }
      } else {
        console.log('❌ Did not navigate to survey URL');
        return false;
      }
    } else {
      console.log('❌ Survey access button not found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testSurveyAccess().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});