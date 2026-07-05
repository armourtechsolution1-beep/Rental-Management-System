import { create } from 'zustand';
import type { AppUser } from '@/types/user.types';

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  /** Called once on app mount / session change to sync from the NextAuth session. */
  setUser: (user: AppUser | null) => void;
  clear: () => void;
}

/**
 * This store does NOT replace NextAuth's session — it's a convenience mirror so
 * client components can read `user` synchronously without calling `useSession()`
 * everywhere. Sync it via a `<SessionSync />` component mounted once in the root
 * layout (see providers/session-sync.tsx).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clear: () => set({ user: null, isAuthenticated: false }),
}));
