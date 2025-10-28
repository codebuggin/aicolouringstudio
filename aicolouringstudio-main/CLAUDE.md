# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Coloring Studio** - A Next.js 15 application that generates AI-powered coloring pages from text prompts. Built with Firebase (Authentication + Firestore), Razorpay payment processing, and Google Gemini via Genkit.

**Tech Stack:**
- Next.js 15 (App Router, Server Actions)
- Firebase (Client SDK + Admin SDK)
- Razorpay (payment gateway)
- Genkit AI with Google Generative AI
- TypeScript, Tailwind CSS, Radix UI

## Development Commands

```bash
# Start development server (port 9000)
npm run dev

# Start Genkit AI dev server (separate terminal)
npm run genkit:dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Critical Architecture Patterns

### 1. Firebase Admin SDK Initialization (CRITICAL!)

**Always use the centralized helpers from `src/lib/firebaseAdmin.ts`:**

```typescript
// ✅ CORRECT - In server actions and API routes
import { getDb, getAuth, getFirebaseAdmin } from '@/lib/firebaseAdmin';

const db = getDb();
const admin = getFirebaseAdmin();
```

```typescript
// ❌ NEVER DO THIS
import * as admin from 'firebase-admin';
admin.initializeApp(); // Will cause "Firebase app already exists" errors
```

**API Route Requirements:**

Every API route using Firebase Admin MUST include these directives:

```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

Without these, Firebase Admin initialization fails in production Cloud Run.

### 2. Never Mix Client and Server Firebase SDKs

```typescript
// ❌ WRONG - In server actions or API routes
import { doc, getDoc } from 'firebase/firestore'; // Client SDK

// ✅ CORRECT
import { getDb } from '@/lib/firebaseAdmin'; // Admin SDK
```

**Why this matters:**
- Client SDK (`firebase/firestore`, `firebase/auth`) expects browser environment
- Server SDK (`firebase-admin`) requires Node.js runtime
- Mixing them causes bundling conflicts and initialization failures
- See `FIREBASE_ADMIN_FIX.md` for detailed explanation

### 3. Firebase Admin SDK API Differences

When using Admin SDK (server-side), the API differs from client SDK:

```typescript
// Client SDK (browser)
const userDocRef = doc(db, 'users', userId);
const userDoc = await getDoc(userDocRef);
if (!userDoc.exists()) { ... }
await updateDoc(docRef, { count: increment(1) });

// Admin SDK (server)
const userDocRef = db.collection('users').doc(userId);
const userDoc = await userDocRef.get();
if (!userDoc.exists) { ... } // Note: exists not exists()
await docRef.update({ count: admin.firestore.FieldValue.increment(1) });
```

### 4. Server Actions Pattern

Server actions are marked with `'use server'` and use `useActionState` hook:

```typescript
// In server action file
'use server';
export async function myAction(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. Validate with Zod
  // 2. Use Firebase Admin SDK (NOT client SDK)
  // 3. Return state object
}

// In client component
const [state, formAction] = useActionState(myAction, initialState);
return <form action={formAction}>...</form>;
```

**Key server actions:**
- `src/app/actions.ts` - `generateImageAction()` (main image generation)
- `src/app/auth/actions.ts` - `loginAction()`, `signupAction()`, `logoutAction()`
- `src/app/subscribe/actions.ts` - `createRazorpayOrder()`

## Payment Flow (Razorpay)

1. User clicks "Upgrade to Pro" → `/subscribe` page
2. Client calls `createRazorpayOrder()` server action
3. Opens Razorpay checkout modal with order details
4. User completes payment
5. Razorpay callback sends payment details to client
6. Client POSTs to `/api/verify-payment` with signature
7. Server verifies HMAC-SHA256 signature
8. Updates Firestore: `users/{uid}.isSubscribed = true`

**Critical files:**
- `src/app/subscribe/page.tsx` - Checkout UI
- `src/app/subscribe/actions.ts` - Order creation
- `src/app/api/verify-payment/route.ts` - Signature verification

**Environment variables required:**
```
RAZORPAY_KEY_ID=rzp_live_XXXXXX
RAZORPAY_KEY_SECRET=secret_XXXXXX
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXX
```

## AI Image Generation Flow

1. User submits prompt in `ColoringPageForm`
2. `generateImageAction()` server action executes
3. Checks free tier limit (5 generations for non-Pro users)
4. Calls Genkit flow: `generateColoringPageFromPromptFlow()`
5. Genkit posts to external n8n webhook: `https://abu.awsaibot.com/webhook/...`
6. Webhook returns generated image URL (30s timeout)
7. Server saves to Firestore: `users/{uid}/generatedImages` subcollection
8. Increments `generationCount` if user is not Pro
9. Returns image URL to client

**Key files:**
- `src/app/actions.ts` - Main generation action
- `src/ai/flows/generate-coloring-page-from-prompt.ts` - Genkit flow
- `src/ai/genkit.ts` - Genkit configuration

## Database Schema (Firestore)

```
users/{uid}
  ├── email: string
  ├── displayName: string
  ├── photoURL: string
  ├── isSubscribed: boolean
  ├── generationCount: number (free tier tracking)
  ├── razorpayOrderId: string
  ├── razorpayPaymentId: string
  ├── upgradedAt: Timestamp
  └── generatedImages/{docId} (subcollection)
      ├── imageUrl: string
      ├── prompt: string
      ├── createdAt: Timestamp
      └── userId: string
```

## Common Issues & Solutions

### Issue: "Firebase app does not exist" in production

**Cause:** Missing runtime directives in API routes or mixed client/server SDKs

**Solution:**
1. Add `export const dynamic = 'force-dynamic'` and `export const runtime = 'nodejs'`
2. Use `getDb()` helper instead of direct `firebase-admin` import
3. Remove any `firebase/firestore` or `firebase/auth` imports from server code
4. See `FIREBASE_ADMIN_FIX.md` for complete details

### Issue: Payment verification fails

**Check:**
1. Environment variables are set: `RAZORPAY_KEY_SECRET`
2. Signature verification logic uses correct hash: `order_id|payment_id`
3. API route has proper directives (see above)
4. Test with: `curl https://your-app.web.app/api/verify-payment/test-firebase`

### Issue: AI generation times out

**Notes:**
- External webhook has 30s timeout
- n8n service may be slow or down
- Check `src/ai/flows/generate-coloring-page-from-prompt.ts` for webhook URL
- Consider increasing timeout if needed

## File Organization

```
src/
├── app/              # Next.js App Router (pages, layouts, API routes)
├── components/       # React components (UI, forms, etc.)
├── firebase/         # Firebase Client SDK setup & hooks
├── lib/              # Utilities (firebaseAdmin.ts is critical)
├── ai/               # Genkit AI flows and configuration
└── hooks/            # Custom React hooks
```

## Important Conventions

1. **Client vs Server:**
   - Client components: Use `'use client'` + Firebase client SDK
   - Server actions/API routes: Use `'use server'` + Firebase Admin SDK
   - Never mix the two SDKs in the same file

2. **Path Aliases:**
   - `@/*` maps to `src/*` (configured in `tsconfig.json`)
   - Always use absolute imports: `import { ... } from '@/lib/firebaseAdmin'`

3. **TypeScript:**
   - Build errors are ignored in development (`ignoreBuildErrors: true`)
   - Strict mode enabled
   - Use Zod for runtime validation in server actions

4. **Styling:**
   - Tailwind CSS with custom config
   - Radix UI components in `src/components/ui/`
   - Use `cn()` utility from `@/lib/utils` for conditional classes

5. **Image Hosting:**
   - AI-generated images from external webhook (Google Storage)
   - User avatars from Google OAuth (lh3.googleusercontent.com)
   - Allowed domains configured in `next.config.ts`

## Testing in Production

```bash
# Health check - Firebase Admin initialization
curl https://studio-8922232553-e9354.web.app/api/verify-payment/test-firebase

# Test payment verification (should fail signature, but show Firebase works)
curl -X POST https://studio-8922232553-e9354.web.app/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"order_test","razorpay_payment_id":"pay_test","razorpay_signature":"fake","userId":"test"}'
```

## Deployment

Deployed on **Firebase Hosting + Cloud Run** (managed by Firebase Frameworks):

```bash
# Clean build
rm -rf .next
npm run build

# Deploy
firebase deploy --only hosting
```

Application uses Application Default Credentials in Cloud Run (no explicit service account JSON needed).

## Key Learnings from FIREBASE_ADMIN_FIX.md

1. Always use runtime directives in API routes: `export const dynamic = 'force-dynamic'; export const runtime = 'nodejs';`
2. Centralize Firebase Admin initialization in `src/lib/firebaseAdmin.ts`
3. Never import Firebase client SDK in server code
4. Serverless environments require defensive singleton patterns
5. Module initialization order isn't guaranteed in Cloud Run cold starts

Refer to `FIREBASE_ADMIN_FIX.md` for comprehensive troubleshooting guide.
