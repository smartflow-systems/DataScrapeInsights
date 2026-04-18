#!/usr/bin/env node
/**
 * DataFlow Database Health Check
 * Verifies the database is connected, all 6 tables exist, and the schema
 * matches the Drizzle definitions in shared/schema.ts.
 *
 * Usage: node scripts/db-verify.mjs
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Expected schema derived from shared/schema.ts
const EXPECTED_SCHEMA = {
  scrapers: ['id', 'name', 'url', 'selectors', 'frequency', 'max_pages', 'is_active', 'created_at', 'updated_at'],
  scraped_data: ['id', 'url', 'domain', 'title', 'content', 'selectors', 'scraped_at', 'scraper_id'],
  queries: ['id', 'name', 'natural_language_query', 'sql_query', 'results', 'is_saved', 'executed_at', 'created_at'],
  social_media_data: ['id', 'platform', 'content', 'author', 'metrics', 'sentiment', 'keywords', 'collected_at'],
  exports: ['id', 'name', 'type', 'query_id', 'file_path', 'status', 'created_at', 'completed_at'],
  activities: ['id', 'type', 'message', 'status', 'metadata', 'created_at'],
};

async function verify() {
  console.log('\n🔍 DataFlow Database Health Check\n');
  console.log('─'.repeat(50));

  if (!process.env.DATABASE_URL) {
    console.error('❌  DATABASE_URL is not set.');
    console.error('    Provision a database in Replit (Database tab) or add the secret.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 1. Connection
  console.log('\n1️⃣  Testing connection...');
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query('SELECT current_database(), current_user');
    console.log(`   ✅  Database: ${rows[0].current_database}`);
    console.log(`   ✅  User:     ${rows[0].current_user}`);
  } catch (err) {
    console.error(`   ❌  Connection failed: ${err.message}`);
    await pool.end();
    process.exit(1);
  }

  // 2. Schema verification (tables + columns)
  console.log('\n2️⃣  Verifying schema (tables + columns)...');
  let allGood = true;
  for (const [table, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
    const { rows: cols } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );

    if (cols.length === 0) {
      console.log(`   ❌  ${table} — TABLE MISSING`);
      allGood = false;
      continue;
    }

    const actual = new Set(cols.map((c) => c.column_name));
    const missing = expectedCols.filter((c) => !actual.has(c));

    const { rows: count } = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    if (missing.length === 0) {
      console.log(`   ✅  ${table.padEnd(20)} ${cols.length} cols, ${count[0].count} rows`);
    } else {
      console.log(`   ⚠️   ${table.padEnd(20)} missing columns: ${missing.join(', ')}`);
      allGood = false;
    }
  }

  // 3. Summary
  console.log('\n' + '─'.repeat(50));
  if (allGood) {
    console.log('✅  All checks passed — database schema is in sync!\n');
  } else {
    console.log('⚠️   Schema mismatch detected.');
    console.log('    Recreate missing tables/columns from shared/schema.ts.\n');
    process.exit(1);
  }

  client.release();
  await pool.end();
}

verify().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
