import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';
import { getEnv } from '../config/env.js';
import { signToken } from '../utils/jwt.js';

const router = express.Router();



// Helper functions for PKCE verifier and challenge generation
const base64URLEncode = (str) => {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const sha256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest();
};

/**
 * Route: GET /auth/login
 * Purpose: Initiates OAuth2 authorization flow with PKCE and CSRF state parameter, setting verifier and state cookies.
 */
router.get('/login', (req, res) => {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(sha256(verifier));
  const state = base64URLEncode(crypto.randomBytes(32));

  const isProd = getEnv('NODE_ENV', 'development') === 'production';

  // Store PKCE verifier and CSRF state in first-party cookies for token exchange verification
  res.cookie('auth_code_verifier', verifier, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  res.cookie('auth_state', state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const issuer = getEnv('AUTH0_ISSUER_BASE_URL');
  const clientId = getEnv('AUTH0_CLIENT_ID');
  const host = req.get('host') || '';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const redirectUri = isLocal
    ? `${req.protocol}://${host}/auth/callback`
    : `${getEnv('FRONTEND_URL')}/auth/callback`;

  const authParams = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: state,
    prompt: 'login'
  };

  if (req.query.screen_hint) {
    authParams.screen_hint = req.query.screen_hint;
  }

  const authUrl = `${issuer}/authorize?` + new URLSearchParams(authParams).toString();

  console.log(`🔑 Redirecting client browser to Auth0 Authorize URL`);
  res.redirect(authUrl);
});

/**
 * Route: GET /auth/callback
 * Purpose: Handles callback from Auth0, exchanges code for tokens, JIT provisions database profile, and issues custom JWT.
 */
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error(`❌ Authentication error from provider: ${error} - ${error_description}`);
    return res.redirect(`${getEnv('FRONTEND_URL')}/#error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is missing.' });
  }

  const isProd = getEnv('NODE_ENV', 'development') === 'production';

  // Retrieve state and verifier from first-party cookies
  const cookieState = req.cookies?.auth_state;
  const verifier = req.cookies?.auth_code_verifier;

  // Clear verification cookies immediately
  res.clearCookie('auth_code_verifier', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax'
  });
  res.clearCookie('auth_state', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax'
  });

  if (!cookieState || state !== cookieState) {
    console.error('❌ CSRF validation failed: Missing or mismatched state parameter');
    return res.redirect(`${getEnv('FRONTEND_URL')}/#error=${encodeURIComponent('Authentication session expired or CSRF state verification failed.')}`);
  }

  if (!verifier) {
    console.error('❌ Missing code verifier cookie (expired or cross-origin issues)');
    return res.redirect(`${getEnv('FRONTEND_URL')}/#error=${encodeURIComponent('Authentication session expired or code verifier mismatch.')}`);
  }

  try {
    const issuer = getEnv('AUTH0_ISSUER_BASE_URL');
    const clientId = getEnv('AUTH0_CLIENT_ID');
    const clientSecret = process.env.AUTH0_CLIENT_SECRET || '';
    const host = req.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const redirectUri = isLocal
      ? `${req.protocol}://${host}/auth/callback`
      : `${getEnv('FRONTEND_URL')}/auth/callback`;

    // 1. Exchange auth code for tokens
    const exchangePayload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      code_verifier: verifier,
      redirect_uri: redirectUri
    };

    if (clientSecret) {
      exchangePayload.client_secret = clientSecret;
    }

    const tokenResponse = await axios.post(`${issuer}/oauth/token`, exchangePayload);
    const { access_token } = tokenResponse.data;

    // 2. Fetch User Profile from Auth0
    const userinfoResponse = await axios.get(`${issuer}/userinfo`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const auth0User = userinfoResponse.data;
    if (!auth0User || !auth0User.sub) {
      throw new Error('Invalid user profile response from identity provider.');
    }

    // 3. Just-in-Time Database Provisioning
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

    // 4. Sign custom application JWT
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    const jwtToken = signToken(tokenPayload);

    // 5. Store custom application JWT in an httpOnly cookie
    res.cookie('gencourse_token', jwtToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000 // 5 minutes (matching JWT expiration)
    });

    console.log(`✅ Authentication successful. Redirecting user back to frontend`);
    res.redirect(getEnv('FRONTEND_URL'));
  } catch (err) {
    console.error('❌ Error handling authentication callback:', err.message);
    res.redirect(`${getEnv('FRONTEND_URL')}/#error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * Route: GET /auth/logout
 * Purpose: Redirects user browser to Auth0 global sign out and terminates session.
 */
router.get('/logout', (req, res) => {
  const issuer = getEnv('AUTH0_ISSUER_BASE_URL');
  const clientId = getEnv('AUTH0_CLIENT_ID');
  const frontendUrl = getEnv('FRONTEND_URL');
  const isProd = getEnv('NODE_ENV', 'development') === 'production';

  // Clear local JWT cookie
  res.clearCookie('gencourse_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax'
  });

  const logoutUrl = `${issuer}/v2/logout?` + new URLSearchParams({
    client_id: clientId,
    returnTo: frontendUrl
  }).toString();

  console.log(`🚪 Logging user out of Auth0, clearing token cookie, redirecting to frontend`);
  res.redirect(logoutUrl);
});

export default router;
