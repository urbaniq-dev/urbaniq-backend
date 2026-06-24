import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redisClient } from '../../../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

// Access Token TTL: 15 minutes
const ACCESS_TOKEN_EXPIRY = '15m';

// Refresh Token TTL: 7 days in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 604,800 seconds

interface RefreshTokenPayload {
  id: string;
  jti: string;
}

/**
 * Generates a short-lived access token for API requests.
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Generates a long-lived refresh token, stores its identifier in Redis, and returns the token.
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ id: userId, jti }, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  // Store token status in Redis. Key structure: refreshToken:<userId>:<jti>
  const key = `refreshToken:${userId}:${jti}`;
  await redisClient.set(key, 'active', { EX: REFRESH_TOKEN_TTL });

  return token;
};

/**
 * Verifies a refresh token's signature and ensures it is active in Redis.
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload | null> => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (!decoded.id || !decoded.jti) {
      return null;
    }

    const key = `refreshToken:${decoded.id}:${decoded.jti}`;
    const status = await redisClient.get(key);

    if (status !== 'active') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Revokes a single refresh token by deleting its identifier from Redis.
 */
export const revokeRefreshToken = async (userId: string, jti: string): Promise<void> => {
  const key = `refreshToken:${userId}:${jti}`;
  await redisClient.del(key);
};
