import { z } from "zod";

/**
 * Shared primitives for the Zod schema package (Backend Plan §7 Phase 1 /
 * Frontend Plan Phase 1 checklist — "shared as the single contract between
 * the two plans"). Every domain schema file under `lib/validations/schemas/`
 * builds on these instead of redeclaring the same Postgres-column-to-Zod
 * mapping table-by-table.
 */

export const uuidString = z.uuid();

/**
 * Postgres `numeric` columns come back from `pg`/Drizzle as strings, not
 * JS numbers — this mirrors that wire representation exactly rather than
 * silently coercing to `number` and risking float-precision loss on money
 * fields (rent amounts, payment amounts). Record/read schemas use this;
 * create/input schemas (where the frontend is submitting a form field) use
 * `z.coerce.number()` instead, since that's what RHF/inputs actually hand
 * back — see each domain file's `create*Schema` for the split.
 */
export const numericString = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, "Expected a numeric string");

/** Postgres `date` (no time component) columns — `YYYY-MM-DD`. */
export const dateOnlyString = z.iso.date();

/** Postgres `timestamptz` columns, serialized to ISO 8601 over JSON. */
export const timestampString = z.iso.datetime({ offset: true });
