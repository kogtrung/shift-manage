import type { RequestHandler } from 'express';
import { apiOk, apiCreated } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { authService } from '../services/authService';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json(apiCreated('Đăng ký thành công', data));
  } catch (e) {
    next(e);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json(apiOk('Đăng nhập thành công', data));
  } catch (e) {
    next(e);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    res.json(apiOk('Làm mới token thành công', data));
  } catch (e) {
    next(e);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    if (!req.authUser) {
      throw new AppError(401, 'Chưa xác thực');
    }
    await authService.logout(req.authUser.username);
    res.json(apiOk('Đăng xuất thành công', 'OK'));
  } catch (e) {
    next(e);
  }
};
