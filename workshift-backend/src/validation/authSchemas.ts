import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username không được để trống')
    .min(3, 'Username phải từ 3 đến 50 ký tự')
    .max(50, 'Username phải từ 3 đến 50 ký tự'),
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải từ 6 đến 100 ký tự')
    .max(100, 'Mật khẩu phải từ 6 đến 100 ký tự'),
  fullName: z.string().min(1, 'Họ tên không được để trống').max(255, 'Họ tên tối đa 255 ký tự'),
  phone: z
    .string()
    .max(30, 'Số điện thoại tối đa 30 ký tự')
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : v)),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Email/Username không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});
