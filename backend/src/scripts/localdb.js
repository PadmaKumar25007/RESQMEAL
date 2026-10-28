import { Client } from 'pg';

const candidates = [
  'postgresql://postgres:postgres@localhost:5432/postgres',
  'postgresql://postgres@localhost:5432/postgres',
  'postgresql://resqmeal:resqmeal@localhost:5432/resqmeal',
];

for (const url of candidates) {
  try {
    const c = new Client({ connectionString: url });
    await c.connect();
    const res = await c.query('SELECT version()');
    console.log('CONNECTED', url, res.rows[0].version);
    const dbs = await c.query('SELECT datname FROM pg_database');
    console.log('DATABASES', dbs.rows.map((r) => r.datname));
    const tables = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
    console.log('TABLES', tables.rows.map((r) => r.table_name));
    await c.end();
    break;
  } catch (e) {
    console.log('FAILED', url, e.message);
  }
}
process.exit(0);
