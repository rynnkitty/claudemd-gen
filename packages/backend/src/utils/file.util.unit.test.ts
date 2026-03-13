import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, rm, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import AdmZip from 'adm-zip';
import { extractZip, createTempDir, cleanupDir, cleanupFile } from './file.util.js';
import { AppError } from '../middlewares/error-handler.js';
import { ApiErrorCode } from '@claudemd-gen/shared';

// ─── 픽스처 ───────────────────────────────────────────────────────────────────

let targetBase: string;
let validZipPath: string;

beforeAll(async () => {
  targetBase = await createTempDir('file-util-test-');
  const zip = new AdmZip();
  zip.addFile('hello.txt', Buffer.from('hello'));
  zip.addFile('sub/world.txt', Buffer.from('world'));
  validZipPath = path.join(tmpdir(), 'file-util-valid.zip');
  await writeFile(validZipPath, zip.toBuffer());
});

afterAll(async () => {
  await cleanupDir(targetBase);
  await rm(validZipPath, { force: true });
});

// ─── createTempDir ────────────────────────────────────────────────────────────

describe('createTempDir', () => {
  it('creates a directory that exists', async () => {
    const dir = await createTempDir('test-create-');
    const s = await stat(dir);
    expect(s.isDirectory()).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it('uses the provided prefix', async () => {
    const dir = await createTempDir('myprefix-');
    expect(path.basename(dir)).toMatch(/^myprefix-/);
    await rm(dir, { recursive: true, force: true });
  });

  it('uses "claudemd-" as the default prefix', async () => {
    const dir = await createTempDir();
    expect(path.basename(dir)).toMatch(/^claudemd-/);
    await rm(dir, { recursive: true, force: true });
  });
});

// ─── cleanupDir ───────────────────────────────────────────────────────────────

describe('cleanupDir', () => {
  it('deletes an existing directory recursively', async () => {
    const dir = path.join(targetBase, 'to-delete');
    await mkdir(dir);
    await writeFile(path.join(dir, 'file.txt'), 'data');
    await cleanupDir(dir);
    await expect(stat(dir)).rejects.toThrow();
  });

  it('does not throw for a non-existent path', async () => {
    await expect(cleanupDir('/absolutely/nonexistent/path/99999')).resolves.toBeUndefined();
  });
});

// ─── cleanupFile ─────────────────────────────────────────────────────────────

describe('cleanupFile', () => {
  it('deletes an existing file', async () => {
    const file = path.join(targetBase, 'to-delete.txt');
    await writeFile(file, 'data');
    await cleanupFile(file);
    await expect(stat(file)).rejects.toThrow();
  });

  it('does not throw for a non-existent file', async () => {
    await expect(cleanupFile('/nonexistent/path/no.txt')).resolves.toBeUndefined();
  });
});

// ─── extractZip ───────────────────────────────────────────────────────────────

describe('extractZip', () => {
  it('successfully extracts a valid ZIP into the target directory', async () => {
    const dest = path.join(targetBase, 'extract-valid');
    await mkdir(dest);
    expect(() => extractZip(validZipPath, dest)).not.toThrow();
    await expect(stat(path.join(dest, 'hello.txt'))).resolves.toBeTruthy();
  });

  it('throws AppError(ANALYSIS_READ_FAILED, 422) for a non-existent ZIP path', () => {
    let caught: unknown;
    try {
      extractZip('/nonexistent/not-a-zip.zip', targetBase);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe(ApiErrorCode.ANALYSIS_READ_FAILED);
    expect((caught as AppError).statusCode).toBe(422);
  });

  it('throws AppError(INPUT_INVALID_PATH, 400) when an entry escapes the target directory', async () => {
    // 정상 ZIP을 버퍼로 만든 뒤 파일명을 바이너리 수준에서 교체한다
    // AdmZip.addFile은 경로를 정규화하므로, raw buffer를 직접 패치해야 한다.
    // 'zz/evil.txt' (11 bytes) → '../evil.txt' (11 bytes) — 길이가 같으므로 구조 유지
    const zip = new AdmZip();
    zip.addFile('zz/evil.txt', Buffer.from('evil'));
    const buf = Buffer.from(zip.toBuffer()); // mutable copy

    const needle = Buffer.from('zz/evil.txt');
    const replacement = Buffer.from('../evil.txt');
    // ZIP에는 같은 파일명이 local header + central directory 두 곳에 존재함
    for (let i = 0; i <= buf.length - needle.length; i++) {
      if (buf.subarray(i, i + needle.length).equals(needle)) {
        replacement.copy(buf, i);
      }
    }

    const traversalZipPath = path.join(tmpdir(), 'traversal-test.zip');
    await writeFile(traversalZipPath, buf);

    const dest = path.join(targetBase, 'extract-traversal');
    await mkdir(dest);

    let caught: unknown;
    try {
      extractZip(traversalZipPath, dest);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).code).toBe(ApiErrorCode.INPUT_INVALID_PATH);

    await rm(traversalZipPath, { force: true });
  });
});
