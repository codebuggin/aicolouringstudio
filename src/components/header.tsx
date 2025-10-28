'use client';

import Link from "next/link";
import { useFirebase } from "@/firebase";
import { UserNav } from "@/components/user-nav";
import { Button } from "./ui/button";
import { Crown, Loader2, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";

export function Header() {
    const { user, isUserLoading, firestore } = useFirebase();
    const [isMounted, setIsMounted] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (user && firestore) {
            setIsProfileLoading(true);
            const userDocRef = doc(firestore, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setIsSubscribed(doc.data().isSubscribed === true);
                } else {
                    setIsSubscribed(false);
                }
                setIsProfileLoading(false);
            }, (error) => {
                console.error("Failed to listen to user profile:", error);
                setIsSubscribed(false);
                setIsProfileLoading(false);
            });

            return () => unsubscribe();
        } else if (!isUserLoading) {
            setIsProfileLoading(false);
            setIsSubscribed(false);
        }
    }, [user, firestore, isUserLoading]);

    return (
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/50"
        >
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Palette className="h-6 w-6 text-primary" />
                    <span className="font-bold">AI Coloring Studio</span>
                </Link>
                
                <div className="flex items-center space-x-4">
                    {isMounted && (
                      <>
                        {isUserLoading || (user && isProfileLoading) ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : user ? (
                            <div className="flex items-center gap-2 sm:gap-4">
                                {!isSubscribed && (
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button asChild size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_15px_theme(colors.cyan.400)] hover:shadow-[0_0_25px_theme(colors.cyan.300)] transition-all">
                                        <Link href="/subscribe">
                                            <Crown className="mr-2 h-4 w-4" />
                                            Go Pro
                                        </Link>
                                    </Button>
                                    </motion.div>
                                )}
                                <UserNav user={user} isSubscribed={isSubscribed} />
                            </div>
                        ) : (
                            <Button asChild>
                                <Link href="/login">Get Started</Link>
                            </Button>
                        )}
                      </>
                    )}
                </div>
            </div>
        </motion.header>
    );
}
