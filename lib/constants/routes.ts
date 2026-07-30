import type { Role } from '@/types/user.types';

export const ROLE_HOME: Record<Role, string> = {
  LANDLORD: '/landlord/dashboard',
  TENANT: '/tenant/dashboard',
  ADMIN: '/admin/dashboard',
};

/** Route group prefixes that require a specific role */
export const PROTECTED_PREFIXES: { prefix: string; role: Role }[] = [
  { prefix: '/landlord', role: 'LANDLORD' },
  { prefix: '/tenant', role: 'TENANT' },
  { prefix: '/admin', role: 'ADMIN' },
];

// '/invite' added — Accept Invite / Set Password (Frontend Plan v5.0 §D). Tenants
// reach this via a Supabase invite link before they have any session at all, so
// it has to be public like the other guest routes, not behind middleware's auth gate.
export const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/invite'];