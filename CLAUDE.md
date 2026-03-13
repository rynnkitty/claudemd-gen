# CLAUDE.md - AI 컨텍스트 파일

> 이 파일은 Claude Code가 프로젝트를 이해하고 효과적으로 작업하기 위한 컨텍스트를 제공합니다.

## 프로젝트 개요

**claudemd-gen**은 GitHub 저장소 또는 로컬 프로젝트를 정적 분석하여 CLAUDE.md와 PRD 초안을 자동 생성하는 풀스택 웹 애플리케이션입니다.

- **목적**: AI 개발 도구가 프로젝트를 이해하는 데 필요한 컨텍스트 문서를 자동화
- **사용자**: Claude Code 사용 개발자, 팀 리더, 오픈소스 메인테이너
- **핵심 가치**: 수동 문서 작성 부담 제거, 항상 최신 상태의 AI 컨텍스트 유지

## 기술 스택

- **언어**: TypeScript 5.x (프론트엔드 + 백엔드 모두)
- **프론트엔드**: React 18, Vite 5, Tailwind CSS 3
- **백엔드**: Node.js 20, Express 4
- **테스트**: Vitest, React Testing Library, supertest
- **빌드**: Vite (프론트엔드), tsx (백엔드 dev), tsc (백엔드 빌드)
- **패키지 관리**: npm workspaces (모노레포)
- **컨테이너**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## 디렉토리 구조

```
claudemd-gen/
├── packages/
│   ├── frontend/                 # React SPA
│   │   ├── src/
│   │   │   ├── components/       # 재사용 UI 컴포넌트
│   │   │   │   ├── ui/           # 기본 UI (Button, Input, Card 등)
│   │   │   │   ├── layout/       # 레이아웃 (Header, Footer, Sidebar)
│   │   │   │   └── features/     # 기능별 컴포넌트
│   │   │   ├── pages/            # 라우트별 페이지 컴포넌트
│   │   │   ├── hooks/            # 커스텀 React 훅
│   │   │   ├── services/         # API 호출 모듈 (axios 인스턴스)
│   │   │   ├── stores/           # 상태 관리 (zustand)
│   │   │   ├── types/            # 프론트엔드 전용 타입
│   │   │   └── utils/            # 유틸리티 함수
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   ├── backend/                  # Express API 서버
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── analyze.route.ts         # POST /api/analyze, POST /api/analyze/upload
│   │   │   │   └── health.route.ts          # GET /api/health
│   │   │   ├── services/
│   │   │   │   └── analyze.service.ts       # 소스 타입별 분기, 임시파일 정리
│   │   │   ├── analyzers/        # 분석 모듈 (각 관심사별 분리)
│   │   │   │   ├── structure.analyzer.ts    # 디렉토리 구조 분석
│   │   │   │   ├── techstack.analyzer.ts    # 기술 스택 감지
│   │   │   │   ├── dependency.analyzer.ts   # 의존성 분석
│   │   │   │   ├── config.analyzer.ts       # 설정 파일 파싱
│   │   │   │   ├── architecture.analyzer.ts # 아키텍처 패턴 감지
│   │   │   │   └── index.ts                 # 분석기 통합 오케스트레이터
│   │   │   ├── generators/       # 문서 생성 모듈
│   │   │   │   ├── claude-md.generator.ts   # CLAUDE.md 생성
│   │   │   │   ├── prd.generator.ts         # PRD 생성
│   │   │   │   └── templates/               # Markdown 템플릿
│   │   │   │       ├── claude-md.template.ts
│   │   │   │       └── prd.template.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── error-handler.ts         # AppError, asyncHandler, errorHandler
│   │   │   │   └── validator.ts             # validateAnalyzeRequest
│   │   │   ├── utils/
│   │   │   │   ├── file.util.ts             # createTempDir, cleanupDir, extractZip
│   │   │   │   └── git.util.ts              # shallowClone (--depth=1)
│   │   │   ├── types/            # 백엔드 전용 타입
│   │   │   ├── app.ts            # Express 앱 설정
│   │   │   └── server.ts         # 서버 진입점 (포트 바인딩)
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── shared/                   # 공유 코드
│       └── src/
│           ├── types/            # API 요청/응답 타입, 공통 인터페이스
│           └── constants/        # 무시 패턴, 지원 스택 목록 등
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
├── .github/workflows/
│   ├── ci.yml                    # PR: lint + type-check + test
│   └── cd.yml                    # main merge: build + docker push
├── vitest.workspace.ts           # Vitest 워크스페이스 설정
├── package.json                  # 루트 (workspaces 설정)
├── tsconfig.base.json            # 공유 TS 설정
└── .eslintrc.cjs                 # 공유 ESLint 설정
```

## 핵심 모듈 설명

### 분석기 (packages/backend/src/analyzers/)
각 분석기는 독립적으로 동작하며, `AnalyzerResult` 인터페이스를 구현합니다.

```typescript
interface Analyzer {
  name: string;
  analyze(projectPath: string): Promise<AnalyzerResult>;
}
```

- **StructureAnalyzer**: fs.readdir로 재귀 탐색, ignore 패턴 적용, 트리 구조 반환
- **TechStackAnalyzer**: 패키지 매니저 파일(package.json, pyproject.toml 등) 감지 → 스택 매핑
- **DependencyAnalyzer**: 의존성 파일 파싱, 프로덕션/개발 분류
- **ConfigAnalyzer**: tsconfig, eslint, prettier 등 설정 파일 수집 및 요약
- **ArchitectureAnalyzer**: 디렉토리 이름 패턴으로 아키텍처 추론 (MVC, Clean 등)

### 생성기 (packages/backend/src/generators/)
분석 결과를 입력받아 Markdown 문서를 생성합니다.

```typescript
interface Generator {
  generate(analysis: ProjectAnalysis): string;
}
```

- **ClaudeMdGenerator**: CLAUDE.md 템플릿에 분석 결과 주입
- **PrdGenerator**: PRD 템플릿에 분석 결과 주입

## 개발 명령어

```bash
# 개발 서버 (프론트엔드 5173 + 백엔드 4000)
npm run dev

# 테스트
npm run test              # 전체
npm run test:unit         # 단위 테스트만
npm run test:integ        # 통합 테스트만
npm run test -- --watch   # 워치 모드

# 코드 품질
npm run lint              # ESLint
npm run type-check        # tsc --noEmit

# 빌드
npm run build             # 프로덕션 빌드
npm run build:frontend    # 프론트엔드만
npm run build:backend     # 백엔드만

# Docker
docker compose up         # 전체 실행
docker compose up --build # 재빌드 후 실행
```

## 코딩 컨벤션

### 일반
- **들여쓰기**: 2 spaces
- **줄바꿈**: LF (Unix)
- **파일명**: kebab-case (예: `tech-stack.analyzer.ts`)
- **클래스명**: PascalCase
- **변수/함수명**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **타입/인터페이스**: PascalCase, `I` 접두사 사용하지 않음

### TypeScript
- `any` 사용 금지 → `unknown`으로 대체 후 타입 가드 사용
- 모든 함수에 반환 타입 명시
- barrel export (index.ts) 활용

### React
- 함수형 컴포넌트 + 훅만 사용
- 컴포넌트 파일 하나에 하나의 컴포넌트만
- Props 타입은 컴포넌트 파일 상단에 정의

### 커밋 메시지
Conventional Commits 형식:
```
feat(analyzer): 기술 스택 감지 모듈 추가
fix(generator): CLAUDE.md 템플릿 누락 섹션 수정
test(api): /api/analyze 통합 테스트 추가
docs: README 설치 가이드 업데이트
chore: ESLint 설정 업데이트
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스 체크 |
| POST | `/api/analyze` | GitHub URL 또는 로컬 경로 분석 |
| POST | `/api/analyze/upload` | ZIP 파일 업로드 후 분석 (multipart/form-data, field: `file`) |

## 환경 변수

```env
# Backend
PORT=4000                          # API 서버 포트 (기본값)
MAX_FILE_SIZE=52428800             # 업로드 제한 (50MB, bytes)

# Frontend
VITE_API_URL=http://localhost:4000 # 백엔드 API URL
```

## 에러 처리 패턴

```typescript
// AppError — ApiErrorCode + HTTP 상태코드 포함
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  constructor(message: string, code: ApiErrorCode, statusCode: number) { ... }
}

// asyncHandler — Express 4 async 라우트 에러 전파
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => { fn(req, res, next).catch(next); };
}

// 에러 코드 체계 (ApiErrorCode enum in packages/shared)
// ANALYSIS_xxx: 분석 관련 (ANALYSIS_CLONE_FAILED, ANALYSIS_READ_FAILED)
// GENERATE_xxx: 생성 관련
// INPUT_xxx: 입력 검증 관련 (INPUT_INVALID_URL, INPUT_INVALID_PATH, INPUT_FILE_TOO_LARGE)
// SYSTEM_xxx: 시스템 에러 (SYSTEM_INTERNAL)
```

## 테스트 전략

- **파일 네이밍**: `*.unit.test.ts` (단위), `*.integ.test.ts` (통합) — 선택 실행 가능
- **단위 테스트**: 각 분석기, 생성기, 미들웨어, 유틸 모듈별 독립 테스트
- **통합 테스트**: API 엔드포인트 → 분석 → 생성 전체 플로우 (supertest)
- **테스트 픽스처**: `packages/backend/src/__fixtures__/` 에 샘플 프로젝트 3종 (sample-node-mvc, sample-react-vite, sample-python-flask)
- **커버리지**: 라인 80% 이상 (thresholds 설정됨, 현재 95%+)
- **모킹**: `vi.hoisted()` + `vi.mock()` ESM 패턴 사용 (adm-zip, child_process)

## 알려진 제약사항

- 퍼블릭 GitHub 저장소만 지원 (프라이빗은 v2)
- 분석 대상 파일 수 최대 5,000개
- ZIP 업로드 최대 50MB
- 바이너리 파일은 분석에서 제외
