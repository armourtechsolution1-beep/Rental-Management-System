// Smoke test for lib/db/ — run this against a scratch/dev database only.
// It inserts fixed test rows and does not clean up after itself, so it will
// fail with unique-constraint errors on a second run against the same DB.
//
// Usage: DATABASE_URL=<scratch-db-url> npx tsx lib/db/scripts/check-connection.ts
import { db, schema } from '../client';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('--- Inserting a profile via Drizzle (crosses public -> people -> property -> leasing) ---');

  await db.execute(`insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'landlord@test.com')`);
  await db.execute(`insert into auth.users (id, email) values ('22222222-2222-2222-2222-222222222222', 'tenant@test.com')`);

  const [landlordProfile] = await db
    .insert(schema.profiles)
    .values({
      id: '11111111-1111-1111-1111-111111111111',
      fName: 'Tom',
      lName: 'Otieno',
      email: 'landlord@test.com',
    })
    .returning();
  console.log('Inserted profile:', landlordProfile.fName, landlordProfile.lName);

  await db.insert(schema.profiles).values({
    id: '22222222-2222-2222-2222-222222222222',
    fName: 'Amina',
    lName: 'Wanjiru',
    email: 'tenant@test.com',
  });

  const [landlord] = await db
    .insert(schema.landlords)
    .values({ profileId: '11111111-1111-1111-1111-111111111111' })
    .returning();
  console.log('Inserted landlord (people schema):', landlord.id);

  const [property] = await db
    .insert(schema.properties)
    .values({
      landlordId: landlord.id,
      name: 'Riverside Apartments',
      propertyType: 'residential',
    })
    .returning();
  console.log('Inserted property (property schema):', property.name);

  const [unit] = await db
    .insert(schema.units)
    .values({
      propertyId: property.id,
      unitNumber: '4B',
      rentAmount: '25000',
    })
    .returning();
  console.log('Inserted unit (property schema):', unit.unitNumber);

  const [lease] = await db
    .insert(schema.leases)
    .values({
      propertyId: property.id,
      unitId: unit.id,
      tenantProfileId: '22222222-2222-2222-2222-222222222222',
      landlordId: landlord.id,
      rentalAmount: '25000',
      paymentCycle: 'monthly',
      leaseType: 'fixed-term',
      startDate: '2027-01-01',
      endDate: '2027-12-31',
    })
    .returning();
  console.log('Inserted lease (leasing schema):', lease.id);

  console.log('\n--- Testing a cross-schema join (leases + properties + profiles) ---');
  const joined = await db
    .select({
      leaseId: schema.leases.id,
      propertyName: schema.properties.name,
      tenantFirstName: schema.profiles.fName,
    })
    .from(schema.leases)
    .innerJoin(schema.properties, eq(schema.leases.propertyId, schema.properties.id))
    .innerJoin(schema.profiles, eq(schema.leases.tenantProfileId, schema.profiles.id));
  console.log('Join result:', joined);

  console.log('\n--- Confirming the check constraint on leases (endDate/leaseType pairing) rejects a bad insert ---');
  try {
    await db.insert(schema.leases).values({
      propertyId: property.id,
      unitId: unit.id,
      tenantProfileId: '22222222-2222-2222-2222-222222222222',
      landlordId: landlord.id,
      rentalAmount: '25000',
      paymentCycle: 'monthly',
      leaseType: 'fixed-term',
      startDate: '2027-01-01',
      endDate: null, // should violate chk_leases_end_date_by_type
    });
    console.log('ERROR: bad insert unexpectedly succeeded');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log('Correctly rejected:', err.message.split('\n')[0]);
    } else {
      console.log('Correctly rejected:', String(err));
    }
  }

  console.log('\nAll checks passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
