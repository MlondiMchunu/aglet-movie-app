const grid = document.querySelector('#movie-grid');
const message = document.querySelector('#message');
const pagination = document.querySelector('#pagination');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const suggestions = document.querySelector('#suggestions');
let currentPage = 1;
let searchMode = false;
let searchTimer;
const posterUrl = (path) => path ? `https://image.tmdb.org/t/p/w500${path}` : '';
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function showMessage(text = '', isError = false) { message.textContent = text; message.classList.toggle('error', isError); }
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
function card(movie) {
  const poster = posterUrl(movie.poster_path);
  return `<article class="movie-card"><button class="poster-button" data-details="${movie.id}" aria-label="View details for ${escapeHtml(movie.title)}">${poster ? `<img class="poster" src="${poster}" alt="Poster for ${escapeHtml(movie.title)}" loading="lazy">` : '<div class="poster poster-placeholder">NO POSTER</div>'}<span class="poster-overlay">View details ↗</span></button><div class="movie-meta"><div><h3>${escapeHtml(movie.title)}</h3><p>${movie.release_date ? escapeHtml(movie.release_date.slice(0,10)) : 'Release date unavailable'}</p></div><button class="favorite-button" data-favorite="${movie.id}" aria-label="Add ${escapeHtml(movie.title)} to favourites" title="Add to favourites">♡</button></div></article>`;
}
async function loadPage(page = 1) {
  searchMode = false; currentPage = page; showMessage('Loading movies…'); grid.innerHTML = ''; pagination.innerHTML = ''; document.querySelector('#section-title').innerHTML = 'Popular right now <span class="heading-count">/ 45</span>';
  try { const data = await api(`/api/movies?page=${page}`); grid.innerHTML = data.results.map(card).join(''); renderPagination(data.page); showMessage(data.results.length ? '' : 'No movies returned.'); }
  catch (error) { showMessage(error.message, true); }
}
function renderPagination(page) {
  pagination.innerHTML = `<button class="page-arrow" data-page="${Math.max(1,page-1)}" ${page===1?'disabled':''} aria-label="Previous page">←</button>${[1,2,3,4,5].map(n=>`<button class="page-number ${n===page?'selected':''}" data-page="${n}" ${n===page?'aria-current="page"':''}>${String(n).padStart(2,'0')}</button>`).join('')}<button class="page-arrow" data-page="${Math.min(5,page+1)}" ${page===5?'disabled':''} aria-label="Next page">→</button><span class="page-label">PAGE ${page} OF 5</span>`;
}
async function runSearch(query) {
  if (query.trim().length < 2) return;
  searchMode = true; pagination.innerHTML = ''; showMessage('Searching…'); grid.innerHTML = '';
  try { const data = await api(`/api/movies/search?query=${encodeURIComponent(query.trim())}`); document.querySelector('#section-title').textContent = `Search results for “${query.trim()}”`; grid.innerHTML = data.results.map(card).join(''); showMessage(data.results.length ? `${data.results.length} results shown (maximum 9).` : 'No matching movies found.'); }
  catch (error) { showMessage(error.message, true); }
}
searchForm?.addEventListener('submit', (event) => { event.preventDefault(); suggestions.hidden = true; runSearch(searchInput.value); });
searchInput?.addEventListener('input', () => {
  clearTimeout(searchTimer); const query = searchInput.value.trim();
  if (query.length < 2) { suggestions.hidden = true; if (!query && searchMode) loadPage(1); return; }
  searchTimer = setTimeout(async () => { try { const data = await api(`/api/movies/search?query=${encodeURIComponent(query)}`); suggestions.innerHTML = data.results.slice(0,5).map(movie=>`<button type="button" data-suggestion="${escapeHtml(movie.title)}">${escapeHtml(movie.title)} <span>${movie.release_date ? movie.release_date.slice(0,4) : ''}</span></button>`).join(''); suggestions.hidden = !data.results.length; } catch { suggestions.hidden = true; } }, 300);
});
suggestions?.addEventListener('click', (event) => { const button = event.target.closest('[data-suggestion]'); if (!button) return; searchInput.value = button.dataset.suggestion; suggestions.hidden = true; runSearch(searchInput.value); });
document.addEventListener('click', async (event) => {
  const pageButton = event.target.closest('[data-page]');
  if (pageButton && !pageButton.disabled) return loadPage(Number(pageButton.dataset.page));
  const favButton = event.target.closest('[data-favorite]');
  if (favButton) { try { await api('/api/favorites', { method:'POST', body: JSON.stringify({ movieId: Number(favButton.dataset.favorite) }) }); favButton.classList.add('saved'); favButton.textContent='♥'; showMessage('Added to your favourites.'); } catch (error) { showMessage(error.message.includes('log in') ? 'Please log in before adding favourites.' : error.message, true); if (error.message.includes('log in')) location.href='/login'; } return; }
  const detailButton = event.target.closest('[data-details]'); if (detailButton) openDetails(detailButton.dataset.details);
});
async function openDetails(id) {
  const dialog = document.querySelector('#movie-dialog'); const details = document.querySelector('#movie-details'); details.innerHTML='<p class="muted">Loading details…</p>'; dialog.showModal();
  try { const movie = await api(`/api/movies/${id}`); details.innerHTML=`<div class="detail-layout">${movie.poster_path ? `<img src="${posterUrl(movie.poster_path)}" alt="Poster for ${escapeHtml(movie.title)}">` : ''}<div><div class="eyebrow">MOVIE DETAILS</div><h2>${escapeHtml(movie.title)}</h2><p class="detail-date">${movie.release_date ? escapeHtml(movie.release_date) : 'Release date unavailable'}${movie.vote_average ? ` · ★ ${Number(movie.vote_average).toFixed(1)}` : ''}</p><p>${escapeHtml(movie.overview || 'No overview is available for this movie.')}</p><button class="primary-button" data-favorite="${movie.id}">♡ Add to favourites</button></div></div>`; }
  catch (error) { details.innerHTML=`<p class="error">${escapeHtml(error.message)}</p>`; }
}
document.querySelector('#dialog-close')?.addEventListener('click',()=>document.querySelector('#movie-dialog').close());
document.querySelector('#movie-dialog')?.addEventListener('click',(event)=>{if(event.target.id==='movie-dialog') event.target.close();});
(async()=>{try{const data=await api('/api/auth/me');const link=document.querySelector('#auth-link');if(link&&data.user){link.textContent='Log out';link.href='#';link.addEventListener('click',async(e)=>{e.preventDefault();await api('/api/auth/logout',{method:'POST'});location.reload();});}}catch{} loadPage(1);})();
