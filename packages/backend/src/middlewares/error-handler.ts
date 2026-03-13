import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiErrorCode } from '@claudemd-gen/shared';

// ─── AppError ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;

  constructor(message: string, code: ApiErrorCode, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ─── asyncHandler ────────────────────────────────────────────────────────────

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// ─── errorHandler middleware ─────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Multer 파일 크기 초과 에러
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'LIMIT_FILE_SIZE'
  ) {
    res.status(413).json({
      code: ApiErrorCode.INPUT_FILE_TOO_LARGE,
      message: 'Uploaded file exceeds the size limit.',
      statusCode: 413,
    });
    return;
  }

  // 예상치 못한 에러
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred.';

  res.status(500).json({
    code: ApiErrorCode.SYSTEM_INTERNAL,
    message,
    statusCode: 500,
  });
}
