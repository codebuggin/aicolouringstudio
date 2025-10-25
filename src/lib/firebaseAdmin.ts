// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Initialize at module level - runs once when this module is first imported
if (admin.apps.length === 0) {
  console.log('🔥 Initializing Firebase Admin (module level)');
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw error;
  }
}

// These functions now just return the already-initialized instances
export function getFirebaseAdmin() {
  return admin;
}

export function getDb() {
  return admin.firestore();
}

export function getAuth() {
  return admin.auth();
}