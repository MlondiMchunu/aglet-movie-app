require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../config/database');

(async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema created/verified successfully.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
