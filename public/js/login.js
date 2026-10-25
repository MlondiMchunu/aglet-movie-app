const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');
form.addEventListener('submit', async (event) => {
  event.preventDefault(); message.textContent = 'Signing in…'; message.classList.remove('error');
  try {
    const response = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin', body:JSON.stringify({username:document.querySelector('#username').value, password:document.querySelector('#password').value}) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to log in.');
    location.href = '/favorites';
  } catch(error) { message.textContent = error.message; message.classList.add('error'); }
});
