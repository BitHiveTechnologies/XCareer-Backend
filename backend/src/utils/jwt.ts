import * as jwt from 'jsonwebtoken';
import { logger } from './logger';
import { config } from '../config/environment';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const token = (jwt as any).sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
      issuer: 'notifyx-backend',
      audience: 'notifyx-users'
    });
    
    logger.info('JWT access token generated successfully', {
      userId: payload.userId,
      role: payload.role
    });
    
    return token;
  } catch (error) {
    logger.error('Failed to generate JWT token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT access token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = (jwt as any).verify(token, config.JWT_SECRET, {
      issuer: 'notifyx-backend',
      audience: 'notifyx-users'
    }) as JWTPayload;
    
    logger.info('JWT token verified successfully', {
      userId: decoded.userId,
      role: decoded.role
    });
    
    return decoded;
  } catch (error) {
    logger.error('Failed to verify JWT token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 20) + '...'
    });
    
    if ((error as any).name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if ((error as any).name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  try {
    const token = (jwt as any).sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRE,
      issuer: 'notifyx-backend',
      audience: 'notifyx-users'
    });
    
    logger.info('Refresh token generated successfully', {
      userId: payload.userId
    });
    
    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      payload
    });
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = (jwt as any).verify(token, config.JWT_SECRET, {
      issuer: 'notifyx-backend',
      audience: 'notifyx-users'
    }) as RefreshTokenPayload;
    
    logger.info('Refresh token verified successfully', {
      userId: decoded.userId
    });
    
    return decoded;
  } catch (error) {
    logger.error('Failed to verify refresh token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 20) + '...'
    });
    
    if ((error as any).name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if ((error as any).name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
};

/**
 * Decode JWT token without verification (for debugging)
 */
export const decodeToken = (token: string): any => {
  try {
    return (jwt as any).decode(token);
  } catch (error) {
    logger.error('Failed to decode JWT token', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};
