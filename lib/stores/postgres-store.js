export class PostgresMemoryStore {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  async getPool() {
    if (this.pool) {
      return this.pool;
    }

    let pgModule;
    try {
      pgModule = await import("pg");
    } catch (error) {
      throw new Error("Postgres mode requires the `pg` package. Install dependencies before using MEMORYLOOM_STORAGE_MODE=postgres.");
    }

    const { Pool } = pgModule;
    const connectionString = this.config.postgresUrl || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Postgres mode requires MEMORYLOOM_POSTGRES_URL or DATABASE_URL.");
    }

    this.pool = new Pool({
      connectionString
    });
    return this.pool;
  }

  async initialize() {
    const pool = await this.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memoryloom_memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding JSONB NOT NULL,
        importance DOUBLE PRECISION NOT NULL,
        metadata JSONB NOT NULL
      )
    `);
  }

  async list() {
    const pool = await this.getPool();
    const result = await pool.query(
      `SELECT id, content, embedding, importance, metadata
       FROM memoryloom_memories`
    );

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      embedding: Array.isArray(row.embedding) ? row.embedding : [],
      importance: Number(row.importance),
      metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {}
    }));
  }

  async replaceAll(memories) {
    const pool = await this.getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("TRUNCATE TABLE memoryloom_memories");

      for (const memory of memories) {
        await client.query(
          `INSERT INTO memoryloom_memories (id, content, embedding, importance, metadata)
           VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)`,
          [
            memory.id,
            memory.content,
            JSON.stringify(memory.embedding || []),
            memory.importance,
            JSON.stringify(memory.metadata || {})
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async status() {
    const pool = await this.getPool();
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM memoryloom_memories");
    return {
      mode: "postgres",
      postgres_url_configured: Boolean(this.config.postgresUrl || process.env.DATABASE_URL),
      memory_count: result.rows[0]?.count || 0
    };
  }

  async close() {
    if (!this.pool) {
      return;
    }
    await this.pool.end();
    this.pool = null;
  }
}
