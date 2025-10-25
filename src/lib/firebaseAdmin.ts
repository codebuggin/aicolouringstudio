// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK at module level
 * This ensures initialization happens once when the module is first imported
 * Works with Application Default Credentials in Cloud Run/Firebase Hosting
 */
if (admin.apps.length === 0) {
  console.log('🔥 Initializing Firebase Admin SDK...');
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('✅ Firebase Admin initialized successfully');
    console.log(`📊 Active apps: ${admin.apps.length}`);
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.error('Stack:', error.stack);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

/**
 * Returns the initialized Firebase Admin instance
 * IMPORTANT: Always use this instead of importing 'firebase-admin' directly
 * @returns The initialized admin instance
 */
export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized. This should not happen.');
  }
  return admin;
}

/**
 * Returns the Firestore instance
 * @returns Firestore database instance
 */
export function getDb() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized. Cannot get Firestore instance.');
  }
  return admin.firestore();
}

/**
 * Returns the Auth instance
 * @returns Firebase Auth instance
 */
export function getAuth() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized. Cannot get Auth instance.');
  }
  return admin.auth();
}