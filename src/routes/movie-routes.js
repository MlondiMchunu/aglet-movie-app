const express = require('express');
const { getMoviePage, searchMovies, getMovieDetails } = require('../services/tmdb-service');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try { res.json(await getMoviePage(req.query.page)); }
  catch (error) { next(error); }
});

router.get('/search', async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim();
    if (query.length < 2) return res.status(400).json({ error: 'Enter at least two characters to search.' });
    res.json({ results: await searchMovies(query) });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await getMovieDetails(req.params.id)); }
  catch (error) { next(error); }
});

module.exports = router;
