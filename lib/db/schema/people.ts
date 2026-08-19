// people.landlords + people.tenancies — Layers 2/3 of the lifecycle model
// RMS Backend Plan §3.3, §3.7

import { pgSchema, uuid, text, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { landlordStatus, tenancyStatus } from './enums';
import { profiles } from './public';
import { units } from './property';
import { leases } from './leasing';

export const peopleSchema = pgSchema('people');

export const landlords = peopleSchema.table('landlords', {
  id: uuid('id').primaryKey().defaultRandom(),
  // unique — one landlord record per person; status mutates, doesn't multiply (§2.1)
  profileId: uuid('profile_id').notNull().unique().references(() => profiles.id, { onDelete: 'cascade' }),
  status: landlordStatus('status').notNull().default('active'),
  businessName: text('business_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tenancies = peopleSchema.table(
  'tenancies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
    unitId: uuid('unit_id').notNull().references(() => units.id, { onDelete: 'restrict' }),
    leaseId: uuid('lease_id').notNull().references(() => leases.id, { onDelete: 'restrict' }),
    status: tenancyStatus('status').notNull().default('upcoming'),
    moveInDate: date('move_in_date'),
    moveOutDate: date('move_out_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Mirrors the partial unique index in SQL (one current tenancy per unit).
    // Drizzle can describe this index for introspection/type purposes, but the
    // partial `WHERE` clause itself is only enforced by the SQL migration —
    // see the note in lib/db/README.md.
    oneCurrentPerUnit: uniqueIndex('uq_tenancies_one_current_per_unit').on(table.unitId),
  })
);
