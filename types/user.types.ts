export const ROLES = ['LANDLORD', 'TENANT', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Role is never a single stored value (Backend Plan §2.1 / Frontend Plan
 * §2.11): `availableRoles` is every role currently active for this person —
 * computed at login from `is_admin` / `people.landlords` / `people.tenancies`
 * — and `activeRole` is which workspace they're currently viewing. A person
 * can hold LANDLORD and TENANT simultaneously; ADMIN is always exclusive.
 *
 * Name is split to match `public.profiles` exactly (`f_name`/`m_name`
 * optional/`l_name`) — no single `name` field, so no mapping/splitting
 * logic is needed between this type and the database.
 */
export interface AppUser {
  id: string;
  email: string;
  fName: string;
  mName?: string | null;
  lName: string;
  avatarUrl?: string | null;
  availableRoles: Role[];
  activeRole: Role;
}

/** Shape stored inside the NextAuth JWT / session */
export interface SessionUser extends AppUser {
  accessToken?: string;
}
