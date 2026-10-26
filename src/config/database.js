const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

function getPoolConfig() {
  if (!process.env.DATABASE_URL) {
    return {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'movies',
      user: process.env.PGUSER || 'aglet_app',
      password: process.env.PGPASSWORD || ''
    };
  }

  const connectionUrl = new URL(process.env.DATABASE_URL);
  const caPath = process.env.PGSSLROOTCERT || path.join(__dirname, '../../ca.pem');
  const ca = fs.readFileSync(caPath, 'utf8');

  for (const parameter of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword']) {
    connectionUrl.searchParams.delete(parameter);
  }

  return {
    connectionString: connectionUrl.toString(),
    ssl: { ca, rejectUnauthorized: true }
  };
}

const pool = new Pool(getPoolConfig());

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;
