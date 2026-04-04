export class AppError extends Error {
  readonly statusCode: number;
  readonly errors: Record<string, string>;

  constructor(statusCode: number, message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
