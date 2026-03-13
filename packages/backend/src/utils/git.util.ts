import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ApiErrorCode } from '@claudemd-gen/shared';
import { AppError } from '../middlewares/error-handler.js';

const execFileAsync = promisify(execFile);

/**
 * GitHub 저장소를 depth=1로 클론한다.
 * @param url   GitHub 퍼블릭 저장소 URL
 * @param targetDir 클론 대상 디렉토리 (이미 존재해야 함)
 */
export async function shallowClone(url: string, targetDir: string): Promise<void> {
  try {
    await execFileAsync('git', [
      'clone',
      '--depth=1',
      '--single-branch',
      url,
      targetDir,
    ]);
  } catch (err) {
    const stderr =
      err instanceof Error && 'stderr' in err
        ? String((err as { stderr: unknown }).stderr)
        : '';
    throw new AppError(
      `Failed to clone repository "${url}": ${stderr || String(err)}`,
      ApiErrorCode.ANALYSIS_CLONE_FAILED,
      422,
    );
  }
}
