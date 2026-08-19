// billing.payments — RMS Backend Plan §3.9

import { pgSchema, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { paymentMethod, paymentStatus } from './enums';
import { profiles } from './public';
import { rentSchedules } from './leasing';

export const billingSchema = pgSchema('billing');

export const payments = billingSchema.table('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  rentScheduleId: uuid('rent_schedule_id').notNull().references(() => rentSchedules.id, { onDelete: 'cascade' }),
  tenantProfileId: uuid('tenant_profile_id').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  method: paymentMethod('method').notNull(),
  status: paymentStatus('status').notNull().default('pending-review'),
  transactionReference: text('transaction_reference'),
  proofUrl: text('proof_url'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
