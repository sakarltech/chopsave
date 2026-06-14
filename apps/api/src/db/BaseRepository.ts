import { Pool, QueryResult, QueryResultRow } from 'pg';
import { getPool } from './pool';

export class BaseRepository {
  protected pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  protected async query<T extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(sql, params);
  }

  protected async queryOne<T extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<T | null> {
    const result = await this.pool.query<T>(sql, params);
    return result.rows[0] ?? null;
  }

  protected async queryMany<T extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(sql, params);
    return result.rows;
  }

  protected async execute(sql: string, params?: unknown[]): Promise<void> {
    await this.pool.query(sql, params);
  }

  /**
   * Run a callback within a database transaction.
   * Automatically commits on success and rolls back on error.
   */
  protected async withTransaction<T>(
    callback: (client: import('pg').PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
