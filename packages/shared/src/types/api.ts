/**
 * API 요청/응답 타입 정의
 * PRD §4.3 API 설계를 기반으로 한다.
 */

import type { ProjectInfo } from './analysis.js';

// ────────────────────────────────────────────────
// 요청
// ────────────────────────────────────────────────

export enum SourceType {
  GITHUB_URL = 'github_url',
  LOCAL_PATH = 'local_path',
  ZIP_UPLOAD = 'zip_upload',
}

export interface AnalyzeSource {
  type: SourceType;
  /**
   * - GITHUB_URL: "https://github.com/user/repo"
   * - LOCAL_PATH: "/absolute/path/to/project"
   * - ZIP_UPLOAD: 업로드 후 서버가 채운 임시 경로 (클라이언트는 빈 문자열)
   */
  value: string;
}

export interface AnalyzeOptions {
  /** 개발 의존성 포함 여부 (기본값: true) */
  includeDevDeps: boolean;
  /** 디렉토리 탐색 최대 깊이 (기본값: 5) */
  maxDepth: number;
  /** 추가로 무시할 경로 패턴 */
  ignorePaths: string[];
}

/** POST /api/analyze */
export interface AnalyzeRequest {
  source: AnalyzeSource;
  options?: Partial<AnalyzeOptions>;
}

// ────────────────────────────────────────────────
// 응답
// ────────────────────────────────────────────────

export interface GeneratedFiles {
  /** 생성된 CLAUDE.md 본문 (Markdown) */
  claudeMd: string;
  /** 생성된 PRD 초안 본문 (Markdown) */
  prdMd: string;
}

export interface AnalyzeMetadata {
  /** 분석 완료 시각 (ISO 8601) */
  analyzedAt: string;
  /** 분석된 파일 수 */
  fileCount: number;
  /** 분석 소요 시간 (ms) */
  analysisTimeMs: number;
}

/** POST /api/analyze 성공 응답 */
export interface AnalyzeResponse {
  projectInfo: ProjectInfo;
  generatedFiles: GeneratedFiles;
  metadata: AnalyzeMetadata;
}

// ────────────────────────────────────────────────
// 에러
// ────────────────────────────────────────────────

export enum ApiErrorCode {
  // 입력 검증
  INPUT_INVALID_URL = 'INPUT_INVALID_URL',
  INPUT_INVALID_PATH = 'INPUT_INVALID_PATH',
  INPUT_FILE_TOO_LARGE = 'INPUT_FILE_TOO_LARGE',
  INPUT_UNSUPPORTED_TYPE = 'INPUT_UNSUPPORTED_TYPE',

  // 분석
  ANALYSIS_CLONE_FAILED = 'ANALYSIS_CLONE_FAILED',
  ANALYSIS_TOO_MANY_FILES = 'ANALYSIS_TOO_MANY_FILES',
  ANALYSIS_READ_FAILED = 'ANALYSIS_READ_FAILED',

  // 생성
  GENERATE_FAILED = 'GENERATE_FAILED',

  // 시스템
  SYSTEM_INTERNAL = 'SYSTEM_INTERNAL',
  SYSTEM_TIMEOUT = 'SYSTEM_TIMEOUT',
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  statusCode: number;
}
