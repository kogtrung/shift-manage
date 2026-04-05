import type { Request, Response } from 'express';
import { errorResponseOf } from '../common/errorResponse';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(errorResponseOf(404, 'Không tìm thấy tài nguyên', {}, req.originalUrl));
}
