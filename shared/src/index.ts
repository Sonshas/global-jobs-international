export const API_VERSION = 'v1' as const;

export type ApiSuccessResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  error: {
    message: string;
    statusCode: number;
    code?: string;
  };
};

export type HealthStatus = {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  apiVersion: typeof API_VERSION;
  timestamp: string;
};
