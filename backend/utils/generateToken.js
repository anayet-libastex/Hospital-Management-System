import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a user.
 * @param {Object} user - User object (must contain id, role, email)
 * @param {string} expiresIn - Token expiration (default: '7d')
 * @returns {string} JWT token
 */
const generateToken = (user, expiresIn = '7d') => {
  if (!user || !user._id || !user.role) {
    throw new Error('Invalid user object: missing id or role');
  }

  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export default generateToken;