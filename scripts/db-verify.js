#!/usr/bin/env node
/**
 * DataFlow Database Health Check
 * Run after updating DATABASE_URL to verify everything is working.
 * Usage: node scripts/db-verify.js
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const REQUIRED_TABLES = [
  'scraped_data',
  'scrapers',
  'queries',
  'social_media_data',
  'exports',
  'activities',
];

async function verify() {
  console.log('\n🔍 DataFlow Database Health Check\n');
  console.log('─'.repeat(40));

  if (!process.env.DATABASE_URL) {
    console.error('❌  DATABASE_URL is not set.');
    console.error('    Go to Replit Secrets (🔒) and add DATABASE_URL.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Step 1: Test connection
  console.log('\n1️⃣  Testing connection...');
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(
      'SELECT current_database(), current_user'
    );
    console.log(`   ✅  Connected to: ${rows[0].current_database}`);
    console.log(`   ✅  User: ${rows[0].current_user}`);
  } catch (err) {
    console.error(`   ❌  Connection failed: ${err.message}`);
    console.error('\n👉  Fix: Update DATABASE_URL in Replit Secrets (🔒)');
    console.error('    Get the fresh connection string from https://console.neon.tech');
    await pool.end();
    process.exit(1);
  }

  // Step 2: Check tables
  console.log('\n2️⃣  Checking tables...');
  const { rows: existingTables } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  const existingNames = existingTables.map((r) => r.table_name);

  let allTablesOk = true;
  for (const table of REQUIRED_TABLES) {
    if (existingNames.includes(table)) {
      const { rows: count } = await client.query(
        `SELECT COUNT(*) FROM "${table}"`
      );
      console.log(`   ✅  ${table} (${count[0].count} rows)`);
    } else {
      console.log(`   ⚠️   ${table} — NOT FOUND (run: npx drizzle-kit push)`);
      allTablesOk = false;
    }
  }

  // Step 3: Summary
  console.log('\n' + '─'.repeat(40));
  if (allTablesOk) {
    console.log('✅  All checks passed — database is healthy!\n');
  } else {
    console.log('⚠️   Some tables are missing.');
    console.log('    Run: npx drizzle-kit push');
    console.log('    Then run this script again.\n');
  }

  client.release();
  await pool.end();
}

verify().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
