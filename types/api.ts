export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  code?: string;
  message: string;
  timestamp?: string;
  path?: string;
  errors?: unknown;
}

export interface HealthStatus {
  status: 'ok' | string;
  timestamp?: string;
}
