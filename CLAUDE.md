# CLAUDE.md - AI 컨텍스트 파일

> 이 파일은 Claude Code가 프로젝트를 이해하고 효과적으로 작업하기 위한 컨텍스트를 제공합니다.

## 프로젝트 개요

**claudemd-gen**은 GitHub 저장소 또는 로컬 프로젝트를 정적 분석하여 CLAUDE.md와 PRD 초안을 자동 생성하는 풀스택 웹 애플리케이션입니다.

- **목적**: AI 개발 도구가 프로젝트를 이해하는 데 필요한 컨텍스트 문서를 자동화
- **사용자**: Claude Code 사용 개발자, 팀 리더, 오픈소스 메인테이너
- **핵심 가치**: 수동 문서 작성 부담 제거, 항상 최신 상태의 AI 컨텍스트 유지

---

## 구현 완료 현황

> **모든 핵심 기능이 구현 완료되어 동작합니다.**
> 백엔드 2,100+ LOC, 프론트엔드 535 LOC, 테스트 1,300+ LOC — 총 4,000+ LOC

### 백엔드 구현 파일 (`packages/backend/src/`)

| 파일 | 역할 | LOC |
|------|------|-----|
| `analyzers/structure.analyzer.ts` | `fs.readdir` 재귀 탐색, ignore 패턴, 깊이 제한 | 98 |
| `analyzers/techstack.analyzer.ts` | 락파일→패키지 매니저, 확장자→언어, deps→프레임워크 | 239 |
| `analyzers/dependency.analyzer.ts` | npm/pip/go.mod/Cargo.toml 파서 | 151 |
| `analyzers/config.analyzer.ts` | JSON/JSONC/TOML/YAML 설정 파일 수집·요약 | 138 |
| `analyzers/architecture.analyzer.ts` | 디렉토리명 패턴→MVC/Clean/monorepo 등 감지 | 92 |
| `analyzers/index.ts` | 4개 분석기 병렬 실행 오케스트레이터 | 145 |
| `generators/templates/claude-md.template.ts` | CLAUDE.md 11개 섹션 렌더 함수 (순수 함수) | 378 |
| `generators/templates/prd.template.ts` | PRD 10개 섹션 렌더 함수 (순수 함수) | 316 |
| `generators/claude-md.generator.ts` | 템플릿 함수 조합, `ProjectInfo → string` | 40 |
| `generators/prd.generator.ts` | 템플릿 함수 조합, `ProjectInfo → string` | 41 |
| `services/analyze.service.ts` | 소스 타입 분기, 임시파일 정리 (finally) | 91 |
| `routes/analyze.route.ts` | POST /api/analyze, POST /api/analyze/upload | 56 |
| `routes/health.route.ts` | GET /api/health | 18 |
| `middlewares/error-handler.ts` | AppError, asyncHandler, errorHandler | 73 |
| `middlewares/validator.ts` | validateAnalyzeRequest | 56 |
| `utils/file.util.ts` | createTempDir, cleanupDir, extractZip (path traversal 방지) | 69 |
| `utils/git.util.ts` | shallowClone (`--depth=1 --single-branch`) | 33 |
| `app.ts` | Express 앱, CORS, 라우터, 에러 핸들러 | 22 |
| `server.ts` | 포트 바인딩 진입점 | 12 |

### 프론트엔드 구현 (`packages/frontend/src/App.tsx`, 535 LOC)

단일 파일에 3개 화면과 전체 상태 관리가 구현되어 있습니다:

| 컴포넌트/기능 | 설명 |
|---------------|------|
| `InputScreen` | GitHub URL 입력 / ZIP 드래그앤드롭 (inputMode 전환) |
| `LoadingScreen` | 5단계 진행 애니메이션 (`spin`, `fadeUp` keyframes) |
| `ResultScreen` | CLAUDE.md / PRD 탭 전환, 복사/다운로드 버튼 |
| API 연동 | `POST /api/analyze` (JSON), `POST /api/analyze/upload` (FormData) |
| 에러 처리 | 네트워크/서버 에러 메시지 표시 |
| 커스텀 테마 | JetBrains Mono + Fraunces 폰트, `#c6f135` 액센트 다크 테마 |

### 공유 패키지 (`packages/shared/src/`)

| 파일 | 내용 |
|------|------|
| `types/api.ts` | `SourceType`, `AnalyzeRequest`, `AnalyzeResponse`, `ApiErrorCode` |
| `types/analysis.ts` | `ProjectInfo`, `DirectoryTree`, `TechStack`, `ArchitectureInfo` 등 |
| `constants/tech-stacks.ts` | 100+ npm 패키지→프레임워크 매핑, 7개 언어 지원 |
| `constants/ignore-patterns.ts` | 52개 무시 디렉토리, 33개 파일 패턴 |

### 테스트 (`packages/backend/src/**/*.test.ts`)

| 지표 | 수치 |
|------|------|
| 총 테스트 수 | **214개** |
| 단위 테스트 | 201개 (11개 파일) |
| 통합 테스트 | 13개 (2개 파일, supertest) |
| 라인 커버리지 | **95.69%** |
| 브랜치 커버리지 | **91.4%** |
| 커버리지 임계값 | lines/branches/functions/statements ≥ 80% (CI 강제) |

> 전체 테스트 케이스 목록 및 모듈별 커버리지 상세: [TESTING.md](./TESTING.md)

---

## 기술 스택

- **언어**: TypeScript 5.x (프론트엔드 + 백엔드 모두, `any` 사용 금지)
- **프론트엔드**: React 18, Vite 5, Tailwind CSS 3
- **백엔드**: Node.js 20, Express 4
- **테스트**: Vitest 1.x, supertest, @vitest/coverage-v8
- **빌드**: Vite (프론트엔드), tsx (백엔드 dev), tsc (백엔드 빌드)
- **패키지 관리**: npm workspaces (모노레포)
- **컨테이너**: Docker multi-stage, Docker Compose, nginx
- **CI/CD**: GitHub Actions (ci.yml, cd.yml)

---

## 디렉토리 구조

```
claudemd-gen/
├── packages/
│   ├── frontend/                 # React SPA
│   │   └── src/
│   │       ├── App.tsx           # ★ 메인 컴포넌트 (535 LOC: 3화면 + 전체 상태)
│   │       ├── main.tsx          # React 진입점
│   │       ├── index.css         # Tailwind + 커스텀 keyframes
│   │       └── test-setup.ts     # Vitest 설정
│   ├── backend/                  # Express API 서버
│   │   └── src/
│   │       ├── analyzers/        # ★ 5개 분석기 + 오케스트레이터 (863 LOC)
│   │       │   ├── index.ts                 # AnalysisOrchestrator (병렬 실행)
│   │       │   ├── structure.analyzer.ts
│   │       │   ├── techstack.analyzer.ts
│   │       │   ├── dependency.analyzer.ts
│   │       │   ├── config.analyzer.ts
│   │       │   └── architecture.analyzer.ts
│   │       ├── generators/       # ★ 문서 생성기 (775 LOC)
│   │       │   ├── claude-md.generator.ts
│   │       │   ├── prd.generator.ts
│   │       │   └── templates/
│   │       │       ├── claude-md.template.ts  # 11개 섹션 렌더 함수
│   │       │       └── prd.template.ts        # 10개 섹션 렌더 함수
│   │       ├── services/
│   │       │   └── analyze.service.ts        # 소스 타입별 분기 + 임시파일 정리
│   │       ├── routes/
│   │       │   ├── analyze.route.ts
│   │       │   └── health.route.ts
│   │       ├── middlewares/
│   │       │   ├── error-handler.ts          # AppError + asyncHandler + errorHandler
│   │       │   └── validator.ts
│   │       ├── utils/
│   │       │   ├── file.util.ts              # extractZip (path traversal 방지)
│   │       │   └── git.util.ts               # shallowClone
│   │       ├── __fixtures__/     # 테스트 픽스처 (3개 샘플 프로젝트)
│   │       │   ├── sample-node-mvc/
│   │       │   ├── sample-react-vite/
│   │       │   └── sample-python-flask/
│   │       ├── app.ts
│   │       └── server.ts
│   └── shared/                   # 공유 타입/상수
│       └── src/
│           ├── types/            # API + 분석 결과 타입
│           └── constants/        # ignore 패턴, 기술 스택 매핑
├── .github/workflows/
│   ├── ci.yml                    # PR: lint + type-check + test + coverage 아티팩트
│   └── cd.yml                    # main: Docker 빌드·GHCR 푸시 (matrix: frontend/backend)
├── docker-compose.yml            # healthcheck + depends_on + 브리지 네트워크
├── Dockerfile.frontend           # multi-stage: node build → nginx
├── Dockerfile.backend            # multi-stage: node build → node runtime + git
├── vitest.workspace.ts
├── tsconfig.base.json
├── .eslintrc.cjs
├── CLAUDE.md                     # ← 이 파일
├── README.md                     # Mermaid 아키텍처 + API 예시
├── PRD.md                        # 기능 명세 + 경쟁 분석
├── DEVELOPMENT.md                # 마일스톤별 기술 도전과제 + ADR 5개
└── TESTING.md                    # 214개 테스트 케이스 목록 + 커버리지 상세
```

---

## 핵심 모듈 설명

### 분석기 (packages/backend/src/analyzers/)

각 분석기는 독립적으로 동작하며 `AnalysisOrchestrator`가 4개를 병렬 실행합니다.

```typescript
// index.ts — Promise.all로 4개 분석기 병렬 실행
const [tree, techStack, dependencies, configFiles] = await Promise.all([
  this.structure.analyze(resolvedPath, options),
  this.techStack.analyze(resolvedPath),
  this.dependency.analyze(resolvedPath, options),
  this.config.analyze(resolvedPath),
]);
// ArchitectureAnalyzer는 tree에 의존하므로 직렬
const architectureInfo = this.architecture.analyze(tree);
```

- **StructureAnalyzer** (`98 LOC`): `fs.readdir({ withFileTypes: true })` 재귀 탐색, 52개 디렉토리·33개 파일 패턴 무시, maxDepth 적용
- **TechStackAnalyzer** (`239 LOC`): 락파일 우선순위(pnpm>yarn>npm), 28개 확장자→언어 매핑, 100+ npm 패키지→프레임워크 매핑
- **DependencyAnalyzer** (`151 LOC`): npm/pip(버전 표기 정규화)/go.mod(require 블록)/Cargo.toml(inline table) 파서
- **ConfigAnalyzer** (`138 LOC`): JSON/JSONC(주석 제거)/TOML(섹션 파싱)/YAML(상위 키 추출)
- **ArchitectureAnalyzer** (`92 LOC`): monorepo 우선 감지(early-return), 이후 mvc/clean/feature-sliced/layered 패턴 점수화

### 생성기 (packages/backend/src/generators/)

순수 함수 기반 템플릿 시스템으로 사이드이펙트 없이 테스트 가능합니다.

```typescript
// claude-md.template.ts — 각 섹션이 독립 순수 함수
export function renderTechStack(techStack: TechStack): string { ... }
export function renderCommands(scripts: ScriptInfo[]): string { ... }
// claude-md.generator.ts — 조합
export class ClaudeMdGenerator {
  generate(info: ProjectInfo): string {
    return [renderHeader(), renderOverview(info), renderTechStack(info.techStack), ...].join('\n\n');
  }
}
```

- **ClaudeMdGenerator** (`40 LOC` + template `378 LOC`): 11개 섹션, 스크립트 우선순위 정렬, 의존성 최대 20개+오버플로우 표시
- **PrdGenerator** (`41 LOC` + template `316 LOC`): 10개 섹션, 기술 스택 기반 목표/기능 자동 추론

---

## 개발 명령어

```bash
# 개발 서버 (프론트엔드 5173 + 백엔드 4000)
npm run dev

# 테스트
npm run test              # 전체 (214개)
npm run test:unit         # 단위 테스트 (201개)
npm run test:integ        # 통합 테스트 (13개)
npm run test -- --coverage # 커버리지 포함
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

---

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
- barrel export (`index.ts`) 활용

### React
- 함수형 컴포넌트 + 훅만 사용
- 인라인 스타일 + Tailwind 유틸리티 혼합 (테마 변수는 인라인)
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

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스 체크 |
| POST | `/api/analyze` | GitHub URL 또는 로컬 경로 분석 (`application/json`) |
| POST | `/api/analyze/upload` | ZIP 업로드 분석 (`multipart/form-data`, field: `file`) |

---

## 환경 변수

```env
# Backend
PORT=4000                          # API 서버 포트 (기본값)
MAX_FILE_SIZE=52428800             # 업로드 제한 (50MB, bytes)

# Frontend
VITE_API_URL=http://localhost:4000 # 백엔드 API URL
```

---

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
// INPUT_xxx:    INPUT_INVALID_URL | INPUT_INVALID_PATH | INPUT_FILE_TOO_LARGE | INPUT_UNSUPPORTED_TYPE
// ANALYSIS_xxx: ANALYSIS_CLONE_FAILED | ANALYSIS_TOO_MANY_FILES | ANALYSIS_READ_FAILED
// GENERATE_xxx: GENERATE_FAILED
// SYSTEM_xxx:   SYSTEM_INTERNAL | SYSTEM_TIMEOUT
```

---

## 테스트 전략

- **파일 네이밍**: `*.unit.test.ts` (단위), `*.integ.test.ts` (통합) — 선택 실행 가능
- **총 214개 테스트, 라인 커버리지 95.69%** (thresholds: 80% CI 강제)
- **단위 테스트** (201개): 각 분석기, 생성기, 미들웨어, 유틸 모듈별 독립 테스트
- **통합 테스트** (13개): supertest로 실제 Express 앱 → 분석 → 생성 전체 플로우 검증
- **테스트 픽스처**: `__fixtures__/` 에 3개 샘플 프로젝트 (node-mvc, react-vite, python-flask)
- **ESM 모킹**: `vi.hoisted()` + `vi.mock()` 패턴 (child_process, adm-zip)
- **커버리지 아티팩트**: CI `test` 잡에서 `packages/backend/coverage/` 아티팩트 업로드

> 전체 테스트 목록 및 모듈별 커버리지 상세 → [TESTING.md](./TESTING.md)

---

## CI/CD 파이프라인

### ci.yml (PR 트리거)
```
PR → [병렬]
  ├── Lint         : ESLint 검사
  ├── Type Check   : shared 빌드 → tsc --noEmit
  └── Test         : vitest run --coverage → coverage 아티팩트 업로드 + Job Summary
```

### cd.yml (main push 트리거)
```
main merge → [matrix: frontend / backend]
  ├── npm ci → shared 빌드 → 빌드 검증
  ├── Docker Buildx 설정
  ├── GHCR 로그인 (GITHUB_TOKEN)
  └── Docker 이미지 빌드·푸시
      태그: latest, sha-{short} → ghcr.io/{repo}/{frontend|backend}
```

---

## 알려진 제약사항

- 퍼블릭 GitHub 저장소만 지원 (프라이빗은 v2)
- 분석 대상 파일 수 최대 5,000개
- ZIP 업로드 최대 50MB
- 바이너리 파일은 분석에서 제외
- LLM API 미사용 (v1 정적 분석 전용, v2에서 AI 보강 예정)
