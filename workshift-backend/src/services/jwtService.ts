import { randomUUID } from 'crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { IUser } from '../models/User';
import { loadAuthEnv } from '../config/env';

export type AccessTokenPayload = JwtPayload & {
  token_type: 'access';
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
};

export type RefreshTokenPayload = JwtPayload & {
  token_type: 'refresh';
  username: string;
};

function getEnv() {
  return loadAuthEnv();
}

function toUserClaims(user: IUser) {
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.globalRole,
    token_type: 'access' as const,
  };
}

export const jwtService = {
  generateAccessToken(user: IUser): string {
    const { JWT_SECRET, JWT_ISSUER, JWT_EXPIRES_IN_SECONDS } = getEnv();
    return jwt.sign(toUserClaims(user), JWT_SECRET, {
      algorithm: 'HS256',
      issuer: JWT_ISSUER,
      subject: String(user.id),
      jwtid: randomUUID(),
      expiresIn: JWT_EXPIRES_IN_SECONDS,
    });
  },

  generateRefreshToken(user: IUser): string {
    const { JWT_REFRESH_SECRET, JWT_ISSUER, JWT_REFRESH_EXPIRES_IN_SECONDS } = getEnv();
    return jwt.sign(
      { username: user.username, token_type: 'refresh' as const },
      JWT_REFRESH_SECRET,
      {
        algorithm: 'HS256',
        issuer: JWT_ISSUER,
        subject: String(user.id),
        jwtid: randomUUID(),
        expiresIn: JWT_REFRESH_EXPIRES_IN_SECONDS,
      }
    );
  },

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const { JWT_SECRET, JWT_ISSUER } = getEnv();
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
      }) as AccessTokenPayload;
      if (decoded.token_type !== 'access') return null;
      return decoded;
    } catch {
      return null;
    }
  },

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const { JWT_REFRESH_SECRET, JWT_ISSUER } = getEnv();
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
      }) as RefreshTokenPayload;
      if (decoded.token_type !== 'refresh') return null;
      return decoded;
    } catch {
      return null;
    }
  },

  getRefreshTokenExpiresAt(decoded: RefreshTokenPayload): Date {
    const exp = decoded.exp;
    if (typeof exp !== 'number') {
      throw new Error('JWT refresh thiếu exp');
    }
    return new Date(exp * 1000);
  },
};
