'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Crown, Sparkles } from 'lucide-react';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeProModal({ isOpen, onClose }: UpgradeProModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/subscribe');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card text-center p-8">
        <DialogHeader>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [-10, 10, -10, 0] }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <Crown className="mx-auto h-16 w-16 text-yellow-400" style={{ filter: "drop-shadow(0 0 10px hsl(var(--pro-accent-glow)))" }} />
          </motion.div>
          <DialogTitle className="text-3xl font-bold gradient-text mt-4">
            You've Reached Your Limit!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 text-lg">
            Upgrade to Pro to unlock unlimited image generations and more.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold"
            onClick={handleUpgrade}
          >
            <Sparkles className="mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
