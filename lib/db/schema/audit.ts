// audit.audit_logs — RMS Backend Plan §3.12

import { pgSchema, uuid, text, jsonb, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { actorType } from './enums';
import { profiles } from './public';

export const auditSchema = pgSchema('audit');

export const auditLogs = auditSchema.table(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: actorType('actor_type').notNull(),
    // required when actorType = 'user', otherwise null — enforced by
    // chk_audit_logs_actor_type_profile_pairing in SQL (§2.4)
    actorProfileId: uuid('actor_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    actionType: text('action_type').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    beforeData: jsonb('before_data'),
    afterData: jsonb('after_data'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorTypeProfilePairing: check(
      'chk_audit_logs_actor_type_profile_pairing',
      sql`(${table.actorType} = 'user') = (${table.actorProfileId} is not null)`
    ),
  })
);
