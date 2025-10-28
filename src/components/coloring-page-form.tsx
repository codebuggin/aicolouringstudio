'use client';

import Image from 'next/image';
import { useActionState, useEffect, useRef, useState, useTransition, Suspense } from 'react';
import jsPDF from 'jspdf';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { generateImageAction } from '@/app/actions';
import { type FormState, initialFormState } from '@/app/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MotionDiv } from './motion-div';
import { UpgradeProModal } from './upgrade-pro-modal';
import { cn } from '@/lib/utils';

const FREE_GENERATION_LIMIT = 5;

const examplePrompts = [
  "a majestic lion with a crown of stars",
  "a robot painting a sunset",
  "a unicorn flying through clouds",
  "a pirate ship made of candy",
  "a fairy village in a teacup",
];


function SubmitButton({ isPending, disabled, isPro }: { isPending: boolean; disabled: boolean; isPro: boolean }) {
  return (
      <Button
        type="submit"
        disabled={isPending || disabled}
        className={cn(
          "w-full sm:w-auto text-lg font-bold transition-all duration-300",
           isPro
            ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 text-black"
            : "bg-accent hover:bg-accent/90 text-accent-foreground"
        )}
        size="lg"
      >
        {isPending ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="mr-2" />
            </motion.div>
        ) : <Sparkles className="mr-2" />}
        {isPending ? 'Generating...' : isPro ? 'Generate Instantly' : 'Generate Image'}
      </Button>
  );
}

function ResultDisplay({ state, onReset }: { state: FormState, onReset: () => void }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const {toast} = useToast();

    const handleDownload = async () => {
        if (!state.image?.imageUrl || !state.image?.prompt) return;
        setIsDownloading(true);
        try {
            const response = await fetch(state.image.imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const image = document.createElement('img');
                image.src = base64data;
                image.onload = () => {
                    const pdf = new jsPDF({
                        orientation: image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [image.naturalWidth, image.naturalHeight]
                    });
                    pdf.addImage(base64data, 'PNG', 0, 0, image.naturalWidth, image.naturalHeight);
                    pdf.save(`${state.image.prompt?.slice(0, 20)}.pdf`);
                    setIsDownloading(false);
                };
            };
        } catch (error: any) {
            console.error("Failed to generate PDF:", error);
            toast({variant: 'destructive', title: 'Download Failed', description: error.message || 'Could not prepare image for download.'});
            setIsDownloading(false);
        }
    };
    
    return (
        <MotionDiv initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.5}} className="mt-8">
            <div className="flex flex-col gap-4 max-w-md mx-auto">
                 <div className="aspect-square w-full rounded-lg overflow-hidden glass-card p-2 bg-white/10">
                      <Image 
                        src={state.image.imageUrl!}
                        alt={state.image.prompt}
                        width={512}
                        height={512}
                        className="object-contain w-full h-full rounded-md"
                        unoptimized
                      />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Button onClick={handleDownload} disabled={isDownloading} className="w-full bg-gradient-to-r from-accent to-ring text-black font-bold" size="lg">
                      {isDownloading ? <Sparkles className="mr-2 animate-spin"/> : <Download className="mr-2" />}
                      {isDownloading ? 'Preparing...' : 'Download PDF'}
                  </Button>
                 <Button onClick={onReset} variant="ghost" size="sm" className="w-full mx-auto max-w-xs text-muted-foreground">
                    <X className="mr-2 h-4 w-4" />
                    Create Another
                </Button>
                </div>
            </div>
        </MotionDiv>
    );
}

export function ColoringPageForm() {
  const [state, formAction] = useActionState(generateImageAction, initialFormState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const [userProfile, setUserProfile] = useState<{generationCount: number, isSubscribed: boolean} | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  useEffect(() => {
    if (user && firestore) {
      setIsProfileLoading(true);
      const unsub = onSnapshot(doc(firestore, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as { generationCount: number; isSubscribed: boolean });
        }
        setIsProfileLoading(false);
      });
      return () => unsub();
    } else if (!isUserLoading) {
      setIsProfileLoading(false);
      setUserProfile(null);
    }
  }, [user, firestore, isUserLoading]);

  const hasExceededLimit = userProfile ? !userProfile.isSubscribed && userProfile.generationCount >= FREE_GENERATION_LIMIT : false;
  const isPro = userProfile?.isSubscribed === true;

  const handleFormSubmit = (formData: FormData) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (hasExceededLimit) {
      setShowUpgradeModal(true);
      return;
    }
    formData.append('userId', user.uid);
    startTransition(() => {
        formAction(formData);
    });
  }

  const resetForm = () => {
    formAction(initialFormState as any);
    if (formRef.current) {
        formRef.current.reset();
    }
  };

  useEffect(() => {
    if (state.message && !state.success && !isPending) {
        if (state.message.includes('Free generation limit reached')) {
            setShowUpgradeModal(true);
        } else {
             // Let the alert component handle other errors
        }
    }
  }, [state.message, state.success, isPending]);

  const generationsLeft = userProfile ? FREE_GENERATION_LIMIT - userProfile.generationCount : FREE_GENERATION_LIMIT;
  
  const showLoading = isPending && state.prompt;
  const showResult = state.success && state.image && !isPending;
  const showError = !state.success && state.message && !isPending && !state.message.includes('limit reached');

  const isDisabled = isPending || isProfileLoading || (hasExceededLimit && !isPro);

  return (
      <div className="w-full max-w-2xl mx-auto">
        <AnimatePresence>
            {showResult ? (
                 <ResultDisplay state={state} onReset={resetForm} />
            ) : showLoading ? (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="w-full aspect-square flex items-center justify-center text-center text-muted-foreground mt-6">
                    <div>
                        <Sparkles className="mx-auto h-12 w-12 mb-4 text-primary animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                        <p className="font-semibold text-lg">✨ Generating your coloring page...</p>
                        <p className="text-sm">&quot;{state.prompt}&quot;</p>
                    </div>
                </motion.div>
            ) : (
                <>
                <form action={handleFormSubmit} ref={formRef} className="flex gap-2">
                    <Input
                        name="prompt"
                        placeholder='e.g., a majestic lion with a crown of stars'
                        className="flex-grow text-base h-12 shadow-inner bg-black/30 border-ring/50 focus:border-ring focus:shadow-[0_0_15px_hsl(var(--ring))] transition-all duration-300"
                        disabled={isDisabled}
                    />
                    <SubmitButton isPending={isPending} disabled={isDisabled} isPro={isPro} />
                </form>

                {showError && (
                    <Alert variant="destructive" className="mt-6 text-left">
                    <AlertTitle>❌ Generation Failed</AlertTitle>
                    <AlertDescription>
                        <p>{state.message.replace('❌', '').trim()}</p>
                        <div className="mt-4">
                        <Button onClick={() => formRef.current?.requestSubmit()} variant="destructive">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                        </div>
                    </AlertDescription>
                    </Alert>
                )}
                </>
            )}
        </AnimatePresence>
        <UpgradeProModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      </div>
  );
}
