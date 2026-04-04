import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../common/appError';

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.join('.') : 'root';
        if (!(key in errors)) {
          errors[key] = issue.message;
        }
      }
      next(new AppError(400, 'Dữ liệu không hợp lệ', errors));
      return;
    }
    req.body = result.data as Request['body'];
    next();
  };
}
