const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD != null ? String(process.env.PGPASSWORD) : undefined,
  database: process.env.PGDATABASE,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  healthCheck: async () => {
    const result = await pool.query('SELECT 1 AS ok');
    return result?.rows?.[0]?.ok === 1;
  },
  pool,
};
