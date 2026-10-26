require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/database');

(async () => {
  try {
    const passwordHash = await bcrypt.hash('@TeamAglet', 12);
    await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password`,
      ['jointheteam', 'jointheteam@aglet.co.za', passwordHash]
    );
    console.log('Assessment user seeded. Username: jointheteam');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
