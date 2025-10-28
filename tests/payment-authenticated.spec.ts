import { test, expect, Page } from '@playwright/test';

/**
 * Authenticated Payment Flow Test
 *
 * This test simulates a logged-in user attempting to upgrade to Pro.
 * It will help identify if the Firebase error occurs during authentication or payment.
 */

// Console log storage
const consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];

test.describe('Authenticated Payment Flow', () => {

  test.beforeEach(async ({ page }) => {
    consoleLogs.length = 0;

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push({
        type: msg.type(),
        text,
        timestamp: Date.now()
      });

      // Log Firebase-related messages
      if (text.toLowerCase().includes('firebase')) {
        console.log(`[FIREBASE ${msg.type().toUpperCase()}] ${text}`);
      }

      // Log errors and warnings
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.error('[PAGE ERROR]', error.message);
      if (error.message.toLowerCase().includes('firebase')) {
        console.error('⚠️  FIREBASE ERROR DETECTED:', error.message);
      }
    });
  });

  test('Check if user needs to be logged in', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST: Checking Authentication State');
    console.log('========================================\n');

    // Navigate to subscribe page
    await page.goto('/subscribe');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/subscribe-page-initial.png', fullPage: true });
    console.log('✓ Screenshot saved: subscribe-page-initial.png');

    // Check current URL (might redirect to login)
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('⚠️  Page redirected to login - authentication required');

      // Take screenshot of login page
      await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });

      console.log('\n💡 To test payment flow, you need to:');
      console.log('   1. Log in to the app first');
      console.log('   2. Save authentication cookies');
      console.log('   3. Reuse cookies in this test');

      return;
    }

    // Check what's on the page
    const pageContent = await page.content();
    const hasUpgradeButton = await page.locator('button:has-text("Upgrade"), button:has-text("Subscribe"), button:has-text("Pro")').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign in")').count() > 0;
    const hasLogoutButton = await page.locator('button:has-text("Logout"), button:has-text("Sign out")').count() > 0;

    console.log(`\n--- Page State ---`);
    console.log(`Has Upgrade/Subscribe button: ${hasUpgradeButton}`);
    console.log(`Has Login button: ${hasLoginButton}`);
    console.log(`Has Logout button: ${hasLogoutButton}`);

    // Try to find any buttons
    const allButtons = await page.locator('button').all();
    console.log(`\nTotal buttons found: ${allButtons.length}`);

    if (allButtons.length > 0) {
      console.log('\nButton texts:');
      for (const btn of allButtons.slice(0, 10)) {
        const text = await btn.textContent();
        const isVisible = await btn.isVisible();
        console.log(`  - "${text}" (visible: ${isVisible})`);
      }
    }

    // Check for any text about subscription or payment
    const bodyText = await page.locator('body').textContent() || '';
    const hasProMention = bodyText.toLowerCase().includes('pro');
    const hasPaymentMention = bodyText.toLowerCase().includes('payment') || bodyText.toLowerCase().includes('razorpay');
    const hasSubscriptionMention = bodyText.toLowerCase().includes('subscription') || bodyText.toLowerCase().includes('subscribe');

    console.log(`\n--- Page Content Analysis ---`);
    console.log(`Mentions "Pro": ${hasProMention}`);
    console.log(`Mentions "Payment": ${hasPaymentMention}`);
    console.log(`Mentions "Subscription": ${hasSubscriptionMention}`);

    // Check for Firebase errors
    const firebaseErrors = consoleLogs.filter(log =>
      log.text.toLowerCase().includes('firebase') && log.type === 'error'
    );

    if (firebaseErrors.length > 0) {
      console.log('\n⚠️  Firebase Errors Found:');
      firebaseErrors.forEach(err => console.log(`  - ${err.text}`));
    } else {
      console.log('\n✓ No Firebase errors detected');
    }
  });

  test('Inspect page HTML structure', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST: Inspecting HTML Structure');
    console.log('========================================\n');

    await page.goto('/subscribe');
    await page.waitForLoadState('networkidle');

    // Get the main content
    const html = await page.evaluate(() => {
      // Remove script tags for cleaner output
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script').forEach(s => s.remove());
      return clone.innerHTML;
    });

    // Save HTML to file for inspection
    const fs = require('fs');
    fs.writeFileSync('test-results/subscribe-page.html', html);
    console.log('✓ Page HTML saved to: test-results/subscribe-page.html');

    // Look for specific elements
    const hasRazorpayScript = await page.evaluate(() => {
      return !!document.querySelector('script[src*="razorpay"]');
    });

    const hasFirebaseScript = await page.evaluate(() => {
      return !!document.querySelector('script[src*="firebase"]');
    });

    console.log(`\n--- Script Analysis ---`);
    console.log(`Razorpay script loaded: ${hasRazorpayScript}`);
    console.log(`Firebase script loaded: ${hasFirebaseScript}`);

    // Check React root
    const reactRoot = await page.locator('#__next, [data-reactroot]').count();
    console.log(`React root found: ${reactRoot > 0}`);

    // Check for error boundaries or error messages
    const errorMessages = await page.locator('[role="alert"], .error, [class*="error"]').all();
    if (errorMessages.length > 0) {
      console.log(`\n⚠️  Found ${errorMessages.length} error elements:`);
      for (const err of errorMessages.slice(0, 5)) {
        const text = await err.textContent();
        console.log(`  - ${text}`);
      }
    }
  });

  test('Test with mock authentication', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('TEST: Mock Authentication Flow');
    console.log('========================================\n');

    // Try to inject mock auth state
    await page.goto('/');

    // Wait for Firebase to initialize
    await page.waitForTimeout(2000);

    // Check if we can access Firebase auth
    const authState = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          // Try to access Firebase
          const firebase = (window as any).firebase;
          if (!firebase) {
            resolve({ error: 'Firebase not found on window' });
            return;
          }

          // Check auth state
          const auth = firebase.auth?.();
          if (!auth) {
            resolve({ error: 'Firebase Auth not initialized' });
            return;
          }

          auth.onAuthStateChanged((user: any) => {
            resolve({
              isSignedIn: !!user,
              userId: user?.uid,
              email: user?.email
            });
          });

          // Timeout after 5s
          setTimeout(() => {
            resolve({ error: 'Auth state check timeout' });
          }, 5000);
        } catch (error: any) {
          resolve({ error: error.message });
        }
      });
    });

    console.log('Auth State:', JSON.stringify(authState, null, 2));

    // If not signed in, check what login options are available
    if (!(authState as any).isSignedIn) {
      console.log('\n⚠️  User is NOT signed in');
      console.log('💡 The payment flow requires authentication first');

      // Navigate to login page if it exists
      await page.goto('/login').catch(() => {
        console.log('No /login page found');
      });

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/login-or-auth-page.png', fullPage: true });

      // Check for Google Sign In button
      const googleSignIn = await page.locator('button:has-text("Google"), button:has-text("Sign in")').count();
      console.log(`Google Sign In button found: ${googleSignIn > 0}`);
    } else {
      console.log('\n✓ User IS signed in');
      console.log(`   User ID: ${(authState as any).userId}`);
      console.log(`   Email: ${(authState as any).email}`);

      // Now try to access subscribe page
      await page.goto('/subscribe');
      await page.waitForLoadState('networkidle');

      const upgradeButton = await page.locator('button:has-text("Upgrade"), button:has-text("Pro")').first();
      const buttonExists = await upgradeButton.count() > 0;

      console.log(`\nUpgrade button found: ${buttonExists}`);

      if (buttonExists) {
        console.log('✓ Ready to test payment flow!');
      }
    }
  });
});
