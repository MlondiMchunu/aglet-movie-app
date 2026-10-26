const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) return res.status(400).json({ error: 'Enter your username/email and password.' });

    const result = await pool.query(
      'SELECT id, username, email, password FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [username]
    );
    let user = null;
    for (const candidate of result.rows) {
      const hasBcryptHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(candidate.password);
      const passwordMatches = hasBcryptHash
        ? await bcrypt.compare(password, candidate.password)
        : password === candidate.password;

      if (!passwordMatches) continue;

      if (hasBcryptHash) {
        user = candidate;
        break;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const migrated = await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2 AND password = $3',
        [passwordHash, candidate.id, candidate.password]
      );
      if (migrated.rowCount === 1) {
        user = candidate;
        break;
      }
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.user = { id: user.id, username: user.username, email: user.email };
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.json({ user: req.session.user });
      });
    });
  } catch (error) { next(error); }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('aglet.sid');
    res.json({ success: true });
  });
});

module.exports = router;
