'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Loader2, Sparkles, PartyPopper, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder } from './actions';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function ProCelebration() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto text-center animate-in fade-in-0 zoom-in-95 duration-700">
      <div className="relative overflow-hidden rounded-lg glass-card p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-pulse-slow"></div>
        <div className="relative z-10">
          <PartyPopper className="mx-auto h-16 w-16 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold mt-6 gradient-text">
            Welcome to Pro, {user?.displayName?.split(' ')[0] || 'friend'}! 🥂
          </h1>
          <p className="text-muted-foreground mt-2">
            You’ve officially unlocked all premium features.
          </p>
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="mt-8 font-bold bg-gradient-to-r from-accent to-ring text-black transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_var(--accent)]"
          >
            <Rocket className="mr-2" />
            Start Creating
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubscribe = async (method?: 'upi') => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to subscribe.',
      });
      router.push('/login');
      return;
    }

    setIsSubscribing(true);

    try {
      // 1. Create a payment order from our server
      const orderResult = await createRazorpayOrder({ userId: user.uid });

      if (!orderResult.success || !orderResult.orderId || !orderResult.amount) {
        throw new Error(orderResult.message || 'Failed to create payment order.');
      }

      const { orderId, amount } = orderResult;

      // 2. Configure Razorpay options
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: 'AI Coloring Studio',
        description: 'Pro Plan - Lifetime Access',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Construct the absolute URL for the API endpoint
            const verificationUrl = new URL('/api/verify-payment', window.location.origin).href;

            const verificationResponse = await fetch(
              verificationUrl,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user.uid,
                }),
              }
            );

            const verificationResult = await verificationResponse.json();

            if (verificationResult.success) {
              toast({
                title: '🎉 Payment Successful!',
                description: 'You now have unlimited access.',
              });
              setPaymentSuccess(true); // Trigger celebration UI
            } else {
              toast({
                variant: 'destructive',
                title: 'Payment Verification Failed',
                description: verificationResult.message,
              });
            }
          } catch (error: any) {
            console.error('Verification request failed:', error);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not communicate with the server for verification.',
            });
          } finally {
            setIsSubscribing(false);
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#7F00FF',
        },
        modal: {
          ondismiss: function () {
            setIsSubscribing(false);
            toast({
              variant: 'default',
              title: 'Payment Cancelled',
              description: 'Your payment process was cancelled.',
            });
          },
        },
      };

      if (method === 'upi') {
        options.method = {
            upi: true,
            card: false,
            wallet: false,
            netbanking: false,
            paylater: false,
        };
      }

      // 3. Open the Razorpay checkout modal
      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: response.error.description || 'An unknown error occurred.',
        });
        setIsSubscribing(false);
      });
    } catch (error: any) {
      console.error('Subscription failed:', error);
      toast({
        variant: 'destructive',
        title: 'Subscription Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
      setIsSubscribing(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl text-center py-20">
        <h1 className="text-4xl font-bold gradient-text mb-4">Please Log In</h1>
        <p className="text-muted-foreground mb-8">
          You need to be logged in to subscribe to a plan.
        </p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setIsRazorpayReady(true)}
      />
      <div className="container mx-auto max-w-2xl py-12 px-4 flex flex-col items-center justify-center">
        {paymentSuccess ? (
          <ProCelebration />
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold tracking-tight gradient-text">
                Unlock Unlimited Creativity
              </h1>
              <p className="mt-4 text-xl text-muted-foreground">
                Get lifetime access to our AI coloring page generator with a one-time payment.
              </p>
            </div>
            <Card className="glass-card w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <Crown className="mx-auto h-12 w-12 text-primary" />
                <CardTitle className="text-3xl font-bold mt-4">Pro Plan</CardTitle>
                <CardDescription className="text-lg">
                  Lifetime access. One-time payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <div className="text-5xl font-bold">
                  ₹10
                  <span className="text-xl font-normal text-muted-foreground">/one-time</span>
                </div>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-accent mr-3" />
                    <span>
                      <span className="font-semibold">Unlimited</span> image generations
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-accent mr-3" />
                    <span>
                      <span className="font-semibold">Unlimited</span> PDF downloads
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-accent mr-3" />
                    <span>
                      <span className="font-semibold">Lifetime</span> access to all features
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-accent mr-3" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                    className="w-full bg-black text-white font-bold text-lg flex items-center justify-center gap-2 border border-white/20"
                    size="lg"
                    onClick={() => handleSubscribe('upi')}
                    disabled={isSubscribing || !isRazorpayReady}
                >
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"><title>Google Pay</title><path d="M20.334 8.527L12.012 17.52l-2.31-2.324 4.08-4.078h-3.99V8.527h8.542zm-5.01-1.848h-3.32v3.32l-2.503-2.502-1.39 1.39 3.893 3.893 5.435-5.435-1.39-1.39zM12.012.607l-7.46 7.458v3.91h3.91L12.012 8.42l3.55-3.55zm0 22.786l-8.527-8.527V8.527L12.012.607l8.528 8.527v6.34L12.012 23.393z" fill="white"></path></svg>
                    Pay with Google Pay
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg"
                  size="lg"
                  onClick={() => handleSubscribe()}
                  disabled={isSubscribing || !isRazorpayReady}
                >
                  {isSubscribing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isSubscribing ? 'Processing...' : 'Upgrade to Pro'}
                </Button>
              </CardFooter>
            </Card>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Payments are securely processed by Razorpay.
            </p>
          </>
        )}
      </div>
    </>
  );
}
