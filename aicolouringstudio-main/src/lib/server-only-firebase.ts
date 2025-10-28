/**
 * Server-Only Firebase Admin SDK Wrapper
 *
 * CRITICAL: This file uses the 'server-only' package to enforce that Firebase Admin
 * is NEVER included in client-side JavaScript bundles.
 *
 * If this module is accidentally imported in a client component, Next.js will throw
 * a build-time error, preventing Firebase Admin from leaking into browser code.
 *
 * This fixes the "Firebase app does not exist" error that occurs when Firebase Admin
 * SDK is bundled into client code through server actions.
 */

// This import will cause a build error if this file is imported in client code
import 'server-only';

// Re-export all Firebase Admin helpers from the centralized module
// These exports can ONLY be used in server components, server actions, and API routes
export {
  getFirebaseAdmin,
  getDb,
  getAuth,
  ensureFirebaseInitialized
} from './firebaseAdmin';
