import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

export async function verifyConnection() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT current_database() AS db, version() AS version');
    console.log(`[db] Connected to "${rows[0].db}" (${rows[0].version.split(',')[0]})`);
  } finally {
    client.release();
  }
}
