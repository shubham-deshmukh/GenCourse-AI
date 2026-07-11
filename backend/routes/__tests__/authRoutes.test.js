import test, { after, beforeEach, describe } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import mongoose from 'mongoose';
import axios from 'axios';
import app from '../../server.js';
import User from '../../models/User.js';

describe('Auth Routes & JIT Provisioning Tests', () => {
  const originalAxiosPost = axios.post;
  const originalAxiosGet = axios.get;
  const originalUserFindOne = User.findOne;
  const originalUserCreate = User.create;

  let findOneCalled = 0;
  let createCalled = 0;
  let createdUserPayload = null;

  beforeEach(() => {
    findOneCalled = 0;
    createCalled = 0;
    createdUserPayload = null;

    // Default mock implementation for User queries
    User.findOne = async (query) => {
      findOneCalled++;
      return null; // Simulate user not found by default (trigger JIT create)
    };

    User.create = async (payload) => {
      createCalled++;
      createdUserPayload = payload;
      return {
        _id: new mongoose.Types.ObjectId(),
        ...payload
      };
    };
  });

  after(() => {
    // Restore original implementations after test run
    axios.post = originalAxiosPost;
    axios.get = originalAxiosGet;
    User.findOne = originalUserFindOne;
    User.create = originalUserCreate;
  });

  test('GET /auth/login - Redirects to Auth0 Authorize URL and Sets Verification Cookies', async () => {
    const res = await supertest(app)
      .get('/auth/login')
      .expect(302);

    // Verify redirect location goes to Auth0
    const redirectUrl = res.headers.location;
    assert.ok(redirectUrl.includes('auth0.com') || redirectUrl.includes('authorize'), 'Expected redirect to Auth0 authorize URL');
    assert.ok(redirectUrl.includes('response_type=code'));
    assert.ok(redirectUrl.includes('code_challenge='));

    // Verify cookies are set
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some(c => c.includes('auth_code_verifier')), 'Expected verifier cookie');
    assert.ok(cookies.some(c => c.includes('auth_state')), 'Expected CSRF state cookie');
  });

  test('GET /auth/callback - CSRF State Validation Failure', async () => {
    // Pass mismatched state parameters
    const res = await supertest(app)
      .get('/auth/callback?state=wrong-state&code=fake-code')
      .set('Cookie', ['auth_state=correct-state', 'auth_code_verifier=fake-verifier'])
      .expect(302);

    assert.ok(res.headers.location.includes('CSRF'), 'Expected redirect with CSRF error details');
  });

  test('GET /auth/callback - Missing Code Verifier Cookie Failure', async () => {
    // Omit verifier cookie
    const res = await supertest(app)
      .get('/auth/callback?state=correct-state&code=fake-code')
      .set('Cookie', ['auth_state=correct-state'])
      .expect(302);

    assert.ok(res.headers.location.includes('verifier'), 'Expected redirect with code verifier error details');
  });

  test('GET /auth/callback - Unverified Email Blocks Registration', async () => {
    // Mock token exchange response
    axios.post = async () => ({
      data: { access_token: 'fake-access-token' }
    });

    // Mock UserInfo fetch returning an unverified email profile
    axios.get = async () => ({
      data: {
        sub: 'auth0|unverified-sub',
        email: 'unverified@example.com',
        email_verified: false,
        name: 'Unverified User'
      }
    });

    const res = await supertest(app)
      .get('/auth/callback?state=correct-state&code=fake-code')
      .set('Cookie', ['auth_state=correct-state', 'auth_code_verifier=fake-verifier'])
      .expect(302);

    assert.ok(res.headers.location.includes('EmailNotVerified'), 'Expected block redirect to EmailNotVerified landing');
    assert.strictEqual(findOneCalled, 0, 'Should block JIT queries if email is not verified');
  });

  test('GET /auth/callback - Successful Callback and JIT User Provisioning (New User)', async () => {
    // Mock token exchange response
    axios.post = async () => ({
      data: { access_token: 'fake-access-token' }
    });

    // Mock UserInfo fetch returning verified student profile
    axios.get = async () => ({
      data: {
        sub: 'auth0|new-student-sub',
        email: 'newstudent@example.com',
        email_verified: true,
        name: 'New Student',
        picture: 'http://pic.url'
      }
    });

    const res = await supertest(app)
      .get('/auth/callback?state=correct-state&code=fake-code')
      .set('Cookie', ['auth_state=correct-state', 'auth_code_verifier=fake-verifier'])
      .expect(302);

    // Verify JIT provisioning calls
    assert.strictEqual(findOneCalled, 1, 'Expected one database lookup');
    assert.strictEqual(createCalled, 1, 'Expected new user creation');
    assert.strictEqual(createdUserPayload.email, 'newstudent@example.com');
    assert.strictEqual(createdUserPayload.auth0Sub, 'auth0|new-student-sub');
    assert.strictEqual(createdUserPayload.role, 'student', 'Should default to student role');

    // Verify redirect goes back to frontend home
    assert.strictEqual(res.headers.location, process.env.FRONTEND_URL || 'http://localhost:5173');

    // Verify custom JWT cookie is placed
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some(c => c.includes('gencourse_token')), 'Expected application session cookie to be set');
  });

  test('GET /auth/callback - Successful Callback (Existing User Loaded)', async () => {
    // Mock token exchange response
    axios.post = async () => ({
      data: { access_token: 'fake-access-token' }
    });

    // Mock UserInfo fetch returning verified existing profile
    axios.get = async () => ({
      data: {
        sub: 'auth0|existing-sub',
        email: 'existing@example.com',
        email_verified: true,
        name: 'Existing User'
      }
    });

    // Mock User.findOne to return existing record (skip JIT creation)
    const existingUserId = new mongoose.Types.ObjectId();
    User.findOne = async () => {
      findOneCalled++;
      return {
        _id: existingUserId,
        email: 'existing@example.com',
        auth0Sub: 'auth0|existing-sub',
        role: 'student'
      };
    };

    const res = await supertest(app)
      .get('/auth/callback?state=correct-state&code=fake-code')
      .set('Cookie', ['auth_state=correct-state', 'auth_code_verifier=fake-verifier'])
      .expect(302);

    assert.strictEqual(findOneCalled, 1);
    assert.strictEqual(createCalled, 0, 'Should NOT create a new database record for existing users');

    // Verify application JWT cookie still set
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some(c => c.includes('gencourse_token')));
  });

  test('GET /auth/logout - Clears JWT Cookie and Redirects to Auth0 Sign Out', async () => {
    const res = await supertest(app)
      .get('/auth/logout')
      .expect(302);

    // Verify cookie removal headers are sent
    const cookies = res.headers['set-cookie'] || [];
    assert.ok(cookies.some(c => c.includes('gencourse_token=;')), 'Expected cookie clear directive');

    // Verify redirection to global Auth0 sign out page
    assert.ok(res.headers.location.includes('auth0.com') || res.headers.location.includes('logout'), 'Expected global Auth0 redirect');
  });
});
