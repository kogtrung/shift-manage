import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../common/appError';

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length ? issue.path.join('.') : 'root';
        if (!(key in errors)) {
          errors[key] = issue.message;
        }
      }
      next(new AppError(400, 'Tham số query không hợp lệ', errors));
      return;
    }
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}
