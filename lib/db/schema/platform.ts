// platform.platform_alerts — RMS Backend Plan §3.13

import { pgSchema, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { alertSeverity } from './enums';
import { profiles } from './public';

export const platformSchema = pgSchema('platform');

export const platformAlerts = platformSchema.table('platform_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  message: text('message').notNull(),
  severity: alertSeverity('severity').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  // Nullable at the column level (required by the app at insert time, but
  // must permit null so `on delete set null` can fire — §2.10 / §3.13).
  createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});
