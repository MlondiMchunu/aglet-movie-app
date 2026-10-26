const BASE_URL = 'https://api.themoviedb.org/3';

async function tmdbRequest(path) {
  if (!process.env.TMDB_ACCESS_TOKEN) {
    const error = new Error('TMDB_ACCESS_TOKEN is not configured. Add your TMDB API Read Access Token to .env.');
    error.status = 503;
    throw error;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const error = new Error(`TMDB request failed with status ${response.status}. Check your API token and TMDB access.`);
    error.status = response.status === 401 ? 502 : response.status;
    throw error;
  }
  return response.json();
}

async function getMoviePage(page = 1) {
  // TMDB returns 20 movies per API page. Map the app's 9-card pages onto TMDB pages.
  const appPage = Math.min(5, Math.max(1, Number.parseInt(page, 10) || 1));
  const firstIndex = (appPage - 1) * 9;
  const tmdbPage = Math.floor(firstIndex / 20) + 1;
  const offset = firstIndex % 20;
  const data = await tmdbRequest(`/movie/popular?language=en-US&page=${tmdbPage}`);
  const results = data.results.slice(offset, offset + 9);
  return {
    page: appPage,
    totalPages: 5,
    totalResults: 45,
    results: results.map(normalizeMovie)
  };
}

async function searchMovies(query) {
  const data = await tmdbRequest(`/search/movie?include_adult=false&language=en-US&page=1&query=${encodeURIComponent(query)}`);
  return data.results.slice(0, 9).map(normalizeMovie);
}

async function getMovieDetails(id) {
  const data = await tmdbRequest(`/movie/${encodeURIComponent(id)}?language=en-US`);
  return normalizeMovie(data);
}

function normalizeMovie(movie) {
  return {
    id: movie.id,
    title: movie.title || 'Untitled',
    overview: movie.overview || '',
    release_date: movie.release_date || null,
    poster_path: movie.poster_path || null,
    vote_average: movie.vote_average ?? null,
    backdrop_path: movie.backdrop_path || null
  };
}

module.exports = { getMoviePage, searchMovies, getMovieDetails };
