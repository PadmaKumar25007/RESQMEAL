import 'dotenv/config';
import { pool } from '../db/index.js';

const res = await pool.query(`
  SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
`);

for (const t of res.rows) {
  console.log(`${t.table_name}.${t.column_name} ${t.data_type} nullable=${t.is_nullable} default=${t.column_default}`);
}

const tables = await pool.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
`);
console.log('TABLES', tables.rows.map((r) => r.table_name));
process.exit(0);
