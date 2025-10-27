// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK initialization with IIFE pattern
 *
 * CRITICAL: This uses an IIFE to prevent tree-shaking in production builds
 * The IIFE ensures Firebase Admin initializes at module load time, not request time
 */

// Global flag to track initialization state
let isFirebaseInitialized = false;

/**
 * Core initialization function
 */
function initializeFirebaseAdmin(): void {
  if (admin.apps.length > 0 || isFirebaseInitialized) {
    return; // Already initialized
  }

  console.log('🔥 Initializing Firebase Admin SDK...');
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);

  // DIAGNOSTIC: Log ALL relevant environment variables
  console.log('🔍 DIAGNOSTIC - Checking environment variables:');
  console.log(`  - FIREBASE_CONFIG: ${process.env.FIREBASE_CONFIG ? 'EXISTS ✅' : 'MISSING ❌'}`);
  console.log(`  - ADMIN_CONFIG: ${process.env.ADMIN_CONFIG ? 'EXISTS ✅' : 'MISSING ❌'}`);
  console.log(`  - GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'EXISTS ✅' : 'MISSING ❌'}`);
  console.log(`  - GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT || 'MISSING ❌'}`);
  console.log(`  - GCP_PROJECT: ${process.env.GCP_PROJECT || 'MISSING ❌'}`);
  console.log(`  - K_SERVICE: ${process.env.K_SERVICE || 'MISSING (not in Cloud Run?)'}`);

  try {
    // CRITICAL FIX: In Cloud Run, GOOGLE_APPLICATION_CREDENTIALS is NOT set
    // But Cloud Run DOES provide automatic service account authentication
    // So we initialize WITHOUT explicit credentials - Cloud Run handles it automatically!

    // Method 1: Use FIREBASE_CONFIG if available (provides project ID)
    if (process.env.FIREBASE_CONFIG) {
      try {
        const config = JSON.parse(process.env.FIREBASE_CONFIG);
        console.log(`🔑 Method 1: Using FIREBASE_CONFIG for project: ${config.projectId}`);
        console.log(`🔑 Initializing WITHOUT explicit credentials (Cloud Run auto-auth)`);

        // Initialize without credential parameter - Cloud Run provides it automatically
        admin.initializeApp({
          projectId: config.projectId,
        });

        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin initialized via FIREBASE_CONFIG (no explicit creds)');
        console.log(`📊 Active apps: ${admin.apps.length}`);
        return;
      } catch (e: any) {
        console.log(`⚠️  Method 1 (FIREBASE_CONFIG without creds) failed: ${e.message}`);
      }
    }

    // Method 2: Try with NO parameters at all - let Cloud Run auto-detect everything
    console.log('🔑 Method 2: Trying with NO parameters (full auto-detection)');
    try {
      admin.initializeApp();
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin initialized with NO params (auto-detected)');
      console.log(`📊 Active apps: ${admin.apps.length}`);
      return;
    } catch (e: any) {
      console.log(`⚠️  Method 2 (no params) failed: ${e.message}`);
    }

    // Method 3: Last resort - hardcoded project ID only
    console.log('🔑 Method 3: Using hardcoded project ID only');
    admin.initializeApp({
      projectId: 'studio-8922232553-e9354',
    });

    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized via hardcoded project');
    console.log(`📊 Active apps: ${admin.apps.length}`);

  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    // Enhanced error logging
    console.error('❌ ALL initialization methods failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('');
    console.error('💡 DIAGNOSIS:');
    console.error('  This error means Application Default Credentials (ADC) are not available.');
    console.error('  Possible causes:');
    console.error('  1. Cloud Run service account lacks Firestore permissions');
    console.error('  2. GOOGLE_APPLICATION_CREDENTIALS env var is not set');
    console.error('  3. Cloud Run metadata server is not providing credentials');
    console.error('  4. Service account was deleted or changed');
    console.error('');
    console.error('  To fix:');
    console.error('  - Check service account permissions in Cloud Run console');
    console.error('  - Verify service account has "Cloud Datastore User" role');
    console.error('  - Or provide explicit service account JSON credentials');

    throw error;
  }
}

/**
 * IIFE (Immediately Invoked Function Expression)
 * This pattern prevents tree-shaking and ensures module-level initialization
 * The side effects (console.log, global state) force the bundler to keep this code
 */
const firebaseModuleInit = (() => {
  console.log('🚀 Firebase Admin module loaded - attempting initialization...');
  try {
    initializeFirebaseAdmin();
    console.log('✅ Module-level Firebase Admin init complete');
    return true;
  } catch (error: any) {
    // DO NOT throw - just log and allow retry on first use
    console.error('⚠️  Module-level init failed (will retry on first use)');
    console.error('⚠️  Error:', error.message);
    console.error('⚠️  Error code:', error.code);
    // Don't throw - let the helper functions retry
    isFirebaseInitialized = false;
    return false;
  }
})();

/**
 * Ensure Firebase is initialized (with safety net)
 * Call this from helper functions as a defense-in-depth measure
 */
function ensureInitialized(): void {
  if (!isFirebaseInitialized || admin.apps.length === 0) {
    initializeFirebaseAdmin();
  }
}

/**
 * Returns the initialized Firebase Admin instance
 * IMPORTANT: Always use this instead of importing 'firebase-admin' directly
 * @returns The initialized admin instance
 */
export function getFirebaseAdmin() {
  ensureInitialized();
  return admin;
}

/**
 * Returns the Firestore instance
 * Safe to call from any server context (API routes, server actions, middleware)
 * @returns Firestore database instance
 */
export function getDb() {
  ensureInitialized();
  return admin.firestore();
}

/**
 * Returns the Auth instance
 * Safe to call from any server context (API routes, server actions, middleware)
 * @returns Firebase Auth instance
 */
export function getAuth() {
  ensureInitialized();
  return admin.auth();
}

/**
 * Force initialization (useful for testing or explicit pre-initialization)
 * @returns Whether initialization was successful
 */
export function ensureFirebaseInitialized(): boolean {
  try {
    ensureInitialized();
    return admin.apps.length > 0;
  } catch {
    return false;
  }
}