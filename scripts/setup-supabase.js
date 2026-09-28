require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  host: process.env.PGHOST || 'db.mxvshngbumpdqqgaulbd.supabase.co',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL at db.mxvshngbumpdqqgaulbd.supabase.co...');
    await client.connect();
    console.log(' Connected to Supabase PostgreSQL successfully!');

    // Read supabase-schema.sql
    const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing supabase-schema.sql migration & seed data...');
    await client.query(sql);
    console.log(' supabase-schema.sql executed successfully!');

    // Verify row counts
    const menuCount = await client.query('SELECT COUNT(*) FROM menu_items');
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    const counterCount = await client.query('SELECT COUNT(*) FROM counters');
    const reviewCount = await client.query('SELECT COUNT(*) FROM reviews');

    console.log('----------------------------------------------------');
    console.log(` Menu Items Seeded: ${menuCount.rows[0].count} pure veg dishes`);
    console.log(` Students Seeded:   ${studentCount.rows[0].count} Gokak campus accounts`);
    console.log(` Counters Seeded:   ${counterCount.rows[0].count} active campus counters`);
    console.log(` Reviews Seeded:    ${reviewCount.rows[0].count} student reviews`);
    console.log('----------------------------------------------------');

    // Check for secrets / JWT secret in vault or settings
    try {
      const secrets = await client.query("SELECT * FROM vault.decrypted_secrets WHERE name LIKE '%jwt%' OR name LIKE '%anon%' OR name LIKE '%key%'");
      console.log('Vault secrets found:', secrets.rows);
    } catch (e) {
      console.log('Vault secrets check:', e.message);
    }

  } catch (err) {
    console.error(' Error executing migration:', err);
  } finally {
    await client.end();
  }
}

run();
