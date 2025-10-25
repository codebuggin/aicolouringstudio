'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize Firebase only on the client side
    if (typeof window !== 'undefined' && !firebaseServices) {
      try {
        console.log('🔥 FirebaseClientProvider: Initializing Firebase...');
        const services = initializeFirebase();
        console.log('✅ FirebaseClientProvider: Firebase initialized successfully');
        console.log('Services:', {
          hasApp: !!services.firebaseApp,
          hasAuth: !!services.auth,
          hasFirestore: !!services.firestore,
        });
        setFirebaseServices(services);
      } catch (err: any) {
        console.error('❌ FirebaseClientProvider: Initialization failed:', err);
        setError(err);
      }
    }
  }, [firebaseServices]);

  // Show error if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <h1 className="text-2xl font-bold mb-2">Firebase Initialization Error</h1>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // Don't render children until Firebase is initialized
  if (!firebaseServices) {
    console.log('⏳ FirebaseClientProvider: Waiting for Firebase to initialize...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('✅ FirebaseClientProvider: Rendering children with Firebase services');
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}