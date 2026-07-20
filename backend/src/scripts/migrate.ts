import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { db } from '../db/index.js';

const MIGRATION_FILE_RE = /^\d+_[a-z0-9_\-]+\.sql$/i;
const ADVISORY_LOCK_KEY = 73494610;
const LEGACY_BASELINE_MAX = 13;

async function migrationDirectory(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../migrations');
}

async function ensureMigrationTable(client: PoolClient): Promise<void> {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

function migrationNumber(filename: string): number {
  const match = filename.match(/^(\d+)_/);
  return match ? Number(match[1]) : Number.NaN;
}

async function bootstrapLegacyHistory(client: PoolClient, filenames: string[]): Promise<void> {
  const { rows: historyRows } = await client.query<{ count: string }>(
    'select count(*)::text as count from schema_migrations',
  );
  if (Number(historyRows[0]?.count ?? 0) > 0) return;

  const { rows } = await client.query<{ exists: boolean }>(
    `select to_regclass('public.users') is not null as exists`,
  );
  const hasExistingSigfloSchema = rows[0]?.exists ?? false;
  if (!hasExistingSigfloSchema) return;

  const legacyFiles = filenames.filter((filename) => {
    const n = migrationNumber(filename);
    return Number.isFinite(n) && n <= LEGACY_BASELINE_MAX;
  });

  for (const filename of legacyFiles) {
    await client.query(
      `insert into schema_migrations (filename) values ($1) on conflict (filename) do nothing`,
      [filename],
    );
  }

  if (legacyFiles.length > 0) {
    console.log(
      `[migrate] Existing Sigflo schema detected; baselined ${legacyFiles.length} legacy migrations through ${String(LEGACY_BASELINE_MAX).padStart(3, '0')}.`,
    );
  }
}

async function run(): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('select pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    const dir = await migrationDirectory();
    const filenames = (await readdir(dir))
      .filter((name) => MIGRATION_FILE_RE.test(name))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

    await ensureMigrationTable(client);
    await bootstrapLegacyHistory(client, filenames);

    const { rows } = await client.query<{ filename: string }>(
      'select filename from schema_migrations order by filename',
    );
    const applied = new Set(rows.map((row) => row.filename));
    const pending = filenames.filter((filename) => !applied.has(filename));

    if (pending.length === 0) {
      console.log('[migrate] Database is up to date.');
      return;
    }

    for (const filename of pending) {
      const sql = await readFile(path.join(dir, filename), 'utf8');
      console.log(`[migrate] Applying ${filename}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (filename) values ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`[migrate] Applied ${filename}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(
          `Migration ${filename} failed: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    }
  } finally {
    try {
      await client.query('select pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    } catch {
      // Connection teardown will release the advisory lock if this fails.
    }
    client.release();
    await db.end();
  }
}

run().catch((error) => {
  console.error('[migrate]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
