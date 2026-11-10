const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName, bio } = req.body || {};
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Username, email and password are required.' });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: 'Username or email is already taken.' });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashed,
      displayName: displayName ? String(displayName).trim() : cleanUsername,
      bio: bio ? String(bio).trim() : '',
    });

    return res.status(201).json({ token: signToken(user), user: user.toPublicJSON() });
  } catch (err) {
    return res.status(500).json({ error: `Registration failed: ${err.message}` });
  }
});

// POST /api/auth/login  { email, password } or { username, password }
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const identifier = String(email || username || '').trim().toLowerCase();
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: 'Email/username and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    return res.json({ token: signToken(user), user: user.toPublicJSON() });
  } catch (err) {
    return res.status(500).json({ error: `Login failed: ${err.message}` });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: user.toPublicJSON(req.userId) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
