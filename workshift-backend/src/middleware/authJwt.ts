import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { AppError } from '../common/appError';
import { jwtService } from '../services/jwtService';
import { toAuthUser } from '../services/authService';
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Chưa xác thực');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError(401, 'Chưa xác thực');
    }

    const payload = jwtService.verifyAccessToken(token);
    if (!payload?.username) {
      throw new AppError(401, 'Chưa xác thực');
    }

    const user = await User.findOne({ username: payload.username });
    if (!user) {
      throw new AppError(401, 'Chưa xác thực');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Tài khoản đã bị khóa');
    }

    req.authUser = toAuthUser(user);
    next();
  } catch (e) {
    next(e);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.authUser?.globalRole !== 'ADMIN') {
    next(new AppError(403, 'Không có quyền truy cập'));
    return;
  }
  next();
}
