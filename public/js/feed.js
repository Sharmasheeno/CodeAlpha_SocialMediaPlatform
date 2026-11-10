document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();

  const me = getCurrentUser();
  const composer = document.getElementById('composer');
  const loginPrompt = document.getElementById('login-prompt');
  if (me) {
    composer.classList.remove('hidden');
  } else {
    loginPrompt.classList.remove('hidden');
  }

  const postForm = document.getElementById('post-form');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = document.getElementById('post-text').value;
      const imageUrl = document.getElementById('post-image').value;
      const errBox = document.getElementById('post-error');
      errBox.classList.add('hidden');
      try {
        await api('/posts', {
          method: 'POST',
          body: JSON.stringify({ text, imageUrl }),
        });
        window.location.reload();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('hidden');
      }
    });
  }

  // Feed
  const feedEl = document.getElementById('feed');
  try {
    const { posts } = await api('/posts');
    feedEl.innerHTML = posts.length
      ? posts.map(postCardHtml).join('')
      : '<div class="card"><p class="muted">No posts yet. Be the first to post!</p></div>';
    wirePostActions(feedEl);
  } catch (err) {
    feedEl.innerHTML = `<div class="card"><p class="muted">Could not load the feed: ${escapeHtml(err.message)}</p></div>`;
  }

  // People to follow
  const peopleEl = document.getElementById('people-list');
  try {
    const { users } = await api('/users');
    const others = users.filter((u) => !me || String(u.id) !== String(me.id));
    peopleEl.innerHTML = others.length
      ? others
          .slice(0, 8)
          .map(
            (u) => `
          <div class="person">
            ${avatarHtml(u)}
            <div class="person-info">
              <a class="name" href="profile.html?username=${encodeURIComponent(u.username)}">${escapeHtml(u.displayName || u.username)}</a>
              <span class="handle">@${escapeHtml(u.username)} · ${u.followersCount} followers</span>
            </div>
            ${
              me
                ? `<button class="btn small ${u.isFollowing ? 'secondary' : ''} follow-btn" data-user-id="${u.id}" type="button">${u.isFollowing ? 'Following' : 'Follow'}</button>`
                : ''
            }
          </div>`
          )
          .join('')
      : '<p class="muted">No other users yet.</p>';

    peopleEl.querySelectorAll('.follow-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const data = await api(`/users/${btn.getAttribute('data-user-id')}/follow`, {
            method: 'POST',
          });
          btn.textContent = data.following ? 'Following' : 'Follow';
          btn.classList.toggle('secondary', data.following);
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    peopleEl.innerHTML = `<p class="muted">Could not load people: ${escapeHtml(err.message)}</p>`;
  }
});
