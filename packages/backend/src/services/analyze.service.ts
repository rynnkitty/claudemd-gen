import path from 'node:path';
import { SourceType, ApiErrorCode } from '@claudemd-gen/shared';
import type { AnalyzeRequest, AnalyzeResponse } from '@claudemd-gen/shared';
import { AnalysisOrchestrator } from '../analyzers/index.js';
import { ClaudeMdGenerator } from '../generators/claude-md.generator.js';
import { PrdGenerator } from '../generators/prd.generator.js';
import { AppError } from '../middlewares/error-handler.js';
import { shallowClone } from '../utils/git.util.js';
import {
  createTempDir,
  cleanupDir,
  cleanupFile,
  extractZip,
} from '../utils/file.util.js';
import { createClaudeEnhancementService } from './claude.service.js';

const orchestrator = new AnalysisOrchestrator();
const claudeMdGenerator = new ClaudeMdGenerator();
const prdGenerator = new PrdGenerator();
const claudeService = createClaudeEnhancementService();

export interface AnalyzeServiceInput {
  request: AnalyzeRequest;
  /** multer가 저장한 업로드 파일 경로 (ZIP_UPLOAD 전용) */
  uploadedFilePath?: string;
}

export async function analyzeProject(
  input: AnalyzeServiceInput,
): Promise<AnalyzeResponse> {
  const { request, uploadedFilePath } = input;
  const { type, value } = request.source;

  let projectPath: string;
  let tempDir: string | null = null;

  // ── 소스별 프로젝트 경로 결정 ──────────────────────────────────────────────

  if (type === SourceType.LOCAL_PATH) {
    projectPath = path.resolve(value);
  } else if (type === SourceType.GITHUB_URL) {
    tempDir = await createTempDir('claudemd-clone-');
    // git clone은 대상 디렉토리 내에 하위 디렉토리를 만드므로 그 경로를 projectPath로 사용
    const repoName = value.replace(/\.git$/, '').split('/').at(-1) ?? 'repo';
    projectPath = path.join(tempDir, repoName);
    await shallowClone(value, projectPath);
  } else if (type === SourceType.ZIP_UPLOAD) {
    if (!uploadedFilePath) {
      throw new AppError(
        'No uploaded file found. Use POST /api/analyze/upload for ZIP uploads.',
        ApiErrorCode.INPUT_UNSUPPORTED_TYPE,
        400,
      );
    }
    tempDir = await createTempDir('claudemd-zip-');
    extractZip(uploadedFilePath, tempDir);
    projectPath = tempDir;
  } else {
    throw new AppError(
      `Unsupported source type.`,
      ApiErrorCode.INPUT_UNSUPPORTED_TYPE,
      400,
    );
  }

  // ── 분석 + 생성 ────────────────────────────────────────────────────────────

  try {
    const { projectInfo: rawProjectInfo, analysisTimeMs, fileCount } =
      await orchestrator.analyze(projectPath, request.options ?? {});

    // Claude API로 보강 (API 키 없으면 정적 분석 결과 그대로 사용)
    let projectInfo = rawProjectInfo;
    if (claudeService !== null) {
      const enhancements = await claudeService.enhance(rawProjectInfo);
      if (enhancements !== null) {
        projectInfo = { ...rawProjectInfo, claudeEnhancements: enhancements };
      }
    }

    const claudeMd = claudeMdGenerator.generate(projectInfo);
    const prdMd = prdGenerator.generate(projectInfo);

    return {
      projectInfo,
      generatedFiles: { claudeMd, prdMd },
      metadata: {
        analyzedAt: new Date().toISOString(),
        fileCount,
        analysisTimeMs,
      },
    };
  } finally {
    // 임시 디렉토리 및 업로드 파일 정리 (에러 발생 여부와 무관하게)
    if (tempDir !== null) {
      await cleanupDir(tempDir);
    }
    if (uploadedFilePath !== undefined) {
      await cleanupFile(uploadedFilePath);
    }
  }
}
