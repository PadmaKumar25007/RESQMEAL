import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
});

export const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not found in environment variables. Database connection skipped.');
    return;
  }

  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`✅ PostgreSQL Connected: ${res.rows[0].now}`);
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
  }
};

// Apply the SQL schema on startup (idempotent)
export const applySchema = async () => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return;
    }
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const client = await pool.connect();
    await client.query('BEGIN');
    try {
      await client.query(schema);
      await client.query('COMMIT');
      console.log('✅ Database schema applied');
    } catch (e) {
      await client.query('ROLLBACK');
      console.log('⚠️  Database schema apply skipped/failed:', e.message);
    } finally {
      client.release();
    }
  } catch (e) {
    console.log('⚠️  No schema file found or apply failed:', e.message);
  }
};

export default connectDB;
