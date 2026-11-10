const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Attach comment counts to a list of populated posts.
async function withCommentCounts(posts, viewerId) {
  const ids = posts.map((p) => p._id);
  const counts = await Comment.aggregate([
    { $match: { post: { $in: ids } } },
    { $group: { _id: '$post', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return posts.map((p) => p.toPublicJSON(viewerId, map.get(String(p._id)) || 0));
}

// GET /api/posts — feed, newest first. Public; likedByMe set when logged in.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('author', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ posts: await withCommentCounts(posts, req.userId || null) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/posts — create a post { text, imageUrl? }
router.post('/', auth, async (req, res) => {
  try {
    const { text, imageUrl } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Post text is required.' });
    }
    const post = await Post.create({
      author: req.userId,
      text: String(text).trim(),
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
    });
    await post.populate('author', 'username displayName avatarUrl');
    return res.status(201).json({ post: post.toPublicJSON(req.userId, 0) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id — delete own post (and its comments).
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (String(post.author) !== String(req.userId)) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    return res.json({ message: 'Post deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/like — toggle like / unlike.
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const liked = post.likes.some((id) => String(id) === String(req.userId));
    if (liked) {
      post.likes = post.likes.filter((id) => String(id) !== String(req.userId));
    } else {
      post.likes.push(req.userId);
    }
    await post.save();
    await post.populate('author', 'username displayName avatarUrl');
    const commentsCount = await Comment.countDocuments({ post: post._id });
    return res.json({ post: post.toPublicJSON(req.userId, commentsCount) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/comments — oldest first.
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const comments = await Comment.find({ post: post._id })
      .populate('author', 'username displayName avatarUrl')
      .sort({ createdAt: 1 });
    return res.json({ comments: comments.map((c) => c.toPublicJSON()) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/:id/comments — add a comment { text }
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const comment = await Comment.create({
      post: post._id,
      author: req.userId,
      text: String(text).trim(),
    });
    await comment.populate('author', 'username displayName avatarUrl');
    return res.status(201).json({ comment: comment.toPublicJSON() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:postId/comments/:commentId — delete own comment.
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (String(comment.author) !== String(req.userId)) {
      return res.status(403).json({ error: 'You can only delete your own comments.' });
    }
    await comment.deleteOne();
    return res.json({ message: 'Comment deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
