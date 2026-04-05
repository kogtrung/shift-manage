import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/appError';
import { errorResponseOf } from '../common/errorResponse';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(errorResponseOf(err.statusCode, err.message, err.errors, req.originalUrl));
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json(
      errorResponseOf(
        400,
        'Cú pháp JSON không hợp lệ (Thiếu ngoặc hoặc sai định dạng)',
        {},
        req.originalUrl
      )
    );
  }

  console.error(err);
  const msg = err instanceof Error ? err.message : String(err);
  return res
    .status(500)
    .json(errorResponseOf(500, `Lỗi hệ thống: ${msg}`, {}, req.originalUrl));
}
