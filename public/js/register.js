document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  if (getCurrentUser()) {
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('register-error');
    errBox.classList.add('hidden');
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('username').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          displayName: document.getElementById('displayName').value,
          bio: document.getElementById('bio').value,
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
