import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AppError } from '../middlewares/error-handler.js';
import { ApiErrorCode } from '@claudemd-gen/shared';

// ─── execFile mock ────────────────────────────────────────────────────────────
// vi.hoisted()로 먼저 생성하여 vi.mock factory에서 참조할 수 있게 한다
const execFileMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}));

// mock 설정 이후에 import
import { shallowClone } from './git.util.js';

// ─── 타입 헬퍼 ────────────────────────────────────────────────────────────────

type NodeCallback = (
  err: NodeJS.ErrnoException | null,
  stdout: string,
  stderr: string,
) => void;

function setupSuccess(): void {
  execFileMock.mockImplementation(
    (_cmd: string, _args: string[], cb: NodeCallback) => cb(null, '', ''),
  );
}

function setupFailure(message: string, stderr = ''): void {
  execFileMock.mockImplementation(
    (_cmd: string, _args: string[], cb: NodeCallback) => {
      const err = Object.assign(new Error(message), {
        code: 'ENOENT',
        stderr,
      }) as NodeJS.ErrnoException;
      cb(err, '', stderr);
    },
  );
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('shallowClone', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('resolves when git clone succeeds', async () => {
    setupSuccess();
    await expect(
      shallowClone('https://github.com/user/repo', '/tmp/test'),
    ).resolves.toBeUndefined();
    expect(execFileMock).toHaveBeenCalledOnce();
  });

  it('passes the correct git arguments', async () => {
    setupSuccess();
    await shallowClone('https://github.com/user/repo', '/tmp/dest');
    const [cmd, args] = execFileMock.mock.calls[0] as [string, string[]];
    expect(cmd).toBe('git');
    expect(args).toContain('--depth=1');
    expect(args).toContain('--single-branch');
    expect(args).toContain('https://github.com/user/repo');
    expect(args).toContain('/tmp/dest');
  });

  it('throws AppError(ANALYSIS_CLONE_FAILED) when git fails with stderr', async () => {
    setupFailure('git error', 'fatal: repository not found');
    await expect(
      shallowClone('https://github.com/user/bad-repo', '/tmp/test'),
    ).rejects.toBeInstanceOf(AppError);

    await shallowClone('https://github.com/user/bad-repo', '/tmp/test').catch((err: AppError) => {
      expect(err.code).toBe(ApiErrorCode.ANALYSIS_CLONE_FAILED);
      expect(err.statusCode).toBe(422);
      expect(err.message).toContain('fatal: repository not found');
    });
  });

  it('falls back to Error.message when stderr is empty', async () => {
    setupFailure('git binary not found', '');
    await shallowClone('https://github.com/user/repo', '/tmp/test').catch((err: AppError) => {
      expect(err.message).toContain('git binary not found');
    });
  });
});
