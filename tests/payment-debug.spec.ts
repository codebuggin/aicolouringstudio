import { test, expect, Page } from '@playwright/test';

/**
 * Payment Page Debug Test
 *
 * This test performs comprehensive debugging of the live payment page to identify
 * the "Firebase app does not exist" error and other issues.
 */

// Storage for console logs
const consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];
const jsErrors: Array<{ message: string; stack?: string; timestamp: number }> = [];
const networkRequests: Array<{ url: string; method: string; status?: number; timestamp: number }> = [];

test.describe('Payment Page Debugging', () => {

  test.beforeEach(async ({ page }) => {
    // Clear previous logs
    consoleLogs.length = 0;
    jsErrors.length = 0;
    networkRequests.length = 0;

    // Set up console message listener
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });

      // Log to terminal in real-time
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Set up error listener
    page.on('pageerror', (error) => {
      jsErrors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });

      console.error('[BROWSER ERROR]', error.message);
      if (error.stack) {
        console.error('[STACK TRACE]', error.stack);
      }
    });

    // Set up network request listener
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });

      // Only log API calls
      if (request.url().includes('/api/')) {
        console.log(`[NETWORK REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    // Set up response listener
    page.on('response', (response) => {
      const req = networkRequests.find(r => r.url === response.url() && !r.status);
      if (req) {
        req.status = response.status();
      }

      // Log API responses
      if (response.url().includes('/api/')) {
        console.log(`[NETWORK RESPONSE] ${response.status()} ${response.url()}`);
      }
    });
  });

  test('Step 1: Load payment page and check initial state', async ({ page }) => {
    console.log('\n========================================');
    console.log('STEP 1: Loading Payment Page');
    console.log('========================================\n');

    // Navigate to the subscribe page
    await page.goto('/subscribe');

    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    console.log('✓ Page DOM loaded');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    console.log('✓ Network idle');

    // Take initial screenshot
    await page.screenshot({ path: 'playwright-report/01-initial-load.png', fullPage: true });
    console.log('✓ Screenshot saved: 01-initial-load.png');

    // Check if Firebase errors occurred during page load
    const firebaseErrors = consoleLogs.filter(log =>
      log.text.toLowerCase().includes('firebase') &&
      (log.type === 'error' || log.text.toLowerCase().includes('does not exist'))
    );

    console.log('\n--- Initial Console Log Summary ---');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Errors: ${consoleLogs.filter(l => l.type === 'error').length}`);
    console.log(`Warnings: ${consoleLogs.filter(l => l.type === 'warning').length}`);
    console.log(`Firebase-related errors: ${firebaseErrors.length}`);

    if (firebaseErrors.length > 0) {
      console.log('\n⚠️  FIREBASE ERRORS FOUND ON PAGE LOAD:');
      firebaseErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.type}] ${err.text}`);
      });
    } else {
      console.log('✓ No Firebase errors found on page load');
    }

    // Check for any JavaScript errors
    if (jsErrors.length > 0) {
      console.log('\n⚠️  JAVASCRIPT ERRORS FOUND:');
      jsErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
      });
    } else {
      console.log('✓ No JavaScript errors on page load');
    }

    // Check if page title is correct
    const title = await page.title();
    console.log(`\nPage title: "${title}"`);

    // Check if main elements are present
    const upgradeButton = page.locator('button:has-text("Upgrade to Pro")');
    const upgradeButtonVisible = await upgradeButton.isVisible().catch(() => false);
    console.log(`Upgrade button visible: ${upgradeButtonVisible}`);

    if (!upgradeButtonVisible) {
      // Try to find any button
      const buttons = await page.locator('button').all();
      console.log(`\nFound ${buttons.length} buttons on page:`);
      for (const btn of buttons.slice(0, 5)) { // Show first 5 buttons
        const text = await btn.textContent();
        console.log(`  - "${text}"`);
      }
    }
  });

  test('Step 2: Click Upgrade button and monitor payment flow', async ({ page }) => {
    console.log('\n========================================');
    console.log('STEP 2: Testing Payment Flow');
    console.log('========================================\n');

    // Navigate to the subscribe page
    await page.goto('/subscribe');
    await page.waitForLoadState('networkidle');

    // Clear previous logs from page load
    consoleLogs.length = 0;
    jsErrors.length = 0;

    console.log('Looking for Upgrade button...');

    // Find and click the upgrade button
    const upgradeButton = page.locator('button:has-text("Upgrade to Pro"), button:has-text("Subscribe"), button:has-text("Buy")').first();

    const buttonExists = await upgradeButton.count() > 0;
    console.log(`Upgrade button found: ${buttonExists}`);

    if (!buttonExists) {
      console.log('⚠️  Could not find upgrade button. Taking screenshot...');
      await page.screenshot({ path: 'playwright-report/02-no-button.png', fullPage: true });
      return;
    }

    // Take screenshot before clicking
    await page.screenshot({ path: 'playwright-report/02-before-click.png', fullPage: true });
    console.log('✓ Screenshot saved: 02-before-click.png');

    console.log('Clicking Upgrade button...');
    await upgradeButton.click();

    // Wait a moment for the action to process
    await page.waitForTimeout(2000);

    // Take screenshot after clicking
    await page.screenshot({ path: 'playwright-report/03-after-click.png', fullPage: true });
    console.log('✓ Screenshot saved: 03-after-click.png');

    // Check for Razorpay modal or any modal
    const razorpayModal = page.locator('iframe[name="razorpay"]').first();
    const razorpayVisible = await razorpayModal.isVisible().catch(() => false);

    console.log(`\nRazorpay modal visible: ${razorpayVisible}`);

    if (razorpayVisible) {
      console.log('✓ Razorpay payment modal appeared!');
      await page.screenshot({ path: 'playwright-report/04-razorpay-modal.png', fullPage: true });
      console.log('✓ Screenshot saved: 04-razorpay-modal.png');
    } else {
      console.log('⚠️  Razorpay modal did not appear');

      // Check if any other modal appeared
      const modals = await page.locator('[role="dialog"], .modal, [class*="modal"]').all();
      if (modals.length > 0) {
        console.log(`Found ${modals.length} other modals/dialogs`);
      }
    }

    // Check console for errors after button click
    const firebaseErrors = consoleLogs.filter(log =>
      log.text.toLowerCase().includes('firebase') &&
      (log.type === 'error' || log.text.toLowerCase().includes('does not exist'))
    );

    console.log('\n--- Console Log Summary (After Click) ---');
    console.log(`New console messages: ${consoleLogs.length}`);
    console.log(`Errors: ${consoleLogs.filter(l => l.type === 'error').length}`);
    console.log(`Firebase-related errors: ${firebaseErrors.length}`);

    if (firebaseErrors.length > 0) {
      console.log('\n⚠️  FIREBASE ERRORS FOUND AFTER BUTTON CLICK:');
      firebaseErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.type}] ${err.text}`);
      });
    }

    if (jsErrors.length > 0) {
      console.log('\n⚠️  JAVASCRIPT ERRORS FOUND AFTER BUTTON CLICK:');
      jsErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.message}`);
        if (err.stack) {
          console.log(`     Stack: ${err.stack.split('\n')[0]}`);
        }
      });
    }

    // Check network requests
    const apiCalls = networkRequests.filter(r => r.url.includes('/api/'));
    console.log(`\n--- Network Activity ---`);
    console.log(`Total API calls: ${apiCalls.length}`);

    if (apiCalls.length > 0) {
      console.log('\nAPI Calls made:');
      apiCalls.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url} - Status: ${req.status || 'pending'}`);
      });
    }
  });

  test('Step 3: Check Firebase initialization', async ({ page }) => {
    console.log('\n========================================');
    console.log('STEP 3: Firebase Initialization Check');
    console.log('========================================\n');

    // Navigate to the subscribe page
    await page.goto('/subscribe');
    await page.waitForLoadState('networkidle');

    // Execute JavaScript to check Firebase state
    const firebaseCheck = await page.evaluate(() => {
      const results: any = {
        firebaseLoaded: typeof (window as any).firebase !== 'undefined',
        firebaseApps: [],
        errors: []
      };

      try {
        // Check if Firebase SDK is loaded
        if ((window as any).firebase) {
          results.firebaseApps = (window as any).firebase.apps?.map((app: any) => ({
            name: app.name,
            options: app.options
          })) || [];
        }
      } catch (error: any) {
        results.errors.push(error.message);
      }

      return results;
    });

    console.log('Firebase Client SDK loaded:', firebaseCheck.firebaseLoaded);
    console.log('Firebase apps initialized:', firebaseCheck.firebaseApps.length);

    if (firebaseCheck.firebaseApps.length > 0) {
      console.log('\nFirebase Apps:');
      firebaseCheck.firebaseApps.forEach((app: any, i: number) => {
        console.log(`  ${i + 1}. Name: ${app.name}`);
        console.log(`     Project ID: ${app.options?.projectId || 'unknown'}`);
      });
    }

    if (firebaseCheck.errors.length > 0) {
      console.log('\n⚠️  Errors during Firebase check:');
      firebaseCheck.errors.forEach((err: string, i: number) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
  });

  test.afterEach(async ({ page }) => {
    // Final summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Total console messages captured: ${consoleLogs.length}`);
    console.log(`Total JavaScript errors: ${jsErrors.length}`);
    console.log(`Total API calls: ${networkRequests.filter(r => r.url.includes('/api/')).length}`);

    const firebaseErrors = consoleLogs.filter(log =>
      log.text.toLowerCase().includes('firebase') &&
      (log.type === 'error' || log.text.toLowerCase().includes('does not exist'))
    );

    console.log(`Firebase-related errors: ${firebaseErrors.length}`);
    console.log('\nTest complete! Check playwright-report/ for screenshots.');
    console.log('========================================\n');
  });
});
