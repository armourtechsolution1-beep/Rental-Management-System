// property.properties + property.units — RMS Backend Plan §3.4, §3.5

import { pgSchema, uuid, text, integer, numeric, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { propertyType, occupancyStatus } from './enums';
import { landlords } from './people';

export const propertySchema = pgSchema('property');

export const properties = propertySchema.table('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  landlordId: uuid('landlord_id').notNull().references(() => landlords.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  propertyType: propertyType('property_type').notNull(),
  addressLine: text('address_line'),
  city: text('city'),
  county: text('county'),
  country: text('country').notNull().default('Kenya'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const units = propertySchema.table(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'restrict' }),
    unitNumber: text('unit_number').notNull(),
    unitType: text('unit_type'),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    rentAmount: numeric('rent_amount', { precision: 12, scale: 2 }).notNull(),
    occupancyStatus: occupancyStatus('occupancy_status').notNull().default('vacant'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePropertyUnitNumber: uniqueIndex('uq_units_property_unit_number').on(
      table.propertyId,
      table.unitNumber
    ),
  })
);
