// backend/scripts/init_db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('Set DATABASE_URL in .env or environment variables.');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'create_table.sql'), 'utf8');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Table created (or already existed).');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

main();
