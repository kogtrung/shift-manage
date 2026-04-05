export type ApiResponseBody<T> = {
  status: number;
  message: string;
  data: T;
  timestamp: string;
};

export function apiOk<T>(message: string, data: T): ApiResponseBody<T> {
  return {
    status: 200,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function apiCreated<T>(message: string, data: T): ApiResponseBody<T> {
  return {
    status: 201,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
