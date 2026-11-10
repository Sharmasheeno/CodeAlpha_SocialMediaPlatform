document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();

  const params = new URLSearchParams(window.location.search);
  const me = getCurrentUser();
  const username = params.get('username') || (me && me.username);
  const headEl = document.getElementById('profile-head');
  const postsEl = document.getElementById('profile-posts');
  const editCard = document.getElementById('edit-card');

  if (!username) {
    headEl.innerHTML = '<p class="muted">No user specified. <a href="login.html">Log in</a> to see your profile.</p>';
    return;
  }

  let profile;
  try {
    profile = await api(`/users/${encodeURIComponent(username)}`);
  } catch (err) {
    headEl.innerHTML = `<p class="muted">Could not load profile: ${escapeHtml(err.message)}</p>`;
    return;
  }

  const user = profile.user;
  const isMine = me && String(me.id) === String(user.id);

  headEl.innerHTML = `
    <div class="profile-head">
      ${avatarHtml(user, 'big')}
      <div>
        <h2>${escapeHtml(user.displayName || user.username)}</h2>
        <div class="muted">@${escapeHtml(user.username)} · joined ${new Date(user.createdAt).toLocaleDateString()}</div>
        ${user.bio ? `<p>${escapeHtml(user.bio)}</p>` : ''}
        <div class="counts">
          <span><b id="followers-count">${user.followersCount}</b> followers</span>
          <span><b>${user.followingCount}</b> following</span>
          <span><b>${profile.posts.length}</b> posts</span>
        </div>
        ${
          me && !isMine
            ? `<button class="btn small ${user.isFollowing ? 'secondary' : ''}" id="follow-btn" type="button">${user.isFollowing ? 'Following' : 'Follow'}</button>`
            : ''
        }
      </div>
    </div>`;

  const followBtn = document.getElementById('follow-btn');
  if (followBtn) {
    followBtn.addEventListener('click', async () => {
      try {
        const data = await api(`/users/${user.id}/follow`, { method: 'POST' });
        followBtn.textContent = data.following ? 'Following' : 'Follow';
        followBtn.classList.toggle('secondary', data.following);
        document.getElementById('followers-count').textContent = data.user.followersCount;
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Edit own profile
  if (isMine) {
    editCard.classList.remove('hidden');
    document.getElementById('edit-displayName').value = user.displayName || '';
    document.getElementById('edit-bio').value = user.bio || '';
    document.getElementById('edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('edit-error');
      const okBox = document.getElementById('edit-success');
      errBox.classList.add('hidden');
      okBox.classList.add('hidden');
      try {
        const data = await api('/users/me', {
          method: 'PUT',
          body: JSON.stringify({
            displayName: document.getElementById('edit-displayName').value,
            bio: document.getElementById('edit-bio').value,
          }),
        });
        // Keep the locally stored session user in sync for the navbar.
        const stored = getCurrentUser();
        if (stored) {
          stored.displayName = data.user.displayName;
          stored.bio = data.user.bio;
          localStorage.setItem('user', JSON.stringify(stored));
        }
        okBox.textContent = 'Profile updated.';
        okBox.classList.remove('hidden');
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('hidden');
      }
    });
  }

  postsEl.innerHTML = profile.posts.length
    ? profile.posts.map(postCardHtml).join('')
    : '<div class="card"><p class="muted">No posts yet.</p></div>';
  wirePostActions(postsEl);
});
