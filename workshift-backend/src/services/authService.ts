import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../common/appError';
import { getNextSequence } from './sequenceService';
import { jwtService } from './jwtService';
import type { AuthUser } from '../types/auth';
import type { IUser } from '../models/User';

function hashToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type LoginInput = {
  usernameOrEmail: string;
  password: string;
};

function toRegisterResponse(user: { id: number; username: string; email: string; fullName: string }) {
  return { id: user.id, username: user.username, email: user.email, fullName: user.fullName };
}

function toLoginResponse(user: {
  id: number;
  username: string;
  email: string;
  fullName: string;
  token: string;
  refreshToken: string;
}) {
  return {
    token: user.token,
    refreshToken: user.refreshToken,
    userId: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
  };
}

async function saveRefreshTokenRow(userId: number, rawRefresh: string): Promise<void> {
  const decoded = jwtService.verifyRefreshToken(rawRefresh);
  if (!decoded) {
    throw new AppError(401, 'Refresh token không hợp lệ');
  }
  const expiresAt = jwtService.getRefreshTokenExpiresAt(decoded);
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawRefresh),
    expiresAt,
    revokedAt: null,
  });
}

export const authService = {
  async register(input: RegisterInput) {
    const usernameTaken = await User.exists({ username: input.username });
    if (usernameTaken) {
      throw new AppError(409, 'Username đã tồn tại');
    }
    const emailTaken = await User.exists({ email: input.email });
    if (emailTaken) {
      throw new AppError(409, 'Email đã tồn tại');
    }

    const id = await getNextSequence('User');
    const password = await bcrypt.hash(input.password, 10);
    const user = await User.create({
      id,
      username: input.username,
      email: input.email,
      password,
      fullName: input.fullName,
      phone: input.phone?.trim() || undefined,
      status: 'ACTIVE',
      globalRole: 'USER',
    });
    return toRegisterResponse(user);
  },

  async login(input: LoginInput) {
    const key = input.usernameOrEmail.trim();
    const user = await User.findOne({
      $or: [{ username: key }, { email: key }],
    });
    if (!user) {
      throw new AppError(401, 'Thông tin đăng nhập không đúng');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Tài khoản đã bị khóa');
    }
    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) {
      throw new AppError(401, 'Thông tin đăng nhập không đúng');
    }

    const token = jwtService.generateAccessToken(user);
    const refreshToken = jwtService.generateRefreshToken(user);
    await saveRefreshTokenRow(user.id, refreshToken);

    return toLoginResponse({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      token,
      refreshToken,
    });
  },

  async refresh(rawRefreshToken: string) {
    const decodedJwt = jwtService.verifyRefreshToken(rawRefreshToken);
    if (!decodedJwt) {
      throw new AppError(401, 'Refresh token không hợp lệ');
    }

    const now = new Date();
    const tokenHash = hashToken(rawRefreshToken);
    const row = await RefreshToken.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    });
    if (!row) {
      throw new AppError(401, 'Refresh token đã hết hạn hoặc bị thu hồi');
    }

    const user = await User.findOne({ id: row.userId });
    if (!user) {
      throw new AppError(401, 'Refresh token không hợp lệ');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Tài khoản đã bị khóa');
    }

    row.revokedAt = now;
    await row.save();

    const token = jwtService.generateAccessToken(user);
    const refreshToken = jwtService.generateRefreshToken(user);
    await saveRefreshTokenRow(user.id, refreshToken);

    return { token, refreshToken };
  },

  async logout(username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    const now = new Date();
    await RefreshToken.updateMany(
      { userId: user.id, revokedAt: null, expiresAt: { $gt: now } },
      { $set: { revokedAt: now } }
    );
  },
};

export function toAuthUser(doc: IUser): AuthUser {
  return {
    id: doc.id,
    username: doc.username,
    email: doc.email,
    fullName: doc.fullName,
    phone: doc.phone,
    status: doc.status,
    globalRole: doc.globalRole,
  };
}
