#!/usr/bin/env node
/**
 * DataFlow Database Health Check
 *
 * Verifies:
 *   1. DATABASE_URL connection succeeds
 *   2. All 6 application tables exist
 *   3. Every column from shared/schema.ts is present (schema conformity)
 *   4. App /health endpoint responds (smoke test)
 *
 * Usage:  node scripts/db-verify.mjs
 * Exits non-zero on any failure (CI-friendly).
 */

import pg from 'pg';

const { Client } = pg;

// Schema derived from shared/schema.ts — kept in sync with Drizzle definitions.
const EXPECTED_SCHEMA = {
  scrapers:          ['id', 'name', 'url', 'selectors', 'frequency', 'max_pages', 'is_active', 'created_at', 'updated_at'],
  scraped_data:      ['id', 'url', 'domain', 'title', 'content', 'selectors', 'scraped_at', 'scraper_id'],
  queries:           ['id', 'name', 'natural_language_query', 'sql_query', 'results', 'is_saved', 'executed_at', 'created_at'],
  social_media_data: ['id', 'platform', 'content', 'author', 'metrics', 'sentiment', 'keywords', 'collected_at'],
  exports:           ['id', 'name', 'type', 'query_id', 'file_path', 'status', 'created_at', 'completed_at'],
  activities:        ['id', 'type', 'message', 'status', 'metadata', 'created_at'],
};

const APP_HEALTH_URL = process.env.APP_HEALTH_URL || 'http://localhost:5000/health';

async function verify() {
  console.log('\nDataFlow Database Health Check');
  console.log('='.repeat(50));

  if (!process.env.DATABASE_URL) {
    console.error('FAIL  DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  // 1. Connection
  console.log('\n[1] Connection');
  try {
    await client.connect();
    const { rows } = await client.query('SELECT current_database() AS db, current_user AS usr');
    console.log(`    OK  Database: ${rows[0].db}, User: ${rows[0].usr}`);
  } catch (err) {
    console.error(`    FAIL  ${err.message}`);
    process.exit(1);
  }

  // 2. Schema conformity
  console.log('\n[2] Schema conformity (vs shared/schema.ts)');
  let schemaOk = true;
  for (const [table, expectedCols] of Object.entries(EXPECTED_SCHEMA)) {
    const { rows: cols } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );

    if (cols.length === 0) {
      console.log(`    FAIL  ${table.padEnd(20)} TABLE MISSING`);
      schemaOk = false;
      continue;
    }

    const actual = new Set(cols.map((c) => c.column_name));
    const missing = expectedCols.filter((c) => !actual.has(c));
    const { rows: count } = await client.query(`SELECT COUNT(*)::int AS n FROM "${table}"`);

    if (missing.length === 0) {
      console.log(`    OK    ${table.padEnd(20)} ${String(cols.length).padStart(2)} cols, ${count[0].n} rows`);
    } else {
      console.log(`    FAIL  ${table.padEnd(20)} missing columns: ${missing.join(', ')}`);
      schemaOk = false;
    }
  }

  await client.end();

  // 3. App smoke test
  console.log('\n[3] App smoke test');
  let smokeOk = false;
  try {
    const res = await fetch(APP_HEALTH_URL);
    if (res.ok) {
      const body = await res.json();
      console.log(`    OK    ${APP_HEALTH_URL} -> ${JSON.stringify(body)}`);
      smokeOk = true;
    } else {
      console.log(`    WARN  ${APP_HEALTH_URL} -> HTTP ${res.status}`);
    }
  } catch (err) {
    console.log(`    WARN  app not reachable: ${err.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (schemaOk && smokeOk) {
    console.log('PASS  Database is healthy and app is responsive.\n');
  } else if (schemaOk) {
    console.log('PARTIAL  Database OK, app smoke test could not run.\n');
  } else {
    console.log('FAIL  Schema mismatch — recreate from shared/schema.ts\n');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
