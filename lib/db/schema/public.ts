// public.profiles + public.notifications — RMS Backend Plan §3.2, §3.11
//
// These two are the only tables in `public`; everything else lives in the
// seven backend-only schemas. They're included here (not just accessed via
// supabase-js) because trusted server code frequently needs to join across
// `public` and the backend-only schemas in a single typed query.

import { pgSchema, pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { accountStatus, notificationType } from './enums';

// Supabase's `auth` schema is managed by the platform, not by our migrations.
// This stub exists only so profiles.id can carry a typed foreign key to it —
// it intentionally does not model the rest of auth.users.
const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  fName: text('f_name').notNull(),
  mName: text('m_name'),
  lName: text('l_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  accountStatus: accountStatus('account_status').notNull().default('pending-verification'),
  isAdmin: boolean('is_admin').notNull().default(false),
  // 'LANDLORD' | 'TENANT' | 'ADMIN' | null — enforced by chk_profiles_last_active_role
  // in SQL rather than a Postgres enum, since it's a session/routing concept (§2.1)
  // rather than a domain lifecycle status.
  lastActiveRole: text('last_active_role'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: notificationType('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
