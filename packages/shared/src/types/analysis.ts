/**
 * 프로젝트 정적 분석 결과 타입 정의
 * backend analyzers가 생성하고, frontend와 공유한다.
 */

// ────────────────────────────────────────────────
// 디렉토리 구조
// ────────────────────────────────────────────────

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  /** 파일인 경우 확장자 (점 포함, e.g. ".ts") */
  extension?: string;
}

export interface DirectoryTree {
  root: DirectoryNode;
  /** 전체 파일 수 (디렉토리 제외) */
  totalFiles: number;
  /** 전체 디렉토리 수 */
  totalDirectories: number;
}

// ────────────────────────────────────────────────
// 기술 스택
// ────────────────────────────────────────────────

export interface TechStack {
  /** 감지된 프로그래밍 언어 목록 (e.g. ["TypeScript", "CSS"]) */
  languages: string[];
  /** 감지된 프레임워크/라이브러리 목록 (e.g. ["React", "Express"]) */
  frameworks: string[];
  /** 패키지 매니저 (e.g. "npm", "yarn", "pnpm") */
  packageManager: string | null;
  /** 런타임 (e.g. "Node.js 20", "Python 3.11") */
  runtime: string | null;
  /** 빌드 도구 (e.g. "Vite", "webpack", "tsc") */
  buildTools: string[];
  /** 테스트 프레임워크 (e.g. "Vitest", "Jest") */
  testFrameworks: string[];
}

// ────────────────────────────────────────────────
// 의존성
// ────────────────────────────────────────────────

export interface DependencyEntry {
  name: string;
  version: string;
}

export interface DependencyInfo {
  production: DependencyEntry[];
  development: DependencyEntry[];
}

// ────────────────────────────────────────────────
// 설정 파일
// ────────────────────────────────────────────────

export interface ConfigFile {
  /** 파일명 (e.g. "tsconfig.json") */
  filename: string;
  /** 프로젝트 루트 기준 상대 경로 */
  relativePath: string;
  /** 파싱된 주요 설정 값 (알려진 필드만 추출) */
  summary: Record<string, unknown>;
}

// ────────────────────────────────────────────────
// 엔트리포인트
// ────────────────────────────────────────────────

export interface EntryPoint {
  /** 엔트리포인트 종류 (e.g. "main", "bin", "browser") */
  kind: string;
  /** 프로젝트 루트 기준 상대 경로 */
  relativePath: string;
}

// ────────────────────────────────────────────────
// 스크립트
// ────────────────────────────────────────────────

export interface ScriptInfo {
  /** 스크립트 이름 (e.g. "dev", "build", "test") */
  name: string;
  command: string;
}

// ────────────────────────────────────────────────
// 아키텍처
// ────────────────────────────────────────────────

export type ArchitecturePattern =
  | 'monorepo'
  | 'mvc'
  | 'clean-architecture'
  | 'feature-sliced'
  | 'layered'
  | 'unknown';

export interface ArchitectureInfo {
  /** 감지된 아키텍처 패턴 */
  pattern: ArchitecturePattern;
  /** 감지된 레이어/관심사 목록 (e.g. ["controllers", "services", "repositories"]) */
  layers: string[];
  /** 모노레포인 경우 패키지 목록 */
  packages?: string[];
}

// ────────────────────────────────────────────────
// 기존 문서
// ────────────────────────────────────────────────

export interface ExistingDoc {
  /** 파일명 (e.g. "README.md") */
  filename: string;
  /** 파일 내용 */
  content: string;
}

// ────────────────────────────────────────────────
// 최종 분석 결과 (ProjectInfo)
// ────────────────────────────────────────────────

export interface ProjectInfo {
  /** 프로젝트 이름 (package.json name 또는 루트 디렉토리 이름) */
  name: string;
  /** 프로젝트 설명 (package.json description 등에서 추출) */
  description: string | null;
  techStack: TechStack;
  structure: DirectoryTree;
  dependencies: DependencyInfo;
  scripts: ScriptInfo[];
  configFiles: ConfigFile[];
  entryPoints: EntryPoint[];
  architecture: ArchitectureInfo;
  /** README 등 기존 문서 */
  existingDocs: ExistingDoc[];
}
