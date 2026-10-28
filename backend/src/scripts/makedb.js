import { Client } from 'pg';

const c = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
await c.connect();
const res = await c.query(`SELECT datname FROM pg_database`);
console.log('EXISTING', res.rows.map((r) => r.datname));
const created = await c.query(`CREATE DATABASE resqmeal`);
console.log('CREATED', created);
await c.end();

const c2 = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/resqmeal' });
await c2.connect();
const tables = await c2.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
console.log('TABLES_AFTER_CREATE', tables.rows.map((r) => r.table_name));
await c2.end();
process.exit(0);
