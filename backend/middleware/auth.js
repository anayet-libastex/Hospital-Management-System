import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches decoded user info to req.user
 */
const auth = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Check if Bearer scheme is used
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7, authHeader.length) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ msg: 'Token missing or malformed' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to request object
    req.user = decoded; // { id, role, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    return res.status(401).json({ msg: 'Authentication failed' });
  }
};

export default auth;