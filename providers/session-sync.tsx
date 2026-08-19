'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Mount once near the root (inside <SessionProvider>). Keeps `useAuthStore`
 * in sync with the NextAuth session so components can read `user` from Zustand
 * without subscribing to `useSession()` individually.
 */
export function SessionSync() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email ?? '',
        fName: session.user.fName,
        mName: session.user.mName,
        lName: session.user.lName,
        avatarUrl: session.user.image ?? null,
        availableRoles: session.user.availableRoles,
        activeRole: session.user.activeRole,
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status, setUser]);

  return null;
}
