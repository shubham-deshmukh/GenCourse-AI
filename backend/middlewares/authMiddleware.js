import User from '../models/User.js';

/**
 * Middleware to protect routes, perform Just-in-Time user provisioning,
 * and support mock user authentication during local development.
 */
export const protect = async (req, res, next) => {
  const isMockMode = process.env.NODE_ENV === 'development' && 
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

  // Use Auth0 session details
  if (!req.oidc || !req.oidc.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authorized, please log in' });
  }

  try {
    const auth0User = req.oidc.user;
    if (!auth0User || !auth0User.sub) {
      return res.status(401).json({ message: 'Invalid session profile' });
    }

    // Find or create user document (Just-in-Time Provisioning)
    let user = await User.findOne({ auth0Sub: auth0User.sub });
    if (!user) {
      user = await User.create({
        name: auth0User.name || auth0User.nickname || 'Authenticated User',
        email: auth0User.email || '',
        picture: auth0User.picture || '',
        auth0Sub: auth0User.sub,
        role: 'student' // Default role for standard provisioned users
      });
      console.log(`👤 JIT Provisioned new user profile: ${user.email} (${user._id})`);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error);
    res.status(500).json({ message: 'Authentication verification failed' });
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
