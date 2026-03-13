import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { ApiErrorCode } from '@claudemd-gen/shared';
import { AppError } from '../middlewares/error-handler.js';

/**
 * OS 임시 디렉토리 하위에 새 임시 디렉토리를 생성하고 경로를 반환한다.
 */
export async function createTempDir(prefix = 'claudemd-'): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

/**
 * 디렉토리를 재귀적으로 삭제한다. 존재하지 않으면 무시한다.
 */
export async function cleanupDir(dirPath: string): Promise<void> {
  await rm(dirPath, { recursive: true, force: true });
}

/**
 * 파일을 삭제한다. 존재하지 않으면 무시한다.
 */
export async function cleanupFile(filePath: string): Promise<void> {
  await rm(filePath, { force: true });
}

/**
 * ZIP 파일을 targetDir에 압축 해제한다.
 * Path traversal 공격을 방지하기 위해 모든 엔트리를 사전 검증한다.
 */
export function extractZip(zipPath: string, targetDir: string): void {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipPath);
  } catch (err) {
    throw new AppError(
      `Failed to read ZIP file: ${String(err)}`,
      ApiErrorCode.ANALYSIS_READ_FAILED,
      422,
    );
  }

  const entries = zip.getEntries();
  const resolvedTarget = path.resolve(targetDir);

  // Path traversal 검증 — 추출 전에 모든 엔트리 경로 확인
  for (const entry of entries) {
    const entryPath = path.resolve(path.join(resolvedTarget, entry.entryName));
    if (!entryPath.startsWith(resolvedTarget + path.sep) && entryPath !== resolvedTarget) {
      throw new AppError(
        `ZIP entry "${entry.entryName}" would extract outside of target directory (path traversal detected).`,
        ApiErrorCode.INPUT_INVALID_PATH,
        400,
      );
    }
  }

  try {
    zip.extractAllTo(targetDir, true);
  } catch (err) {
    throw new AppError(
      `Failed to extract ZIP: ${String(err)}`,
      ApiErrorCode.ANALYSIS_READ_FAILED,
      422,
    );
  }
}
