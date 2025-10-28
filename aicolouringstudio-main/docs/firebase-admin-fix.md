# Firebase Admin SDK Initialization Fix

## Problem Summary

The `/api/verify-payment/test-firebase` route was failing with the error:
```
The default Firebase app does not exist. Make sure you call initializeApp() before using any of the Firebase services.
```

Meanwhile, the `/api/verify-payment` route worked perfectly, despite both using the same `firebaseAdmin.ts` helper module.

## Root Cause

The issue was caused by **importing `firebase-admin` directly** instead of using the initialized instance from the helper module.

### What Was Wrong

**Failing Route** (test-firebase/route.ts):
```typescript
import { getDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';  // ❌ WRONG - Fresh uninitialized instance

export async function GET() {
  const db = getDb();
  await testRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(), // ❌ Uses wrong admin
  });
}
```

**Working Route** (verify-payment/route.ts):
```typescript
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function POST() {
  const admin = getFirebaseAdmin(); // ✅ CORRECT - Uses initialized instance
  const db = getDb();
  await userRef.update({
    upgradedAt: admin.firestore.FieldValue.serverTimestamp(), // ✅ Works
  });
}
```

### Why This Happens

In Node.js, each `import` of a module gets the same instance (modules are cached). However, when you import `firebase-admin` directly, you get a reference to the module object itself. The initialization code in `firebaseAdmin.ts` runs on the `admin` instance within that module, but that doesn't affect other imports of `firebase-admin` elsewhere.

Think of it like this:
- `firebaseAdmin.ts` imports admin and calls `admin.initializeApp()`
- That initialization only affects the `admin` reference inside `firebaseAdmin.ts`
- When you import `firebase-admin` directly in another file, you get the same module, but you're bypassing the initialization wrapper

## The Fix

### 1. Updated test-firebase Route

**Before:**
```typescript
import { getDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
```

**After:**
```typescript
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
  const admin = getFirebaseAdmin(); // Get the initialized instance
  const db = getDb();
  // Now admin.firestore.FieldValue works correctly
}
```

### 2. Enhanced firebaseAdmin.ts

Added safety checks and better documentation:

```typescript
/**
 * Returns the initialized Firebase Admin instance
 * IMPORTANT: Always use this instead of importing 'firebase-admin' directly
 */
export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized. This should not happen.');
  }
  return admin;
}
```

## Best Practices for Firebase Admin in Next.js

### ✅ DO

1. **Always use helper functions:**
   ```typescript
   import { getFirebaseAdmin, getDb, getAuth } from '@/lib/firebaseAdmin';
   const admin = getFirebaseAdmin();
   const db = getDb();
   ```

2. **Initialize at module level:**
   ```typescript
   // In firebaseAdmin.ts
   if (admin.apps.length === 0) {
     admin.initializeApp({ ... });
   }
   ```

3. **Use Application Default Credentials in Cloud Run:**
   ```typescript
   admin.initializeApp({
     credential: admin.credential.applicationDefault(),
   });
   ```

### ❌ DON'T

1. **Don't import firebase-admin directly in route handlers:**
   ```typescript
   import * as admin from 'firebase-admin'; // ❌ WRONG
   ```

2. **Don't initialize in each route:**
   ```typescript
   // ❌ WRONG - Causes "app already exists" errors
   export async function POST() {
     admin.initializeApp({ ... });
   }
   ```

3. **Don't skip the helper functions:**
   ```typescript
   import { getDb } from '@/lib/firebaseAdmin';
   import * as admin from 'firebase-admin';

   // ❌ WRONG - Mixing imports
   const db = getDb();
   admin.firestore.FieldValue.serverTimestamp();
   ```

## Why This Works in Cloud Run

Cloud Run is a serverless environment where:
- Container instances are reused across requests
- Module-level code runs once when the container starts
- The `firebaseAdmin.ts` module initialization runs once per container
- Application Default Credentials automatically work in Firebase Hosting + Cloud Run

This makes module-level initialization the perfect pattern for Firebase Admin in serverless environments.

## Testing the Fix

### Test the working routes:

```bash
# Test Firebase initialization
curl https://studio-8922232553-e9354.web.app/api/verify-payment/test-firebase

# Expected response:
{
  "success": true,
  "message": "Firebase Admin initialized successfully! 🎉",
  "details": {
    "appsCount": 1,
    "appName": "[DEFAULT]",
    "firestoreWorking": true,
    "testDocExists": true
  }
}

# Test payment verification (with mock data)
curl -X POST https://studio-8922232553-e9354.web.app/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"order_test","razorpay_payment_id":"pay_test","razorpay_signature":"fake","userId":"test"}'

# Expected response:
{
  "success": false,
  "message": "Invalid payment signature"
}
# (This is expected - we're using fake credentials)
```

## Summary

**Problem:** Direct imports of `firebase-admin` bypass the initialization in `firebaseAdmin.ts`

**Solution:** Always use `getFirebaseAdmin()` to get the initialized instance

**Impact:** Consistent, reliable Firebase Admin SDK usage across all API routes in Cloud Run

## Related Files

- `src/lib/firebaseAdmin.ts` - Central initialization module
- `src/app/api/verify-payment/route.ts` - Payment verification (uses Admin SDK)
- `src/app/api/verify-payment/test-firebase/route.ts` - Health check endpoint
- `src/app/actions.ts` - Server actions (uses Admin SDK)
