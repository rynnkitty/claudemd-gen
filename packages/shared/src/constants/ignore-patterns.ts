/**
 * 프로젝트 분석 시 무시할 경로/파일 패턴
 */

/** 기본 무시 디렉토리 */
export const IGNORE_DIRECTORIES: string[] = [
  // 의존성
  'node_modules',
  'vendor',
  '.venv',
  'venv',
  '__pypackages__',

  // 빌드 결과물
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.output',
  'target',        // Rust/Java
  'bin',
  'obj',           // .NET

  // 테스트 커버리지
  'coverage',
  '.nyc_output',

  // 캐시
  '.cache',
  '.parcel-cache',
  '.turbo',
  '.eslintcache',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.ruff_cache',
  '.gradle',
  '.m2',

  // IDE / 에디터
  '.idea',
  '.vs',

  // 기타
  '.git',
  '.svn',
  '.hg',
];

/** 기본 무시 파일 패턴 (glob) */
export const IGNORE_FILE_PATTERNS: string[] = [
  // 로그
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',

  // 환경 변수
  '.env',
  '.env.*',

  // OS
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',

  // TypeScript 빌드 정보
  '*.tsbuildinfo',

  // 바이너리 / 미디어 (분석 불필요)
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.webp',
  '*.mp4',
  '*.mp3',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',

  // 압축
  '*.zip',
  '*.tar.gz',
  '*.tgz',

  // 패키지 잠금 파일 (내용 분석 불필요, 존재만 감지)
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'Cargo.lock',
  'composer.lock',
];

/** 병합된 단일 기본 무시 목록 (하위 호환용) */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
  ...IGNORE_DIRECTORIES,
  ...IGNORE_FILE_PATTERNS,
];

/** 분석 대상 파일 수 상한 */
export const MAX_FILE_COUNT = 5000;

/** ZIP 업로드 최대 크기 (MB) */
export const MAX_UPLOAD_SIZE_MB = 50;

/** 임시 파일 자동 삭제 주기 (ms) — 10분 */
export const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
