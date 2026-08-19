// maintenance.maintenance_requests + maintenance.maintenance_request_photos
// RMS Backend Plan §3.10

import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { maintenanceCategory, maintenanceStatus } from './enums';
import { profiles } from './public';
import { units } from './property';

export const maintenanceSchema = pgSchema('maintenance');

export const maintenanceRequests = maintenanceSchema.table('maintenance_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id').notNull().references(() => units.id, { onDelete: 'restrict' }),
  tenantProfileId: uuid('tenant_profile_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  category: maintenanceCategory('category').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: maintenanceStatus('status').notNull().default('open'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const maintenanceRequestPhotos = maintenanceSchema.table('maintenance_request_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  maintenanceRequestId: uuid('maintenance_request_id')
    .notNull()
    .references(() => maintenanceRequests.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
