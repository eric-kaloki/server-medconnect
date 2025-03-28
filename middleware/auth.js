const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const token = authHeader.split(' ')[1]; // Get the token from the Authorization header
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
  } catch (err) {
    console.error('Invalid token:', err);
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  if (!decodedToken) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // Assign both id and role to the request object
  req.userId = decodedToken.id;
  req.role = decodedToken.role;

  next();
};

module.exports = authMiddleware;