export const ROLES = ['LANDLORD', 'TENANT', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

/** Shape stored inside the NextAuth JWT / session */
export interface SessionUser extends AppUser {
  accessToken?: string;
}
