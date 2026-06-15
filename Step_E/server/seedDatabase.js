/**
 * Database Seeder — loads the Step A generated datasets (20k+ rows)
 * into the live Docker PostgreSQL database.
 *
 * Run from Step_E/server:  node seedDatabase.js
 *
 * Execution order strictly respects the FK constraints:
 *   1. Base tables:        LOCATIONS, STAFF, VENDORS
 *   2. Middle table:       ASSETS        (FK -> LOCATIONS, VENDORS)
 *   3. Transaction tables: MAINTENANCE_TICKETS, INSPECTION_LOG (FK -> ASSETS, STAFF)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STEP_A = path.resolve(__dirname, '..', '..', 'Step_A');

const SEED_FILES = [
  { label: 'Locations (500)', file: path.join(STEP_A, 'mockarooFiles', 'INSERT_LOCATION.sql') },
  { label: 'Staff (500)', file: path.join(STEP_A, 'mockarooFiles', 'INSERT_STAFF.sql') },
  { label: 'Vendors (500)', file: path.join(STEP_A, 'AI_generated_insert', 'VENDORS.sql') },
  { label: 'Assets (20k)', file: path.join(STEP_A, 'PythonScript', 'insert_assets_20k.sql') },
  { label: 'Maintenance Tickets (20k)', file: path.join(STEP_A, 'PythonScript', 'insert_tickets_20k.sql') },
  { label: 'Inspection Log (500)', file: path.join(STEP_A, 'AI_generated_insert', 'INSPECTION_LOG.sql') },
];

/**
 * The Step A files must not be modified, so known generator glitches are
 * repaired in memory before execution.
 */
function sanitize(sql) {
  // INSERT_LOCATION.sql line 4 contains a corrupted table name
  return sql.replaceAll('INSERT INTO ININSERTTO LOCATIONS', 'INSERT INTO LOCATIONS');
}

async function seed() {
  // Fail fast if any file is missing before touching the database
  for (const { file } of SEED_FILES) {
    if (!fs.existsSync(file)) {
      throw new Error(`Seed file not found: ${file}`);
    }
  }

  const client = await pool.connect();
  const startedAt = Date.now();

  try {
    console.log('Connected. Starting seed inside a single transaction...\n');
    await client.query('BEGIN');

    // Clear existing data (reverse FK order via CASCADE) so the
    // generated primary keys never collide with leftover records.
    console.log('Clearing existing data from all 6 tables...');
    await client.query(
      'TRUNCATE INSPECTION_LOG, MAINTENANCE_TICKETS, ASSETS, VENDORS, STAFF, LOCATIONS CASCADE',
    );

    for (const { label, file } of SEED_FILES) {
      const t0 = Date.now();
      process.stdout.write(`Seeding ${label}... `);

      // Each file is executed as one raw multi-statement query —
      // pg handles the large batch in a single round trip.
      const sql = sanitize(fs.readFileSync(file, 'utf8'));
      await client.query(sql);

      console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }

    await client.query('COMMIT');

    // Final report with real row counts
    const { rows } = await client.query(`
      SELECT (SELECT COUNT(*) FROM LOCATIONS)           AS locations,
             (SELECT COUNT(*) FROM STAFF)               AS staff,
             (SELECT COUNT(*) FROM VENDORS)             AS vendors,
             (SELECT COUNT(*) FROM ASSETS)              AS assets,
             (SELECT COUNT(*) FROM MAINTENANCE_TICKETS) AS tickets,
             (SELECT COUNT(*) FROM INSPECTION_LOG)      AS inspections
    `);
    const c = rows[0];
    console.log('\nDone! Row counts in the live database:');
    console.log(`  LOCATIONS:           ${c.locations}`);
    console.log(`  STAFF:               ${c.staff}`);
    console.log(`  VENDORS:             ${c.vendors}`);
    console.log(`  ASSETS:              ${c.assets}`);
    console.log(`  MAINTENANCE_TICKETS: ${c.tickets}`);
    console.log(`  INSPECTION_LOG:      ${c.inspections}`);
    console.log(`\nTotal time: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nSeeding failed — transaction rolled back. Nothing was changed.');
    console.error('Reason:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
