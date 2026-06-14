import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getPool, closePool } from './pool';

async function runMigrations(): Promise<void> {
  const pool = getPool();

  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get already-applied migrations
  const { rows: applied } = await pool.query<{ filename: string }>(
    'SELECT filename FROM _migrations ORDER BY filename',
  );
  const appliedSet = new Set(applied.map((r) => r.filename));

  // Read migration files
  const migrationsDir = join(__dirname, '../../migrations');
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    console.log(`Applying migration: ${file}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err}`);
    } finally {
      client.release();
    }
  }

  console.log(`Applied ${count} migration(s).`);
  await closePool();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
