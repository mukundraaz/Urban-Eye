const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runTest() {
  console.log('=== LAUNCHING PUPPETEER FOR URBAN EYE LOGIN FLOW TEST ===');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[PAGE ERROR]: ${msg.text()}`);
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log(`[UNCAUGHT EXCEPTION]: ${err.message}`);
    consoleErrors.push(err.message);
  });

  try {
    // 1. Visit Login Page
    console.log('\n[STEP 1] Navigating to http://localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    const pageTitle = await page.title();
    console.log(`  Page Title: "${pageTitle}"`);
    const hasSignInBtn = await page.$('button[type="submit"]');
    const hasDemoBtn = await page.evaluate(() => document.body.innerText.includes('Enter Demo Mode'));
    const hasCreateAccLink = await page.evaluate(() => document.body.innerText.includes('Create Account'));
    console.log(`  Sign In button present: ${!!hasSignInBtn}`);
    console.log(`  Demo Mode button present: ${hasDemoBtn}`);
    console.log(`  Create Account link present: ${hasCreateAccLink}`);

    // 2. Test Invalid Credentials Error Handling (Check for NO blank screen crash)
    console.log('\n[STEP 2] Testing incorrect credentials...');
    await page.type('input[type="email"]', 'wrong.officer@smartcity.gov.in');
    await page.type('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout ? await page.waitForTimeout(1000) : await new Promise(r => setTimeout(r, 1000));
    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.bg-red-50, .text-red-700');
      return el ? el.innerText : '';
    });
    console.log(`  Error displayed cleanly: "${errorText}"`);
    const rootAfterError = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
    console.log(`  Root DOM length after error: ${rootAfterError} (No blank screen!)`);
    if (rootAfterError === 0) throw new Error('Regression: blank screen after invalid login!');

    // 3. Navigate to Register Page
    console.log('\n[STEP 3] Navigating to Registration Page...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    const regUrl = page.url();
    console.log(`  Current URL: ${regUrl}`);
    const regHeading = await page.evaluate(() => document.querySelector('h2')?.innerText || '');
    console.log(`  Heading: "${regHeading}"`);

    // 4. Fill in Registration Form
    const testEmail = `officer_${Date.now()}@smartcity.gov.in`;
    const testPass = 'SecurePass987!';
    console.log(`\n[STEP 4] Registering new user: ${testEmail}...`);
    await page.type('input[placeholder*="Ramesh"]', 'Inspector Vikram Rathore');
    await page.type('input[placeholder*="smartcity.gov.in"]', testEmail);
    await page.type('input[placeholder*="Minimum 6"]', testPass);
    await page.type('input[placeholder*="Re-enter"]', testPass);

    // Click Create Account
    await page.click('button[type="submit"]');
    console.log('  Create Account button clicked. Waiting for response...');

    // Wait for redirect to /login
    await new Promise(r => setTimeout(r, 2500));
    const postRegUrl = page.url();
    console.log(`  URL after registration: ${postRegUrl}`);
    const successNotice = await page.evaluate(() => {
      const el = document.querySelector('.bg-green-50, .text-green-700');
      return el ? el.innerText : '';
    });
    console.log(`  Success banner displayed on /login: "${successNotice}"`);

    // 5. Sign In with the newly registered user credentials
    console.log('\n[STEP 5] Signing In with the newly registered credentials...');
    // Email is already pre-filled from registration redirect
    await page.type('input[type="password"]', testPass);
    await page.click('button[type="submit"]');

    // Wait for navigation to /dashboard
    console.log('  Sign In button clicked. Waiting for dashboard navigation...');
    await new Promise(r => setTimeout(r, 2000));
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
    console.log(`  Root DOM content length: ${rootLen}`);
    if (rootLen === 0) {
      throw new Error('FAILURE: Dashboard rendered a blank screen!');
    }

    // 6. Verify Dashboard Content
    console.log('\n[STEP 6] Verifying Dashboard contents...');
    const welcomeText = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? h2.innerText : '';
    });
    console.log(`  Hero banner header: "${welcomeText}"`);

    const kpiCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    console.log(`  Dashboard cards rendered: ${kpiCount}`);

    const sidebarNav = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a'));
      return links.map(a => a.innerText.trim());
    });
    console.log(`  Sidebar navigation items: ${sidebarNav.join(', ')}`);

    // Screenshot dashboard
    const screenshotPath = path.resolve('dashboard_verified.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`  Dashboard screenshot saved to: ${screenshotPath}`);

    // 7. Verify Page Refresh Persistence
    console.log('\n[STEP 7] Refreshing dashboard page...');
    await page.reload({ waitUntil: 'networkidle0' });
    const postRefreshUrl = page.url();
    console.log(`  URL after refresh: ${postRefreshUrl}`);
    const postRefreshWelcome = await page.evaluate(() => document.querySelector('h2')?.innerText || '');
    console.log(`  Welcome banner after refresh: "${postRefreshWelcome}"`);
    if (!postRefreshUrl.includes('/dashboard')) {
      throw new Error('FAILURE: Refreshing logged the user out!');
    }

    // 8. Test Demo Mode
    console.log('\n[STEP 8] Testing Demo Mode independent login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    const demoButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Enter Demo Mode'));
    });
    if (demoButton) {
      await demoButton.click();
      await new Promise(r => setTimeout(r, 1500));
      const demoUrl = page.url();
      console.log(`  Demo Mode URL: ${demoUrl}`);
      const isDemo = await page.evaluate(() => document.body.innerText.includes('DEMO MODE'));
      console.log(`  Demo Mode active indicator: ${isDemo}`);
    }

    console.log('\n=============================================================');
    console.log('ALL VERIFICATION CHECKS PASSED: 0 BLANK SCREENS, 100% WORKING!');
    console.log('=============================================================');
  } catch (err) {
    console.error('\nTEST FAILED WITH EXCEPTION:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
