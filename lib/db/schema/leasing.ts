// leasing.leases + leasing.rent_schedules — RMS Backend Plan §3.6, §3.8

import { pgSchema, uuid, text, numeric, date, timestamp, check, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { paymentCycle, leaseType, leaseStatus, rentScheduleStatus } from './enums';
import { profiles } from './public';
import { properties, units } from './property';
import { landlords } from './people';

export const leasingSchema = pgSchema('leasing');

export const leases = leasingSchema.table(
  'leases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'restrict' }),
    unitId: uuid('unit_id').notNull().references(() => units.id, { onDelete: 'restrict' }),
    tenantProfileId: uuid('tenant_profile_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
    landlordId: uuid('landlord_id').notNull().references(() => landlords.id, { onDelete: 'restrict' }),
    rentalAmount: numeric('rental_amount', { precision: 12, scale: 2 }).notNull(),
    paymentCycle: paymentCycle('payment_cycle').notNull(),
    lateFeeAmount: numeric('late_fee_amount', { precision: 12, scale: 2 }),
    leaseType: leaseType('lease_type').notNull().default('fixed-term'),
    startDate: date('start_date').notNull(),
    // nullable — null only when leaseType = 'month-to-month' (§2.6); enforced
    // by chk_leases_end_date_by_type in SQL.
    endDate: date('end_date'),
    status: leaseStatus('status').notNull().default('upcoming'),
    renewedFromLeaseId: uuid('renewed_from_lease_id').references((): any => leases.id, { onDelete: 'set null' }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    endDateByLeaseType: check(
      'chk_leases_end_date_by_type',
      sql`(${table.leaseType} = 'fixed-term' and ${table.endDate} is not null) or (${table.leaseType} = 'month-to-month' and ${table.endDate} is null)`
    ),
  })
);

export const rentSchedules = leasingSchema.table(
  'rent_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaseId: uuid('lease_id').notNull().references(() => leases.id, { onDelete: 'cascade' }),
    unitId: uuid('unit_id').notNull().references(() => units.id, { onDelete: 'restrict' }),
    tenantProfileId: uuid('tenant_profile_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    dueDate: date('due_date').notNull(),
    amountDue: numeric('amount_due', { precision: 12, scale: 2 }).notNull(),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    lateFeeApplied: numeric('late_fee_applied', { precision: 12, scale: 2 }).notNull().default('0'),
    status: rentScheduleStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueLeasePeriod: uniqueIndex('uq_rent_schedules_lease_period').on(
      table.leaseId,
      table.periodStart
    ),
  })
);
