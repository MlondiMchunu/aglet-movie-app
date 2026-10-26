require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const authRoutes = require('./routes/auth-routes');
const movieRoutes = require('./routes/movie-routes');
const favoriteRoutes = require('./routes/favorite-routes');

const app = express();
const port = Number(process.env.PORT || 3000);

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.warn('WARNING: Set SESSION_SECRET to a random string of at least 32 characters in .env.');
}

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(session({
  name: 'aglet.sid',
  secret: process.env.SESSION_SECRET || 'local-development-only-change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/favorites', favoriteRoutes);
app.get('/api/contact', (_req, res) => res.json({
  name: 'MLONDI MCHUNU',
  email: process.env.CONTACT_EMAIL || '',
  phone: process.env.CONTACT_PHONE || '',
  github: process.env.GITHUB_URL || '',
  linkedin: process.env.LINKEDIN_URL || ''
}));
app.use(express.static(path.join(__dirname, '../public')));
app.get('/favorites', (_req, res) => res.sendFile(path.join(__dirname, '../public/favorites.html')));
app.get('/contact', (_req, res) => res.sendFile(path.join(__dirname, '../public/contact.html')));
app.get('/login', (_req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error.message);
  const status = Number(error.status) || 500;
  res.status(status).json({ error: status >= 500 ? error.message : error.message });
});

app.listen(port, () => console.log(`Aglet Movie App running at http://localhost:${port}`));
