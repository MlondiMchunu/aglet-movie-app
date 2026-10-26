const express = require('express');
const pool = require('../config/database');
const requireAuth = require('../middleware/require-auth');
const { getMovieDetails } = require('../services/tmdb-service');
const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT tmdb_movie_id AS id, title, poster_path, release_date, created_at
       FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.session.user.id]
    );
    res.json({ results: result.rows });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.body.movieId, 10);
    if (!Number.isInteger(movieId) || movieId <= 0) return res.status(400).json({ error: 'A valid movie ID is required.' });
    const movie = await getMovieDetails(movieId);
    const result = await pool.query(
      `INSERT INTO favorites (user_id, tmdb_movie_id, title, poster_path, release_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, tmdb_movie_id) DO NOTHING
       RETURNING tmdb_movie_id AS id, title, poster_path, release_date`,
      [req.session.user.id, movie.id, movie.title, movie.poster_path, movie.release_date || null]
    );
    res.status(result.rowCount ? 201 : 200).json({ success: true, alreadySaved: !result.rowCount });
  } catch (error) { next(error); }
});

router.delete('/:movieId', async (req, res, next) => {
  try {
    const movieId = Number.parseInt(req.params.movieId, 10);
    if (!Number.isInteger(movieId) || movieId <= 0) return res.status(400).json({ error: 'A valid movie ID is required.' });
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND tmdb_movie_id = $2', [req.session.user.id, movieId]);
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
