# Payment Page Debug Test Instructions

## Overview

This Playwright test suite comprehensively debugs the live payment page at:
`https://studio-8922232553-e9354.web.app/subscribe`

The test will help identify:
- **When** the "Firebase app does not exist" error occurs
- **Where** the error originates (browser console vs server logs)
- JavaScript errors preventing payment flow
- Network request failures
- Razorpay modal loading issues

## Running the Tests

### Option 1: Headless Mode (Recommended for CI/Debugging)
```bash
npm run test:payment-debug
```

This runs the tests in the background and generates:
- **Console output** with real-time browser logs
- **Screenshots** of each step
- **HTML report** with detailed results

### Option 2: Headed Mode (Watch the browser)
```bash
npm run test:payment-debug:headed
```

This opens a visible browser window so you can watch the test execute in real-time.

### Option 3: UI Mode (Interactive debugging)
```bash
npm run test:payment-debug:ui
```

This opens Playwright's interactive UI where you can:
- Step through each test action
- View screenshots in real-time
- Inspect console logs
- Replay actions

## What the Test Does

### Step 1: Initial Page Load
1. Navigate to `/subscribe` page
2. Wait for DOM to load
3. Wait for network to be idle
4. Capture initial screenshot
5. Check console for Firebase errors
6. Verify page elements loaded correctly

### Step 2: Payment Flow Interaction
1. Clear previous console logs
2. Find "Upgrade to Pro" button
3. Take screenshot before clicking
4. Click the button
5. Wait for response
6. Check if Razorpay modal appears
7. Monitor console for errors after click
8. Track all API network requests

### Step 3: Firebase Initialization Check
1. Execute JavaScript in browser context
2. Check if Firebase SDK is loaded
3. Verify Firebase apps are initialized
4. Inspect Firebase configuration

## Output Locations

### Screenshots
All screenshots are saved in: `playwright-report/`
- `01-initial-load.png` - Page on first load
- `02-before-click.png` - Before clicking Upgrade button
- `03-after-click.png` - After clicking button
- `04-razorpay-modal.png` - Razorpay modal (if appears)
- `02-no-button.png` - If button not found

### HTML Report
After running tests, view the detailed report:
```bash
npx playwright show-report
```

### Console Output
The terminal will show real-time:
- `[BROWSER LOG]` - Browser console.log messages
- `[BROWSER ERROR]` - Browser console.error messages
- `[NETWORK REQUEST]` - API calls made
- `[NETWORK RESPONSE]` - API responses received

## Key Questions Answered

### ✅ Does the page load without errors?
Check Step 1 output for:
- `✓ Page DOM loaded`
- `✓ Network idle`
- `✓ No Firebase errors found on page load`

### ✅ Is "Firebase app does not exist" in browser or server?
If you see this error in `[BROWSER ERROR]` tags, it's a **client-side issue**.
If you don't see it in browser console, it's a **server-side issue**.

### ✅ When does the error appear?
- **On page load**: Error shows up in Step 1
- **On button click**: Error shows up in Step 2
- **During payment callback**: Error shows up during network monitoring

### ✅ Are there JavaScript errors preventing payment?
Check for `⚠️ JAVASCRIPT ERRORS FOUND` sections in output.

### ✅ Does Razorpay modal appear?
Look for:
- `Razorpay modal visible: true`
- Screenshot `04-razorpay-modal.png`

## Troubleshooting

### If tests fail to run:
```bash
# Reinstall Playwright browsers
npx playwright install chromium

# Check Playwright installation
npx playwright --version
```

### If you need more verbose output:
```bash
# Run with debug mode
DEBUG=pw:api npm run test:payment-debug
```

### If you want to test a different URL:
Edit `playwright.config.ts` and change the `baseURL`.

## Expected Output Format

```
========================================
STEP 1: Loading Payment Page
========================================

✓ Page DOM loaded
✓ Network idle
✓ Screenshot saved: 01-initial-load.png

--- Initial Console Log Summary ---
Total console messages: 15
Errors: 0
Warnings: 2
Firebase-related errors: 0
✓ No Firebase errors found on page load

Page title: "Subscribe - AI Coloring Studio"
Upgrade button visible: true

========================================
STEP 2: Testing Payment Flow
========================================

Looking for Upgrade button...
Upgrade button found: true
✓ Screenshot saved: 02-before-click.png
Clicking Upgrade button...
✓ Screenshot saved: 03-after-click.png

Razorpay modal visible: true
✓ Razorpay payment modal appeared!
✓ Screenshot saved: 04-razorpay-modal.png

--- Console Log Summary (After Click) ---
New console messages: 8
Errors: 0
Firebase-related errors: 0

--- Network Activity ---
Total API calls: 2

API Calls made:
  1. POST /api/create-order - Status: 200
  2. GET /api/verify-payment - Status: pending

========================================
TEST SUMMARY
========================================
Total console messages captured: 23
Total JavaScript errors: 0
Total API calls: 2
Firebase-related errors: 0

Test complete! Check playwright-report/ for screenshots.
========================================
```

## Next Steps After Running Tests

1. **Review console output** - Look for Firebase errors
2. **Check screenshots** - See visual state at each step
3. **Open HTML report** - `npx playwright show-report`
4. **Share results** - Send console output and screenshots for analysis

## Need More Help?

If the test reveals issues, you can:
1. Modify `tests/payment-debug.spec.ts` to add more checks
2. Add breakpoints in the test with `await page.pause()`
3. Run in UI mode to interactively debug
4. Enable trace recording in `playwright.config.ts`
