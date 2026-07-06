import test, { after } from 'node:test';
import assert from 'node:assert';
import { protect, requireRole } from '../authMiddleware.js';
import authRouter from '../../routes/authRoutes.js';
import User from '../../models/User.js';
import { signToken } from '../../utils/jwt.js';
import jwt from 'jsonwebtoken';

// Mock database operations to avoid connecting to MongoDB
const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalFindById = User.findById;

after(() => {
  User.findOne = originalFindOne;
  User.create = originalCreate;
  User.findById = originalFindById;
});

// Mock user store in memory
const mockDb = {
  users: {
    'user-student-123': { _id: 'user-student-123', name: 'Student User', role: 'student', email: 'student@example.com' },
    'user-admin-456': { _id: 'user-admin-456', name: 'Admin User', role: 'admin', email: 'admin@example.com' }
  }
};

User.findById = async (id) => {
  return mockDb.users[id] || null;
};

// ----------------------------------------------------
// 1. Auth Middleware (protect & requireRole) Tests
// ----------------------------------------------------

test('Auth Middleware - Mock Developer Mode (Development Only)', async () => {
  User.findOne = async (query) => {
    if (query.auth0Sub === 'mock-auth-sub-id') {
      return { _id: 'mock-dev-id', name: 'Mock Developer', role: 'admin', email: 'developer@example.com' };
    }
    return null;
  };

  const req = {
    headers: { 'x-mock-user': 'true' },
    query: {}
  };
  const res = {};
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, true);
  assert.ok(req.user);
  assert.strictEqual(req.user.name, 'Mock Developer');
  assert.strictEqual(req.user.role, 'admin');
});

test('Auth Middleware - Valid Cookie Authentication', async () => {
  const token = signToken({ id: 'user-student-123', email: 'student@example.com', role: 'student' });

  const req = {
    cookies: { gencourse_token: token },
    headers: {},
    query: {}
  };
  const res = {};
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, true);
  assert.ok(req.user);
  assert.strictEqual(req.user._id, 'user-student-123');
  assert.strictEqual(req.user.role, 'student');
});

test('Auth Middleware - Missing Token (401 Unauthorized)', async () => {
  const req = {
    cookies: {},
    headers: {},
    query: {}
  };

  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status: function(code) {
      statusCode = code;
      return this;
    },
    json: function(data) {
      jsonResponse = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusCode, 401);
  assert.ok(jsonResponse.message.includes('authorization token is missing'));
});

test('Auth Middleware - Expired or Invalid Token (401 Unauthorized)', async () => {
  const req = {
    cookies: { gencourse_token: 'invalid-malformed-expired-token' },
    headers: {},
    query: {}
  };

  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status: function(code) {
      statusCode = code;
      return this;
    },
    json: function(data) {
      jsonResponse = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusCode, 401);
  assert.ok(jsonResponse.message.includes('invalid or expired token'));
});

test('Auth Middleware - Role Authorization requireRole (Access Granted)', () => {
  const req = {
    user: { role: 'admin' }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(['admin']);
  middleware(req, {}, next);

  assert.strictEqual(nextCalled, true);
});

test('Auth Middleware - Role Authorization requireRole (Access Denied - 403 Forbidden)', () => {
  const req = {
    user: { role: 'student' }
  };

  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status: function(code) {
      statusCode = code;
      return this;
    },
    json: function(data) {
      jsonResponse = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(['admin', 'instructor']);
  middleware(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusCode, 403);
  assert.ok(jsonResponse.message.includes('Forbidden'));
});

// ----------------------------------------------------
// 2. Auth Routes (State & PKCE flow) Tests
// ----------------------------------------------------

test('Auth Routes - GET /auth/login generates PKCE and CSRF cookies', () => {
  const loginRoute = authRouter.stack.find(s => s.route?.path === '/login');
  const loginHandler = loginRoute.route.stack[0].handle;

  const cookiesSet = {};
  let redirectedUrl = null;

  const req = {
    protocol: 'http',
    get: (header) => {
      if (header === 'host') return 'localhost:5000';
      return '';
    }
  };

  const res = {
    cookie: function(name, value, options) {
      cookiesSet[name] = { value, options };
      return this;
    },
    redirect: function(url) {
      redirectedUrl = url;
      return this;
    }
  };

  loginHandler(req, res);

  // Assert that PKCE verifier and CSRF state cookies are set
  assert.ok(cookiesSet['auth_code_verifier']);
  assert.ok(cookiesSet['auth_state']);
  
  const verifierOptions = cookiesSet['auth_code_verifier'].options;
  assert.strictEqual(verifierOptions.httpOnly, true);
  assert.strictEqual(verifierOptions.sameSite, 'lax');

  const stateOptions = cookiesSet['auth_state'].options;
  assert.strictEqual(stateOptions.httpOnly, true);
  assert.strictEqual(stateOptions.sameSite, 'lax');

  // Verify the redirected authorize URL contains state query parameter matching the cookie
  const parsedUrl = new URL(redirectedUrl);
  assert.strictEqual(parsedUrl.searchParams.get('state'), cookiesSet['auth_state'].value);
  assert.strictEqual(parsedUrl.searchParams.get('response_type'), 'code');
  assert.strictEqual(parsedUrl.searchParams.get('prompt'), 'login');
  assert.ok(parsedUrl.searchParams.get('code_challenge'));
});

test('Auth Routes - GET /auth/callback CSRF State Mismatch Failure', async () => {
  const callbackRoute = authRouter.stack.find(s => s.route?.path === '/callback');
  const callbackHandler = callbackRoute.route.stack[0].handle;

  let redirectedUrl = null;
  const cookiesCleared = {};

  const req = {
    query: {
      code: 'auth-code-789',
      state: 'mismatched-state-value'
    },
    cookies: {
      auth_code_verifier: 'pkce-verifier-abc',
      auth_state: 'correct-state-value'
    }
  };

  const res = {
    clearCookie: function(name, options) {
      cookiesCleared[name] = options;
      return this;
    },
    redirect: function(url) {
      redirectedUrl = url;
      return this;
    }
  };

  await callbackHandler(req, res);

  // Assert cookies were cleared immediately for safety
  assert.ok(cookiesCleared['auth_code_verifier']);
  assert.ok(cookiesCleared['auth_state']);

  // Assert redirect to frontend with CSRF verification failure error
  assert.ok(redirectedUrl);
  assert.ok(decodeURIComponent(redirectedUrl).includes('CSRF state verification failed'));
});

test('Auth Middleware - Invalid Token Signature (401 Unauthorized)', async () => {
  // Sign a JWT with a completely different secret key
  const badToken = jwt.sign(
    { id: 'user-student-123', email: 'student@example.com', role: 'student' },
    'completely-wrong-secret-key-123'
  );

  const req = {
    cookies: { gencourse_token: badToken },
    headers: {},
    query: {}
  };

  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status: function(code) {
      statusCode = code;
      return this;
    },
    json: function(data) {
      jsonResponse = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusCode, 401);
  assert.ok(jsonResponse.message.includes('invalid or expired token'));
});

test('Auth Routes - GET /auth/login sets Secure cookies in production', () => {
  const loginRoute = authRouter.stack.find(s => s.route?.path === '/login');
  const loginHandler = loginRoute.route.stack[0].handle;

  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const cookiesSet = {};
  const req = {
    protocol: 'https',
    get: (header) => {
      if (header === 'host') return 'gencourse-ai.vercel.app';
      return '';
    }
  };

  const res = {
    cookie: function(name, value, options) {
      cookiesSet[name] = { value, options };
      return this;
    },
    redirect: function(url) {
      return this;
    }
  };

  try {
    loginHandler(req, res);

    // Verify cookies set with secure: true in production environment
    assert.strictEqual(cookiesSet['auth_code_verifier'].options.secure, true);
    assert.strictEqual(cookiesSet['auth_state'].options.secure, true);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

test('Auth Routes - GET /auth/callback handles Auth0 provider errors', async () => {
  const callbackRoute = authRouter.stack.find(s => s.route?.path === '/callback');
  const callbackHandler = callbackRoute.route.stack[0].handle;

  let redirectedUrl = null;

  const req = {
    query: {
      error: 'access_denied',
      error_description: 'User denied access'
    }
  };

  const res = {
    redirect: function(url) {
      redirectedUrl = url;
      return this;
    }
  };

  await callbackHandler(req, res);

  assert.ok(redirectedUrl);
  assert.ok(decodeURIComponent(redirectedUrl).includes('#error=User denied access'));
});

test('Auth Middleware - requireRole handles missing user context (401 Unauthorized)', () => {
  const req = {}; // req.user is undefined
  
  let statusCode = null;
  let jsonResponse = null;

  const res = {
    status: function(code) {
      statusCode = code;
      return this;
    },
    json: function(data) {
      jsonResponse = data;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(['admin']);
  middleware(req, res, next);

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(statusCode, 401);
  assert.ok(jsonResponse.message.includes('Not authorized'));
});

test('Auth Middleware - requireRole allows access to any matching role', () => {
  const req = {
    user: { role: 'instructor' }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  const middleware = requireRole(['admin', 'instructor']);
  middleware(req, {}, next);

  assert.strictEqual(nextCalled, true);
});
