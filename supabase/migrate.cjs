const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read connection string from environment or prompt
const connectionString = process.env.DATABASE_URL || 
  (process.env.SUPABASE_DB_PASSWORD 
    ? `postgresql://postgres.tjdivlwutirvbrlrtwdz:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`
    : null);

if (!connectionString) {
  console.error('Error: Please provide DATABASE_URL or SUPABASE_DB_PASSWORD environment variable.');
  console.error('Example:');
  console.error('  $env:DATABASE_URL="postgresql://postgres.tjdivlwutirvbrlrtwdz:<PASSWORD>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"');
  console.error('  node supabase/migrate.cjs');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!');

    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying schema.sql to Supabase...');
    await client.query(sql);
    console.log('🎉 Supabase Database Schema Migration succeeded!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
