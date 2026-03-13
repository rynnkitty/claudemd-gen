/**
 * file.util.ts의 AdmZip 의존 에러 경로를 테스트한다.
 * 실제 AdmZip과 충돌하지 않도록 별도 파일에서 모듈 수준 mock을 사용한다.
 */
import { vi, describe, it, expect } from 'vitest';
import { AppError } from '../middlewares/error-handler.js';
import { ApiErrorCode } from '@claudemd-gen/shared';

// ─── adm-zip mock ─────────────────────────────────────────────────────────────

const mockExtractAllTo = vi.hoisted(() => vi.fn());
const mockGetEntries = vi.hoisted(() => vi.fn().mockReturnValue([]));

vi.mock('adm-zip', () => ({
  default: vi.fn().mockImplementation(() => ({
    getEntries: mockGetEntries,
    extractAllTo: mockExtractAllTo,
  })),
}));

import { extractZip } from './file.util.js';

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('extractZip (mocked AdmZip)', () => {
  it('throws AppError(ANALYSIS_READ_FAILED, 422) when extractAllTo throws', () => {
    mockGetEntries.mockReturnValueOnce([]);
    mockExtractAllTo.mockImplementationOnce(() => {
      throw new Error('disk full');
    });

    let caught: unknown;
    try {
      extractZip('/any/valid.zip', '/tmp/dest');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe(ApiErrorCode.ANALYSIS_READ_FAILED);
    expect((caught as AppError).statusCode).toBe(422);
    expect((caught as AppError).message).toContain('disk full');
  });

  it('succeeds (no throw) when extractAllTo resolves normally', () => {
    mockGetEntries.mockReturnValueOnce([]);
    mockExtractAllTo.mockImplementationOnce(() => undefined);

    expect(() => extractZip('/any/valid.zip', '/tmp/dest')).not.toThrow();
  });
});
