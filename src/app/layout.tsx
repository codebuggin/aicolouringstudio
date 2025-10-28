import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { Header } from '@/components/header';
import { MotionDiv } from '@/components/motion-div';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AI Coloring Studio',
  description: 'Turn any idea into a printable coloring page. Describe your idea and watch AI bring it to life.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
       <body className={cn('h-full font-sans antialiased bg-background', inter.variable)}>
        <FirebaseClientProvider>
          <div className="relative flex flex-col min-h-screen z-10">
              <Header />
              <main className="flex-grow flex flex-col">
                <MotionDiv
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="flex-grow flex flex-col"
                >
                  {children}
                </MotionDiv>
              </main>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
