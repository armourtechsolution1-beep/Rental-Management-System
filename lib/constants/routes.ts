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

export const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];
