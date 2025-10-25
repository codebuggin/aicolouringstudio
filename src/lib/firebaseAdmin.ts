// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK at module level
 * This ensures initialization happens once when the module is first imported
 * Works with Application Default Credentials in Cloud Run/Firebase Hosting
 *
 * CRITICAL: This module-level initialization is executed when the module is first loaded,
 * ensuring Firebase Admin is ready before any API route handlers execute.
 */

// Module-level initialization flag for debugging
let initAttempted = false;
let initSuccess = false;

if (admin.apps.length === 0) {
  initAttempted = true;
  console.log('🔥 [FirebaseAdmin] Initializing Firebase Admin SDK...');
  console.log(`🔍 [FirebaseAdmin] Environment: ${process.env.NODE_ENV}`);
  console.log(`🔍 [FirebaseAdmin] Current apps before init: ${admin.apps.length}`);

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    initSuccess = true;
    console.log('✅ [FirebaseAdmin] Firebase Admin initialized successfully');
    console.log(`📊 [FirebaseAdmin] Active apps after init: ${admin.apps.length}`);
    console.log(`🎯 [FirebaseAdmin] Default app exists: ${admin.apps.length > 0 ? 'YES' : 'NO'}`);
  } catch (error: any) {
    initSuccess = false;
    console.error('❌ [FirebaseAdmin] Firebase Admin initialization FAILED');
    console.error(`❌ [FirebaseAdmin] Error: ${error.message}`);
    console.error(`❌ [FirebaseAdmin] Stack: ${error.stack}`);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
} else {
  console.log(`♻️  [FirebaseAdmin] Firebase Admin already initialized (${admin.apps.length} apps)`);
}

/**
 * Returns the initialized Firebase Admin instance
 * IMPORTANT: Always use this instead of importing 'firebase-admin' directly
 * @returns The initialized admin instance
 * @throws Error if Firebase Admin is not initialized
 */
export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    console.error('❌ [getFirebaseAdmin] No Firebase Admin apps found!');
    console.error(`❌ [getFirebaseAdmin] Init attempted: ${initAttempted}, Init success: ${initSuccess}`);
    throw new Error(
      'CRITICAL: Firebase Admin not initialized. The default Firebase app does not exist. ' +
      'This indicates a module loading issue in the serverless environment.'
    );
  }
  console.log(`✓ [getFirebaseAdmin] Returning Firebase Admin instance (${admin.apps.length} apps)`);
  return admin;
}

/**
 * Returns the Firestore instance
 * @returns Firestore database instance
 * @throws Error if Firebase Admin is not initialized
 */
export function getDb() {
  if (admin.apps.length === 0) {
    console.error('❌ [getDb] No Firebase Admin apps found!');
    console.error(`❌ [getDb] Init attempted: ${initAttempted}, Init success: ${initSuccess}`);
    throw new Error(
      'CRITICAL: Firebase Admin not initialized. Cannot get Firestore instance. ' +
      'Make sure to import from @/lib/firebaseAdmin instead of firebase-admin directly.'
    );
  }
  console.log('✓ [getDb] Returning Firestore instance');
  return admin.firestore();
}

/**
 * Returns the Auth instance
 * @returns Firebase Auth instance
 * @throws Error if Firebase Admin is not initialized
 */
export function getAuth() {
  if (admin.apps.length === 0) {
    console.error('❌ [getAuth] No Firebase Admin apps found!');
    console.error(`❌ [getAuth] Init attempted: ${initAttempted}, Init success: ${initSuccess}`);
    throw new Error(
      'CRITICAL: Firebase Admin not initialized. Cannot get Auth instance. ' +
      'Make sure to import from @/lib/firebaseAdmin instead of firebase-admin directly.'
    );
  }
  console.log('✓ [getAuth] Returning Auth instance');
  return admin.auth();
}

/**
 * Health check function for debugging
 * Returns the initialization state
 */
export function getInitState() {
  return {
    initAttempted,
    initSuccess,
    appsCount: admin.apps.length,
    hasDefaultApp: admin.apps.length > 0,
  };
}