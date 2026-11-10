const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev_secret_change_me';

// Require a valid JWT. Sets req.userId.
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET());
    req.userId = payload.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Attach req.userId when a valid token is present, but never reject.
// Used on public reads so responses can include likedByMe / isFollowing.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET());
      req.userId = payload.id;
    } catch (err) {
      req.userId = null;
    }
  }
  return next();
}

module.exports = { auth, optionalAuth };
