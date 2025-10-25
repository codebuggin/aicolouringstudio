'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { signupAction } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Create an account
    </Button>
  );
}

function GoogleButton() {
  const { auth, firestore } = useFirebase();
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
        generationCount: 0,
        isSubscribed: false,
      }, { merge: true });

      toast({ title: '✅ Successfully signed up!' });
      router.push('/');
    } catch (e: any) {
      const error = e as FirebaseError;
      let description = error.message;

      // Provide more specific feedback for common production errors
      if (error.code === 'auth/operation-not-allowed') {
        description = "Google Sign-In is not enabled. Please enable it in your Firebase project's authentication settings.";
      } else if (error.code === 'auth/auth-domain-config-required' || error.code === 'auth/unauthorized-domain') {
        description = "Your app's domain is not authorized. Please add it to the authorized domains in your Firebase Authentication settings.";
      }

      toast({
        variant: "destructive",
        title: "Google Sign-Up Failed",
        description: description,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button variant="outline" type="button" disabled={isPending} onClick={handleGoogleSignIn} className="w-full">
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.4 64.5c-31.5-29.4-71.4-46.3-119.3-46.3-94.3 0-171.3 76.9-171.3 171.3s77 171.3 171.3 171.3c108.3 0 152-74.2 158.8-114.3H248V261.8h239.2z"></path></svg>
      )}
      Sign up with Google
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, { message: null, success: false });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();

  useEffect(() => {
    const performSignUp = async () => {
      if (state.success && auth && firestore) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Create user profile in Firestore
          const userRef = doc(firestore, 'users', user.uid);
          await setDoc(userRef, {
            email: user.email,
            createdAt: serverTimestamp(),
            generationCount: 0,
            isSubscribed: false,
          });
          
          toast({ title: '✅ Account created successfully!' });
          router.push('/');
        } catch (e) {
          const error = e as FirebaseError;
          let message = "An unknown error occurred.";
          if (error.code === 'auth/email-already-in-use') {
            message = "This email is already in use. Please log in instead.";
          }
          toast({
            variant: "destructive",
            title: "Sign-up Failed",
            description: message,
          });
        }
      } else if (!state.success && state.message) {
         toast({
            variant: "destructive",
            title: "Error",
            description: state.message,
          });
      }
    };
    performSignUp();
  }, [state, auth, firestore, email, password, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="mx-auto grid w-[350px] gap-6 glass-card p-6 rounded-lg">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold gradient-text">Sign Up</h1>
          <p className="text-balance text-muted-foreground">
            Enter your information to create an account
          </p>
        </div>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              name="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <SubmitButton />
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <GoogleButton />
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline text-primary">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
