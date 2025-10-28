'use client';

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type User } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { GalleryHorizontal, LogOut, User as UserIcon, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserNavProps {
  user: User;
  isSubscribed: boolean;
}

export function UserNav({ user, isSubscribed }: UserNavProps) {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth?.signOut();
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return <UserIcon className="w-5 h-5" />;
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary transition-all">
                <AvatarImage
                src={user.photoURL ?? ''}
                alt={user.displayName ?? 'User'}
                />
                <AvatarFallback className="bg-muted-foreground/50 text-foreground">
                    {getInitials(user.displayName)}
                </AvatarFallback>
            </Avatar>
            {isSubscribed && (
                <motion.div
                    className="absolute bottom-0 right-0"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Crown className="h-4 w-4 text-yellow-400" fill="currentColor" />
                </motion.div>
            )}
            </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'Welcome'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
                {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/gallery">
              <GalleryHorizontal className="mr-2" />
              <span>My Creations</span>
            </Link>
          </DropdownMenuItem>
          {!isSubscribed && (
            <DropdownMenuItem asChild>
              <Link href="/subscribe">
                <Crown className="mr-2 text-yellow-400" />
                <span className="font-bold">Upgrade to Pro</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
