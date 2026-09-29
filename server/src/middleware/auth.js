const { admin } = require('../config/firebase');

/**
 * Express middleware that validates a Firebase ID token from the
 * Authorization header and attaches the decoded UID to req.uid.
 *
 * Responds with 401 if the header is missing or the token is invalid.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

module.exports = { verifyToken };
