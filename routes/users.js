const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — explore / "People to follow" list, newest members first.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(50);
    return res.json({
      users: users.map((u) => u.toPublicJSON(req.userId || null)),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/me — edit own profile (display name, bio, avatar URL).
// Declared before /:username so "me" is never treated as a username.
router.put('/me', auth, async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body || {};
    const updates = {};
    if (displayName !== undefined) updates.displayName = String(displayName).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();
    if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl).trim();

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: user.toPublicJSON(req.userId) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:username — public profile plus their posts (newest first).
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({
      username: String(req.params.username).toLowerCase(),
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username displayName avatarUrl')
      .sort({ createdAt: -1 });

    const postIds = posts.map((p) => p._id);
    const counts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return res.json({
      user: user.toPublicJSON(req.userId || null),
      posts: posts.map((p) =>
        p.toPublicJSON(req.userId || null, countMap.get(String(p._id)) || 0)
      ),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/follow — toggle follow / unfollow.
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (String(targetId) === String(req.userId)) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const [me, target] = await Promise.all([
      User.findById(req.userId),
      User.findById(targetId),
    ]);
    if (!me || !target) return res.status(404).json({ error: 'User not found.' });

    const already = me.following.some((id) => String(id) === String(targetId));
    if (already) {
      me.following = me.following.filter((id) => String(id) !== String(targetId));
      target.followers = target.followers.filter(
        (id) => String(id) !== String(req.userId)
      );
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }
    await me.save();
    await target.save();

    return res.json({
      following: !already,
      user: target.toPublicJSON(req.userId),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
