// Shared helpers for all pages.
const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch (e) {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function avatarHtml(user, cls = '') {
  const name = (user && (user.displayName || user.username)) || '?';
  const initial = escapeHtml(name.charAt(0).toUpperCase());
  if (user && user.avatarUrl) {
    return `<div class="avatar ${cls}"><img src="${escapeHtml(user.avatarUrl)}" alt=""></div>`;
  }
  return `<div class="avatar ${cls}">${initial}</div>`;
}

// Renders the top navigation bar into #navbar.
function renderNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;
  const user = getCurrentUser();
  const links = user
    ? `<a href="index.html">Feed</a>
       <a href="profile.html?username=${encodeURIComponent(user.username)}">My profile</a>
       <span class="who">@${escapeHtml(user.username)}</span>
       <a href="#" id="logout-link">Log out</a>`
    : `<a href="index.html">Feed</a>
       <a href="login.html">Log in</a>
       <a href="register.html">Register</a>`;
  el.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="index.html">Social<span>Sphere</span></a>
      <div class="nav-links">${links}</div>
    </div>`;
  const logout = document.getElementById('logout-link');
  if (logout) {
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = 'login.html';
    });
  }
}

// Builds the HTML for one post card, including comments section.
function postCardHtml(post) {
  const me = getCurrentUser();
  const author = post.author || {};
  const isMine = me && String(me.id) === String(author.id);
  const comments = (post.comments || [])
    .map(
      (c) => `
      <div class="comment">
        ${avatarHtml(c.author)}
        <div class="comment-body">
          <a class="post-author" href="profile.html?username=${encodeURIComponent(c.author.username)}">${escapeHtml(c.author.displayName || c.author.username)}</a>
          <span class="post-meta">${timeAgo(c.createdAt)}</span>
          <div>${escapeHtml(c.text)}</div>
        </div>
      </div>`
    )
    .join('');

  return `
  <article class="card post" data-post-id="${post.id}">
    <div class="post-head">
      ${avatarHtml(author)}
      <div>
        <a class="post-author" href="profile.html?username=${encodeURIComponent(author.username)}">${escapeHtml(author.displayName || author.username)}</a>
        <div class="post-meta">@${escapeHtml(author.username)} · ${timeAgo(post.createdAt)}</div>
      </div>
    </div>
    <p class="post-text">${escapeHtml(post.text)}</p>
    ${post.imageUrl ? `<img class="post-image" src="${escapeHtml(post.imageUrl)}" alt="Post image">` : ''}
    <div class="post-actions">
      <button class="action-btn like-btn ${post.likedByMe ? 'liked' : ''}" type="button">${post.likedByMe ? '❤️' : '🤍'} <span class="like-count">${post.likesCount}</span></button>
      <button class="action-btn comment-toggle" type="button">💬 <span class="comment-count">${post.commentsCount}</span></button>
      ${isMine ? '<button class="action-btn delete-btn" type="button">Delete</button>' : ''}
    </div>
    <div class="comments hidden">
      <div class="comment-list">${comments || '<p class="muted">No comments yet.</p>'}</div>
      ${
        me
          ? `<form class="comment-form">
               <input type="text" placeholder="Write a comment..." maxlength="500" required>
               <button class="btn small" type="submit">Comment</button>
             </form>`
          : '<p class="muted"><a href="login.html">Log in</a> to comment.</p>'
      }
    </div>
  </article>`;
}

// Wires like / comment / delete interactions inside a container element.
// onChange: optional callback re-run after a mutation (defaults to reload).
function wirePostActions(container, onChange) {
  const refresh = onChange || (() => window.location.reload());

  container.querySelectorAll('.post').forEach((card) => {
    const postId = card.getAttribute('data-post-id');
    if (!postId) return;

    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', async () => {
        if (!getToken()) return (window.location.href = 'login.html');
        try {
          const { post } = await api(`/posts/${postId}/like`, { method: 'POST' });
          likeBtn.classList.toggle('liked', post.likedByMe);
          likeBtn.innerHTML = `${post.likedByMe ? '❤️' : '🤍'} <span class="like-count">${post.likesCount}</span>`;
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const commentsBox = card.querySelector('.comments');
    const toggle = card.querySelector('.comment-toggle');
    if (toggle && commentsBox) {
      toggle.addEventListener('click', async () => {
        const opening = commentsBox.classList.contains('hidden');
        commentsBox.classList.toggle('hidden');
        if (opening && !commentsBox.dataset.loaded) {
          commentsBox.dataset.loaded = '1';
          try {
            const { comments } = await api(`/posts/${postId}/comments`);
            const list = commentsBox.querySelector('.comment-list');
            if (list) {
              list.innerHTML = comments.length
                ? comments
                    .map(
                      (c) => `
                    <div class="comment">
                      ${avatarHtml(c.author)}
                      <div class="comment-body">
                        <a class="post-author" href="profile.html?username=${encodeURIComponent(c.author.username)}">${escapeHtml(c.author.displayName || c.author.username)}</a>
                        <span class="post-meta">${timeAgo(c.createdAt)}</span>
                        <div>${escapeHtml(c.text)}</div>
                      </div>
                    </div>`
                    )
                    .join('')
                : '<p class="muted">No comments yet.</p>';
            }
          } catch (err) {
            /* leave placeholder in place */
          }
        }
      });
    }

    const form = card.querySelector('.comment-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input');
        try {
          await api(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text: input.value }),
          });
          refresh();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    const del = card.querySelector('.delete-btn');
    if (del) {
      del.addEventListener('click', async () => {
        if (!confirm('Delete this post?')) return;
        try {
          await api(`/posts/${postId}`, { method: 'DELETE' });
          refresh();
        } catch (err) {
          alert(err.message);
        }
      });
    }
  });
}
