import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('[error]', err);

  const statusCode =
    typeof err === 'object' && err !== null && 'statusCode' in err
      ? Number((err as { statusCode: number }).statusCode)
      : 500;

  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred on the server.';

  res.status(Number.isFinite(statusCode) ? statusCode : 500).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : message,
      statusCode: Number.isFinite(statusCode) ? statusCode : 500,
    },
  });
}
