import type { Request, Response, NextFunction } from 'express';
import { SourceType, ApiErrorCode } from '@claudemd-gen/shared';
import type { AnalyzeRequest } from '@claudemd-gen/shared';
import { AppError } from './error-handler.js';

const GITHUB_URL_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;

export function validateAnalyzeRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const body = req.body as Partial<AnalyzeRequest>;

  if (!body.source || typeof body.source !== 'object') {
    throw new AppError(
      '"source" field is required.',
      ApiErrorCode.INPUT_UNSUPPORTED_TYPE,
      400,
    );
  }

  const { type, value } = body.source;

  if (!Object.values(SourceType).includes(type as SourceType)) {
    throw new AppError(
      `Unsupported source type: "${String(type)}". Must be one of: ${Object.values(SourceType).join(', ')}.`,
      ApiErrorCode.INPUT_UNSUPPORTED_TYPE,
      400,
    );
  }

  if (type === SourceType.GITHUB_URL) {
    if (typeof value !== 'string' || !GITHUB_URL_RE.test(value)) {
      throw new AppError(
        `Invalid GitHub URL: "${String(value)}". Expected: https://github.com/user/repo`,
        ApiErrorCode.INPUT_INVALID_URL,
        400,
      );
    }
  }

  if (type === SourceType.LOCAL_PATH) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new AppError(
        'A non-empty "value" (absolute path) is required for local_path source.',
        ApiErrorCode.INPUT_INVALID_PATH,
        400,
      );
    }
  }

  // ZIP_UPLOAD의 value는 서버가 채우므로 여기서 검증하지 않음

  next();
}
