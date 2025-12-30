// backend/src/db.js
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL env var');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // required for many hosted Postgres providers like Neon
});
