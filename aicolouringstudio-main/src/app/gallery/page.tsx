'use client';

import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import jsPDF from 'jspdf';
import { getImageDataUri } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function GalleryPage() {
  const { user, isUserLoading, firestore, isSubscribed } = useFirebase();
  const { toast } = useToast();

  const creationsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, `users/${user.uid}/generatedImages`), orderBy('createdAt', 'desc')) : null),
    [user, firestore]
  );
  
  const { data: images, isLoading } = useCollection<{ imageUrl: string; prompt: string, createdAt: any }>(creationsQuery);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (imageUrl: string, prompt: string, imageId: string) => {
    setDownloadingId(imageId);
    try {
        const base64data = await getImageDataUri(imageUrl);

        const image = document.createElement('img');
        image.src = base64data;
        
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error("Failed to get canvas context.");
                toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not create canvas for PDF.' });
                setDownloadingId(null);
                return;
            }
            ctx.drawImage(image, 0, 0);

            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [image.naturalWidth, image.naturalHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, image.naturalWidth, image.naturalHeight);
            pdf.save(`${prompt.slice(0, 20)}.pdf`);
            setDownloadingId(null);
        };
        image.onerror = () => {
             console.error("Failed to load image for PDF generation.");
             toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not load image data.' });
             setDownloadingId(null);
        }

    } catch (error: any) {
        console.error("Failed to generate PDF:", error);
        toast({ variant: 'destructive', title: 'Download Failed', description: error.message || 'An unknown error occurred.' });
        setDownloadingId(null);
    }
  };


  if (isUserLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">Please log in to view your creations.</h1>
        <Button asChild className="mt-4">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className={isSubscribed ? "pro-gradient-text text-4xl font-bold mb-4" : "gradient-text text-4xl font-bold mb-4"}>My Creations</h1>
        <p className="text-muted-foreground">You haven't created any images yet. Let's make some magic!</p>
        <Button asChild className="mt-6">
          <Link href="/">Generate an Image</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={isSubscribed ? "text-4xl sm:text-5xl font-bold tracking-tight pro-gradient-text mb-8 text-center" : "text-4xl sm:text-5xl font-bold tracking-tight gradient-text mb-8 text-center"}>
        {isSubscribed ? "Your AI Creations (Pro Access)" : "My Creations"}
      </h1>
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {images.map((image) => (
          <motion.div
            key={image.id}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="glass-card overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:shadow-2xl hover:-translate-y-2 flex flex-col">
                <CardContent className="p-0 aspect-square w-full bg-white/10 flex items-center justify-center">
                    <Image
                        src={image.imageUrl}
                        alt={image.prompt}
                        width={512}
                        height={512}
                        className="object-contain w-full h-full"
                        crossOrigin="anonymous"
                    />
                </CardContent>
                <div className="p-4 flex flex-col flex-grow">
                <p className="text-sm text-muted-foreground truncate flex-grow" title={image.prompt}>{image.prompt}</p>
                <Button 
                    onClick={() => handleDownloadPdf(image.imageUrl, image.prompt, image.id)} 
                    disabled={downloadingId === image.id}
                    size="sm" 
                    className="mt-4 w-full bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground transition-all duration-300 transform hover:scale-105"
                >
                    {downloadingId === image.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {downloadingId === image.id ? 'Downloading...' : 'Download PDF'}
                </Button>
                </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
