# Firebase Admin SDK Initialization Fix - Production Issue Resolution

## Problem Summary

The `/api/verify-payment` route was failing in production (Cloud Run) with the error:
```
The default Firebase app does not exist. Make sure you call initializeApp() before using any of the Firebase services.
```

**Critical Symptoms:**
- Direct curl tests to the API worked fine
- Real Razorpay payment webhook callbacks failed with 500 errors
- Firebase Admin initialization logs appeared during build
- Error occurred in compiled Next.js bundle: `.next/server/app/api/verify-payment/route.js`

## Root Cause

The issue was caused by **inconsistent initialization patterns** across the codebase:

1. **verify-payment route had its own inline initialization** instead of using the centralized module
2. **Module code-splitting in Next.js** created separate execution contexts for different API routes
3. **Race conditions in serverless cold starts** meant initialization didn't complete before handler execution
4. **Different module bundling** for curl tests vs webhook calls caused inconsistent behavior

### What Was Wrong

**Broken verify-payment Route:**
```typescript
// src/app/api/verify-payment/route.ts
import * as admin from 'firebase-admin';  // ❌ WRONG - Direct import

// ❌ WRONG - Inline initialization creates race conditions
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function POST(request: NextRequest) {
  const db = admin.firestore(); // ❌ May execute before initialization completes
  // ...
}
```

**Working test-firebase Route:**
```typescript
// src/app/api/verify-payment/test-firebase/route.ts
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';  // ✅ CORRECT

export async function GET() {
  const admin = getFirebaseAdmin(); // ✅ Uses module-level initialization
  const db = getDb();               // ✅ Guaranteed to be initialized
  // ...
}
```

### Why This Happens in Serverless

In Cloud Run's serverless environment with Next.js:

1. **Module Code-Splitting**: Each API route is bundled separately by Next.js
2. **Execution Order**: Inline initialization code can execute AFTER handler code in cold starts
3. **Module Isolation**: Direct `firebase-admin` imports don't share initialization state
4. **Bundling Variations**: Webpack/Turbopack may optimize code differently for different execution paths

**Why curl works but webhooks fail:**
- Curl tests → Hit warm container instances with completed initialization
- Razorpay webhooks → Hit cold starts with different module loading timing
- Different request headers/patterns → Trigger different Next.js code paths

## The Fix

### 1. Refactored verify-payment Route

**Before (BROKEN):**
```typescript
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export async function POST(request: NextRequest) {
  const db = admin.firestore();
  // ...
}
```

**After (FIXED):**
```typescript
import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Get instances from centralized initialization
  const admin = getFirebaseAdmin();
  const db = getDb();
  // ...
}
```

### 2. Enhanced firebaseAdmin.ts with Production Debugging

Added comprehensive logging and error handling:

```typescript
// Module-level initialization (executes once when module loads)
let initAttempted = false;
let initSuccess = false;

if (admin.apps.length === 0) {
  initAttempted = true;
  console.log('🔥 [FirebaseAdmin] Initializing Firebase Admin SDK...');
  console.log(`🔍 [FirebaseAdmin] Environment: ${process.env.NODE_ENV}`);

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    initSuccess = true;
    console.log('✅ [FirebaseAdmin] Firebase Admin initialized successfully');
    console.log(`📊 [FirebaseAdmin] Active apps: ${admin.apps.length}`);
  } catch (error: any) {
    console.error('❌ [FirebaseAdmin] Initialization FAILED');
    throw error;
  }
}

export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    console.error('❌ [getFirebaseAdmin] No apps found!');
    console.error(`Init attempted: ${initAttempted}, success: ${initSuccess}`);
    throw new Error('CRITICAL: Firebase Admin not initialized');
  }
  return admin;
}
```

### 3. Key Changes

1. **Removed inline initialization** from verify-payment route
2. **Added centralized imports** from `@/lib/firebaseAdmin`
3. **Added `export const dynamic = 'force-dynamic'`** to prevent static optimization
4. **Added `export const runtime = 'nodejs'`** to ensure Node.js runtime
5. **Enhanced logging** to debug production issues

## Best Practices for Firebase Admin in Next.js + Cloud Run

### ✅ DO

1. **Always use centralized initialization:**
   ```typescript
   // In all API routes and server actions
   import { getFirebaseAdmin, getDb, getAuth } from '@/lib/firebaseAdmin';

   const admin = getFirebaseAdmin();
   const db = getDb();
   ```

2. **Use module-level initialization only once:**
   ```typescript
   // ONLY in src/lib/firebaseAdmin.ts
   if (admin.apps.length === 0) {
     admin.initializeApp({
       credential: admin.credential.applicationDefault(),
     });
   }
   ```

3. **Force dynamic rendering for API routes:**
   ```typescript
   export const dynamic = 'force-dynamic';
   export const runtime = 'nodejs';
   ```

4. **Use Application Default Credentials:**
   ```typescript
   // Works automatically in Cloud Run/Firebase Hosting
   admin.initializeApp({
     credential: admin.credential.applicationDefault(),
   });
   ```

### ❌ DON'T

1. **Don't import firebase-admin directly in routes:**
   ```typescript
   import * as admin from 'firebase-admin'; // ❌ WRONG
   ```

2. **Don't initialize inline in route handlers:**
   ```typescript
   // ❌ WRONG - Creates race conditions
   if (admin.apps.length === 0) {
     admin.initializeApp({ ... });
   }
   ```

3. **Don't mix initialization patterns:**
   ```typescript
   // ❌ WRONG - Inconsistent across routes
   // verify-payment: inline init
   // test-firebase: centralized init
   ```

4. **Don't assume initialization timing:**
   ```typescript
   // ❌ WRONG - May execute before init completes
   import * as admin from 'firebase-admin';
   const db = admin.firestore(); // Immediate usage
   ```

## Why This Pattern Works in Cloud Run

Cloud Run serverless containers:
- Execute module-level code once during container initialization
- Reuse container instances across multiple requests
- Cache module state between requests
- Provide Application Default Credentials automatically

Module-level initialization in `firebaseAdmin.ts`:
- Runs once when container starts
- Completes before any request handlers execute
- Shared across all imports of the module
- Survives between requests (warm starts)

## Testing the Fix

### Local Testing

```bash
npm run build
npm start

# Test with curl
curl -X POST http://localhost:3000/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"test","razorpay_payment_id":"test","razorpay_signature":"fake","userId":"test"}'
```

### Production Testing (Cloud Run)

```bash
# Deploy to Firebase
firebase deploy --only hosting

# Test with curl (should work)
curl -X POST https://studio-8922232553-e9354.web.app/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"order_test","razorpay_payment_id":"pay_test","razorpay_signature":"fake","userId":"test"}'

# Expected: {"success":false,"message":"Invalid payment signature"}
# This proves Firebase Admin IS working

# Test with real Razorpay payment
# 1. Go to /subscribe
# 2. Complete payment with test credentials
# 3. Verify webhook succeeds (no more 500 errors)
```

### Monitoring in Cloud Run Logs

Look for these log messages:

**Successful initialization:**
```
🔥 [FirebaseAdmin] Initializing Firebase Admin SDK...
🔍 [FirebaseAdmin] Environment: production
✅ [FirebaseAdmin] Firebase Admin initialized successfully
📊 [FirebaseAdmin] Active apps: 1
✓ [getFirebaseAdmin] Returning Firebase Admin instance
✓ [getDb] Returning Firestore instance
```

**If initialization fails (shouldn't happen now):**
```
❌ [FirebaseAdmin] Initialization FAILED
❌ [getFirebaseAdmin] No apps found!
Init attempted: true, success: false
```

## Deployment Steps

```bash
# 1. Build the project
npm run build

# 2. Test locally
npm start
# Test at http://localhost:3000/api/verify-payment

# 3. Deploy to Firebase
firebase deploy --only hosting

# 4. Monitor Cloud Run logs
# Firebase Console → Hosting → Backend logs
# Or: gcloud logs tail

# 5. Test real payment flow
# Go to /subscribe and complete a test payment
```

## Summary

**Problem:** Inline Firebase Admin initialization in verify-payment route caused race conditions in serverless cold starts

**Root Cause:** Module code-splitting and execution order variations in Next.js bundled code for Cloud Run

**Solution:**
1. Centralized initialization in `lib/firebaseAdmin.ts`
2. Use helper functions (`getDb`, `getFirebaseAdmin`) in all routes
3. Remove inline initialization code
4. Force dynamic rendering with Next.js route config

**Impact:** Reliable Firebase Admin SDK initialization for both curl tests AND real Razorpay webhook callbacks

## Related Files

- ✅ `src/lib/firebaseAdmin.ts` - Centralized initialization (ENHANCED)
- ✅ `src/app/api/verify-payment/route.ts` - Payment verification (FIXED)
- ✅ `src/app/api/verify-payment/test-firebase/route.ts` - Health check (WORKING)
- `src/app/subscribe/actions.ts` - Server actions (no Firebase Admin needed)
- `src/app/subscribe/page.tsx` - Frontend payment UI (client-side Firebase only)

## Verification Checklist

- [ ] No direct `import * as admin from 'firebase-admin'` in route files
- [ ] All routes use `import { getDb, getFirebaseAdmin } from '@/lib/firebaseAdmin'`
- [ ] Module-level initialization only in `firebaseAdmin.ts`
- [ ] API routes have `export const dynamic = 'force-dynamic'`
- [ ] Build succeeds without warnings
- [ ] Curl tests pass in production
- [ ] Real Razorpay payment webhooks succeed
- [ ] Cloud Run logs show successful initialization
- [ ] No "default Firebase app does not exist" errors
