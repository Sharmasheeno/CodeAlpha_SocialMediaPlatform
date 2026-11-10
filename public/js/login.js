document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  if (getCurrentUser()) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('login-error');
    errBox.classList.add('hidden');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('identifier').value,
          password: document.getElementById('password').value,
        }),
      });
      setSession(data.token, data.user);
      window.location.href = 'index.html';
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
    }
  });
});
