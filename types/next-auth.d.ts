// RMS Backend Plan v1.2 §2.1, Frontend Plan v5.0 §2.11 — no single `role` field.
import type { Role } from '@/types/user.types';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      fName: string;
      mName: string | null;
      lName: string;
      availableRoles: Role[];
      activeRole: Role;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    fName: string;
    mName: string | null;
    lName: string;
    availableRoles: Role[];
    activeRole: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    fName: string;
    mName: string | null;
    lName: string;
    availableRoles: Role[];
    activeRole: Role;
  }
}
