import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';

/**
 * Sign a new JWT token.
 * 
 * @param {object} payload - The payload to sign (typically containing user id/role/email).
 * @returns {string} The signed JWT token.
 */
export const signToken = (payload) => {
  const secret = getEnv('JWT_SECRET');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

/**
 * Verify an existing JWT token.
 * 
 * @param {string} token - The JWT token to verify.
 * @returns {object} The decoded token payload.
 * @throws {Error} If token is invalid or expired.
 */
export const verifyToken = (token) => {
  const secret = getEnv('JWT_SECRET');
  return jwt.verify(token, secret);
};
