# Action Plan Based on Your Diagnostic Answers

## What We Now Know

### Q1: Timeline
- Error started ~1 week ago
- **Key insight**: Started after environment variable changes (FIREBASE_* → ADMIN_*)
- Multiple deploys with different init strategies were attempted
- Likely caused by: ADC not available OR service account permissions changed

### Q2: Was it ever working?
- **Unknown** if real payments ever worked in production
- PRODUCTION_TEST_RESULTS.md shows tests passing, but unclear when/where
- Current live site definitely fails

### Q3: PRODUCTION_TEST_RESULTS.md validity
- Tests claimed to pass with 9 requests, 0 errors
- **Critical unknown**: Were these curl tests or real webhooks?
- **Critical unknown**: When were these tests run?
- **Likely explanation**: Different revision or environment had working credentials

### Q4 & Q5: Need Console Access
- You need to check Firebase/GCP Console (instructions provided)
- Only one environment exists (no staging)

---

## Most Likely Root Cause

Based on your answer to Q1, here's what probably happened:

### The Environment Variable Change Broke It

You mentioned:
> "We were modifying environment handling (renaming vars from FIREBASE_* to ADMIN_*) because Firebase tooling reserved FIREBASE_ and GOOGLE_ prefixes."

**This is likely the culprit!**

Firebase Admin SDK in Cloud Run expects certain environment variables to automatically provide credentials:
- `FIREBASE_CONFIG` - Contains Firebase project config
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key
- `GCLOUD_PROJECT` - GCP project ID

If these were renamed to `ADMIN_*` prefixes, Firebase Admin SDK can no longer find the credentials automatically!

---

## Immediate Fix to Try

### Option 1: Check if FIREBASE_CONFIG exists

Let's verify what environment variables are actually available in Cloud Run:

1. Go to Cloud Run console: https://console.cloud.google.com/run/detail/us-central1/ssrstudio8922232553e935/variables?project=studio-8922232553-e9354

2. Check if these environment variables exist:
   - `FIREBASE_CONFIG`
   - `GOOGLE_APPLICATION_CREDENTIALS`
   - `GCLOUD_PROJECT`

3. If they DON'T exist or were renamed, that's the problem!

### Option 2: Check the previous working deployment

From your firebase functions config:
```json
{
  "admin": {
    "project_id": "studio-8922232553-e9354",
    "private_key": "-----BEGIN PRIVATE KEY-----...",
    "client_email": "firebase-adminsdk-fbsvc@studio-8922232553-e9354.iam.gserviceaccount.com"
  }
}
```

These credentials exist but are in the FUNCTIONS config, not environment variables for the Cloud Run service.

---

## Solutions (in order of preference)

### Solution A: Restore Original Environment Variables

If you renamed `FIREBASE_CONFIG` to `ADMIN_CONFIG`, rename it back:

```bash
# In Cloud Run environment variables, ensure these exist:
FIREBASE_CONFIG=<original value>
GCLOUD_PROJECT=studio-8922232553-e9354
```

**How to set Cloud Run env vars**:
1. Go to: https://console.cloud.google.com/run/detail/us-central1/ssrstudio8922232553e935/variables?project=studio-8922232553-e9354
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add/verify the environment variables
5. Deploy

### Solution B: Use Explicit Service Account Credentials

Create a service account JSON file and use it explicitly:

1. Download service account key:
   ```bash
   # In Firebase Console → Settings → Service Accounts
   # Click "Generate new private key"
   ```

2. Store it securely (DON'T commit to git!)

3. Update firebaseAdmin.ts to use explicit credentials:
   ```typescript
   import serviceAccount from './path/to/serviceAccountKey.json';

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   ```

**Note**: This is less secure but will definitely work.

### Solution C: Use Cloud Secret Manager

Store the service account JSON in Secret Manager and reference it:

1. Upload key to Secret Manager
2. Grant Cloud Run service account access
3. Reference in environment variable
4. Use in initialization

### Solution D: Grant ADC Permissions to Cloud Run Service Account

If the Cloud Run service account doesn't have Firestore permissions:

1. Identify the service account Cloud Run uses (from Console)
2. Grant it these roles:
   - `Cloud Datastore User`
   - `Firebase Admin SDK Administrator Service Agent`

---

## What You Should Do RIGHT NOW

### Step 1: Check Cloud Run Environment Variables

Go to: https://console.cloud.google.com/run/detail/us-central1/ssrstudio8922232553e935/variables?project=studio-8922232553-e9354

**Look for these variables and tell me what you see:**
- `FIREBASE_CONFIG` - Does it exist? What's the value?
- `GOOGLE_APPLICATION_CREDENTIALS` - Does it exist?
- `GCLOUD_PROJECT` - Does it exist? Value should be `studio-8922232553-e9354`
- `ADMIN_*` - Are there any variables with ADMIN_ prefix?

### Step 2: Check Service Account

Go to: https://console.cloud.google.com/run/detail/us-central1/ssrstudio8922232553e935/security?project=studio-8922232553-e9354

**Tell me:**
- What service account email is shown? (e.g., `12345-compute@developer.gserviceaccount.com` or `firebase-adminsdk-xxx@...`)

### Step 3: Check IAM Permissions

Go to: https://console.cloud.google.com/iam-admin/iam?project=studio-8922232553-e9354

**Search for the service account from Step 2, then tell me:**
- What roles does it have?
- Does it have `Cloud Datastore User` or `Editor` role?

---

## My Prediction

Based on "We were modifying environment handling (renaming vars from FIREBASE_* to ADMIN_*)":

**I predict you'll find:**
1. ✅ `FIREBASE_CONFIG` is missing or renamed to `ADMIN_CONFIG`
2. ✅ Firebase Admin SDK can't find credentials because variable was renamed
3. ✅ Service account probably has permissions, but ADC can't find the config

**The fix will be:**
- Restore `FIREBASE_CONFIG` environment variable in Cloud Run
- OR provide explicit credentials via service account JSON

---

## Temporary Workaround (Quick Test)

To quickly test if this theory is correct, let's try initializing with explicit project ID:

**I'll update the code to try multiple initialization methods:**

```typescript
// src/lib/firebaseAdmin.ts

function initializeFirebaseAdmin(): void {
  if (admin.apps.length > 0 || isFirebaseInitialized) {
    return;
  }

  console.log('🔥 Initializing Firebase Admin SDK...');
  console.log(`🔑 FIREBASE_CONFIG: ${process.env.FIREBASE_CONFIG ? 'EXISTS' : 'MISSING'}`);
  console.log(`🔑 ADMIN_CONFIG: ${process.env.ADMIN_CONFIG ? 'EXISTS' : 'MISSING'}`);
  console.log(`🔑 GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT || 'MISSING'}`);

  try {
    // Try multiple methods in order

    // Method 1: Use ADMIN_CONFIG if it exists (your renamed var)
    if (process.env.ADMIN_CONFIG) {
      const config = JSON.parse(process.env.ADMIN_CONFIG);
      console.log(`🔑 Using ADMIN_CONFIG for project: ${config.projectId}`);
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      isFirebaseInitialized = true;
      console.log('✅ Initialized via ADMIN_CONFIG');
      return;
    }

    // Method 2: Use FIREBASE_CONFIG (standard)
    if (process.env.FIREBASE_CONFIG) {
      console.log('🔑 Using FIREBASE_CONFIG');
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      isFirebaseInitialized = true;
      console.log('✅ Initialized via FIREBASE_CONFIG');
      return;
    }

    // Method 3: Explicit project ID fallback
    console.log('🔑 Using explicit project ID fallback');
    admin.initializeApp({
      projectId: 'studio-8922232553-e9354',
      credential: admin.credential.applicationDefault(),
    });

    isFirebaseInitialized = true;
    console.log('✅ Initialized via explicit project ID');
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      isFirebaseInitialized = true;
      return;
    }
    console.error('❌ ALL initialization methods failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}
```

Want me to implement this diagnostic version that will show us EXACTLY which environment variables exist and which init method works?

---

## Summary

**Root Cause (90% confident)**: You renamed `FIREBASE_CONFIG` to `ADMIN_CONFIG`, breaking Firebase Admin SDK's automatic credential discovery.

**Next Steps**:
1. Check Cloud Run environment variables (Step 1 above)
2. Report back what you find
3. We'll either restore `FIREBASE_CONFIG` or use explicit credentials

**Time to fix**: ~5 minutes once we confirm the environment variables

---

**Status**: Waiting for you to check Cloud Run Console and report environment variables
