'use server';

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

const emailSchema = z.string().email({ message: 'Please enter a valid email address.' });
const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters long.' });

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});


export interface AuthFormState {
  message: string | null;
  success: boolean;
}

// IMPORTANT: This is a client-side action. We are returning a redirect instruction, not calling redirect()
export async function loginAction(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0] || 'Invalid credentials.',
    };
  }
  
  // This is a placeholder. The actual sign in will happen on the client.
  // We return a success message to trigger client-side logic.
  return {
    success: true,
    message: 'Redirecting...',
  };
}


export async function signupAction(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0] || 'Invalid input.',
    };
  }

  // This is a placeholder. The actual sign up will happen on the client.
  // We return a success message to trigger client-side logic.
  return {
    success: true,
    message: 'Signing up...',
  };
}


export async function logoutAction() {
    // This is a server action, but signout is a client-side operation
    // handled by the useUser hook and Firebase SDK.
    // We can redirect the user after they click the logout button.
    redirect('/');
}
