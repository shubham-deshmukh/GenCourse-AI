import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { protect } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';
import { getEnv } from '../config/env.js';

// 1. Mock DB calls
const mockUser = {
  _id: 'mock-user-id-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'student'
};

const mockAdminUser = {
  _id: 'mock-admin-id',
  name: 'Mock Developer',
  email: 'developer@example.com',
  role: 'admin',
  auth0Sub: 'mock-auth-sub-id'
};

User.findById = async (id) => {
  if (id === 'mock-user-id-123') {
    return mockUser;
  }
  return null;
};

User.findOne = async (query) => {
  if (query && query.auth0Sub === 'mock-auth-sub-id') {
    return mockAdminUser;
  }
  return null;
};

User.create = async (data) => {
  return { ...data, _id: 'new-user-id' };
};

// Retrieve JWT Secret for signing test tokens
const JWT_SECRET = getEnv('JWT_SECRET', 'test_secret_key_123');

// Helper to sign test tokens
const signTestToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// 2. Unit Tests for Auth Middleware
test('Auth Middleware - Valid Token in Cookie', async (t) => {
  const token = signTestToken({ id: 'mock-user-id-123' });
  const req = {
    cookies: {
      gencourse_token: token
    },
    headers: {},
    query: {}
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, true, 'Next middleware should be called');
  assert.deepEqual(req.user, mockUser, 'Should attach the correct user to req.user');
});

test('Auth Middleware - Valid Token in Authorization Header (Bearer)', async (t) => {
  const token = signTestToken({ id: 'mock-user-id-123' });
  const req = {
    cookies: {},
    headers: {
      authorization: `Bearer ${token}`
    },
    query: {}
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, true, 'Next middleware should be called');
  assert.deepEqual(req.user, mockUser, 'Should attach user from bearer token');
});

test('Auth Middleware - Valid Token in Query Parameters', async (t) => {
  const token = signTestToken({ id: 'mock-user-id-123' });
  const req = {
    cookies: {},
    headers: {},
    query: {
      token: token
    }
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, true, 'Next middleware should be called');
  assert.deepEqual(req.user, mockUser, 'Should attach user from query token');
});

test('Auth Middleware - Missing Token', async (t) => {
  const req = {
    cookies: {},
    headers: {},
    query: {}
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  let responseStatus = null;
  let responseBody = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    }
  };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, false, 'Next middleware should NOT be called');
  assert.strictEqual(responseStatus, 401, 'Should return 401 status code');
  assert.match(responseBody.message, /authorization token is missing/i, 'Should return token missing message');
});

test('Auth Middleware - Invalid Token', async (t) => {
  const req = {
    cookies: {
      gencourse_token: 'invalid_token_string'
    },
    headers: {},
    query: {}
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  let responseStatus = null;
  let responseBody = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    }
  };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, false, 'Next middleware should NOT be called');
  assert.strictEqual(responseStatus, 401, 'Should return 401 status code');
  assert.match(responseBody.message, /invalid or expired token/i, 'Should return invalid/expired message');
});

test('Auth Middleware - User Profile Not Found in DB', async (t) => {
  const token = signTestToken({ id: 'non-existent-user-id' });
  const req = {
    cookies: {
      gencourse_token: token
    },
    headers: {},
    query: {}
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  let responseStatus = null;
  let responseBody = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    }
  };

  await protect(req, res, next);

  assert.strictEqual(nextCalled, false, 'Next middleware should NOT be called');
  assert.strictEqual(responseStatus, 401, 'Should return 401 status code');
  assert.match(responseBody.message, /user profile not found/i, 'Should return user profile not found message');
});

test('Auth Middleware - Development Mock User Mode (Bypass checks)', async (t) => {
  const req = {
    cookies: {},
    headers: {
      'x-mock-user': 'true'
    },
    query: {}
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };

  const originalEnvNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  try {
    await protect(req, res, next);
    assert.strictEqual(nextCalled, true, 'Next middleware should be called in mock mode');
    assert.deepEqual(req.user, mockAdminUser, 'Should attach the admin mock developer user');
  } finally {
    process.env.NODE_ENV = originalEnvNodeEnv;
  }
});
