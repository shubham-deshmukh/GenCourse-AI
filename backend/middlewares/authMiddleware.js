import User from '../models/User.js';
import { getEnv } from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to protect routes, perform Just-in-Time user provisioning,
 * and support mock user authentication during local development.
 */
export const protect = async (req, res, next) => {
  const isMockMode = getEnv('NODE_ENV', 'development') === 'development' && 
    (req.headers['x-mock-user'] === 'true' || req.query.mockUser === 'true');


  if (isMockMode) {
    try {
      // Find or create the standard mock user in the database
      let user = await User.findOne({ auth0Sub: 'mock-auth-sub-id' });
      if (!user) {
        user = await User.create({
          name: 'Mock Developer',
          email: 'developer@example.com',
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
          auth0Sub: 'mock-auth-sub-id',
          role: 'admin' // Grant admin rights to the mock user for full system testing
        });
        console.log(`👤 Created mock developer user: ${user.email} (${user._id})`);
      }
      req.user = user;
      return next();
    } catch (err) {
      console.error('Error in mock authentication:', err);
      return res.status(500).json({ message: 'Mock authentication failed' });
    }
  }

  // Use JWT token validation
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      // Decode and verify token
      const decoded = verifyToken(token);

      // Fetch user profile from database
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user profile not found' });
      }

      return next();
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, authorization token is missing' });
  }
};


/**
 * Middleware to restrict route access to specific roles.
 * Must be applied after the `protect` middleware.
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Requires one of the following roles: [${roles.join(', ')}]` 
      });
    }

    next();
  };
};
