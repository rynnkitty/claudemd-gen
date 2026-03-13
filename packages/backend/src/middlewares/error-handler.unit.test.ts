import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, asyncHandler } from './error-handler.js';
import { ApiErrorCode } from '@claudemd-gen/shared';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function makeMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

const req = {} as Request;
const next = vi.fn() as unknown as NextFunction;

// ─── errorHandler ─────────────────────────────────────────────────────────────

describe('errorHandler', () => {
  it('handles AppError with the correct status code and body', () => {
    const err = new AppError('not found', ApiErrorCode.INPUT_INVALID_URL, 404);
    const res = makeMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: ApiErrorCode.INPUT_INVALID_URL,
      message: 'not found',
      statusCode: 404,
    });
  });

  it('handles multer LIMIT_FILE_SIZE error with 413', () => {
    const err = { code: 'LIMIT_FILE_SIZE' };
    const res = makeMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ApiErrorCode.INPUT_FILE_TOO_LARGE }),
    );
  });

  it('handles a plain Error with 500 SYSTEM_INTERNAL', () => {
    const err = new Error('something went wrong');
    const res = makeMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ApiErrorCode.SYSTEM_INTERNAL,
        message: 'something went wrong',
        statusCode: 500,
      }),
    );
  });

  it('handles a non-Error thrown value with 500 and default message', () => {
    const err = 'string error';
    const res = makeMockRes();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ApiErrorCode.SYSTEM_INTERNAL,
        message: 'An unexpected error occurred.',
      }),
    );
  });
});

// ─── asyncHandler ─────────────────────────────────────────────────────────────

describe('asyncHandler', () => {
  it('forwards resolved handler response without calling next', async () => {
    const handler = asyncHandler(async (_req, res) => {
      res.json({ ok: true });
    });
    const res = makeMockRes();
    const nextFn = vi.fn();

    await handler(req, res, nextFn);

    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('calls next(err) when the async handler rejects', async () => {
    const boom = new Error('async boom');
    const handler = asyncHandler(async () => {
      throw boom;
    });
    const res = makeMockRes();
    const nextFn = vi.fn();

    await handler(req, res, nextFn);

    expect(nextFn).toHaveBeenCalledWith(boom);
  });
});

// ─── AppError ─────────────────────────────────────────────────────────────────

describe('AppError', () => {
  it('sets code, statusCode, and name correctly', () => {
    const err = new AppError('test', ApiErrorCode.SYSTEM_INTERNAL, 500);
    expect(err.name).toBe('AppError');
    expect(err.code).toBe(ApiErrorCode.SYSTEM_INTERNAL);
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('test');
    expect(err instanceof Error).toBe(true);
  });
});
