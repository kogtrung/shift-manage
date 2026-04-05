export type ErrorResponseBody = {
  status: number;
  message: string;
  errors: Record<string, string>;
  path: string;
  timestamp: string;
};

export function errorResponseOf(
  status: number,
  message: string,
  errors: Record<string, string>,
  path: string
): ErrorResponseBody {
  return {
    status,
    message,
    errors,
    path,
    timestamp: new Date().toISOString(),
  };
}
