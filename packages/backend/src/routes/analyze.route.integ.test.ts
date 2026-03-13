import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, rm } from 'node:fs/promises';
import AdmZip from 'adm-zip';
import app from '../app.js';
import { SourceType } from '@claudemd-gen/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, '../__fixtures__');
const SAMPLE_MVC_PATH = path.join(FIXTURES_DIR, 'sample-node-mvc');

const TEST_ZIP_PATH = path.join(FIXTURES_DIR, 'sample-node-mvc.zip');

// ─── beforeAll: 테스트용 ZIP 생성 ────────────────────────────────────────────

beforeAll(async () => {
  const zip = new AdmZip();
  zip.addLocalFolder(SAMPLE_MVC_PATH);
  await writeFile(TEST_ZIP_PATH, zip.toBuffer());
});

afterAll(async () => {
  await rm(TEST_ZIP_PATH, { force: true });
});

// ─── GET /api/health ─────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('includes a timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp as string)).not.toThrow();
  });
});

// ─── POST /api/analyze — local_path ─────────────────────────────────────────

describe('POST /api/analyze (local_path)', () => {
  it('returns 200 and a valid AnalyzeResponse', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        source: { type: SourceType.LOCAL_PATH, value: SAMPLE_MVC_PATH },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('projectInfo');
    expect(res.body).toHaveProperty('generatedFiles.claudeMd');
    expect(res.body).toHaveProperty('generatedFiles.prdMd');
    expect(res.body).toHaveProperty('metadata.analyzedAt');
    expect(res.body).toHaveProperty('metadata.fileCount');
    expect(res.body).toHaveProperty('metadata.analysisTimeMs');
  });

  it('detects the correct project name', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        source: { type: SourceType.LOCAL_PATH, value: SAMPLE_MVC_PATH },
      });

    expect(res.body.projectInfo.name).toBe('sample-node-mvc');
  });

  it('generates a non-empty CLAUDE.md', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        source: { type: SourceType.LOCAL_PATH, value: SAMPLE_MVC_PATH },
      });

    const claudeMd: string = res.body.generatedFiles.claudeMd;
    expect(claudeMd.startsWith('# CLAUDE.md')).toBe(true);
    expect(claudeMd.length).toBeGreaterThan(100);
  });

  it('generates a non-empty PRD', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        source: { type: SourceType.LOCAL_PATH, value: SAMPLE_MVC_PATH },
      });

    const prdMd: string = res.body.generatedFiles.prdMd;
    expect(prdMd.startsWith('# PRD:')).toBe(true);
    expect(prdMd.length).toBeGreaterThan(100);
  });

  it('accepts custom options', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        source: { type: SourceType.LOCAL_PATH, value: SAMPLE_MVC_PATH },
        options: { maxDepth: 2, includeDevDeps: false },
      });

    expect(res.status).toBe(200);
  });
});

// ─── POST /api/analyze — 유효성 검사 에러 ────────────────────────────────────

describe('POST /api/analyze (validation errors)', () => {
  it('returns 400 when source is missing', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('code');
  });

  it('returns 400 for an unsupported source type', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ source: { type: 'ftp_server', value: 'ftp://example.com' } });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INPUT_UNSUPPORTED_TYPE');
  });

  it('returns 400 for an invalid GitHub URL', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        source: {
          type: SourceType.GITHUB_URL,
          value: 'https://gitlab.com/user/repo',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INPUT_INVALID_URL');
  });

  it('returns 400 for an empty local_path value', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ source: { type: SourceType.LOCAL_PATH, value: '' } });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INPUT_INVALID_PATH');
  });
});

// ─── POST /api/analyze/upload — ZIP 업로드 ───────────────────────────────────

describe('POST /api/analyze/upload', () => {
  it('returns 200 and a valid AnalyzeResponse for a valid ZIP', async () => {
    const res = await request(app)
      .post('/api/analyze/upload')
      .attach('file', TEST_ZIP_PATH);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('projectInfo');
    expect(res.body).toHaveProperty('generatedFiles.claudeMd');
    expect(res.body).toHaveProperty('generatedFiles.prdMd');
  });

  it('returns 400 when no file is attached', async () => {
    const res = await request(app).post('/api/analyze/upload');
    // multer가 파일 없이 요청을 처리하면 uploadedFilePath가 undefined → AppError
    expect(res.status).toBe(400);
  });
});
