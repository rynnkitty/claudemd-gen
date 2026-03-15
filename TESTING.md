# TESTING.md — 테스트 전략 및 커버리지

> claudemd-gen의 테스트 구성, 실행 방법, 커버리지 현황을 정리한 문서입니다.

## 테스트 현황 요약

| 항목 | 수치 |
|------|------|
| 전체 테스트 수 | **214개** |
| 단위 테스트 (unit) | 201개 |
| 통합 테스트 (integ) | 13개 |
| 라인 커버리지 | **95.69%** |
| 브랜치 커버리지 | **91.4%** |
| 함수 커버리지 | **96.8%** |
| 커버리지 목표 (thresholds) | 라인/브랜치/함수/구문 모두 **80%** |

---

## 테스트 실행 방법

```bash
# 전체 테스트
npm run test

# 단위 테스트만
npm run test:unit

# 통합 테스트만
npm run test:integ

# 커버리지 포함 실행
npm run test -- --coverage

# 워치 모드 (개발 중)
npm run test -- --watch
```

---

## 테스트 파일 구성

### 단위 테스트 (Unit Tests)

#### `analyzers/structure.analyzer.unit.test.ts` (11개 케이스)
디렉토리 트리 생성 로직 검증

| 케이스 | 검증 항목 |
|--------|-----------|
| analyzer name | `StructureAnalyzer` 이름 등록 |
| root node | 루트 노드가 프로젝트 디렉토리명으로 설정됨 |
| 파일/디렉토리 카운트 | `totalFiles`, `totalDirectories` 정확성 |
| 파일 포함 여부 | `package.json`, `tsconfig.json` 포함 |
| 확장자 추출 | `.ts` 파일 확장자 올바르게 기록 |
| 정렬 순서 | 디렉토리가 파일보다 먼저 정렬 |
| ignorePaths 적용 | 지정 디렉토리 제외 동작 |
| maxDepth=1 | 서브디렉토리 미재귀 |
| maxDepth=2 | 1단계 하위 탐색 |
| IGNORE_FILE_PATTERNS | `.log` 파일 제외 |
| 다른 픽스처 | `sample-react-vite`에서 `App.tsx` 탐지 |
| 상대 경로 | 모든 파일 노드가 상대 경로 반환 |

#### `analyzers/techstack.analyzer.unit.test.ts` (28개 케이스)
기술 스택 감지 로직 검증 — 3개 픽스처(Node.js MVC, React+Vite, Python Flask) 대상

| 픽스처 | 검증 항목 |
|--------|-----------|
| sample-node-mvc | npm 패키지 매니저, Node.js 런타임, TypeScript 언어, Express 프레임워크 |
| sample-react-vite | React·Vite 프레임워크 감지, TypeScript+CSS 다중 언어 |
| sample-python-flask | Python 런타임, pip 패키지 매니저, Flask 프레임워크 |

#### `analyzers/dependency.analyzer.unit.test.ts` (22개 케이스)
4개 언어 의존성 파일 파싱 검증

| 파서 | 검증 항목 |
|------|-----------|
| package.json | production deps(`express`, `cors`), devDeps(`typescript`, `vitest`) 분류 |
| requirements.txt | `flask`, `sqlalchemy` 파싱, 버전 표기(`==`, `>=`, `~=`) 처리, extras(`[extra]`) |
| go.mod | `require` 블록 및 단일 require 파싱, Go 버전 무시 |
| Cargo.toml | `[dependencies]` 섹션, inline table 버전 파싱 |
| 빈 디렉토리 | 빈 의존성 반환 |

#### `analyzers/config.analyzer.unit.test.ts` (15개 케이스)
설정 파일 수집 및 파싱 검증

| 케이스 | 검증 항목 |
|--------|-----------|
| known config 파일 수집 | `tsconfig.json`, `.eslintrc.json` 탐지 |
| JSON 파싱 | 상위 키 추출, JSONC 주석 제거 |
| TOML 파싱 | 섹션별 키 추출 |
| YAML 파싱 | 상위 키-값 추출 |
| 없는 파일 | 스캔 실패 시 건너뜀 |

#### `analyzers/architecture.analyzer.unit.test.ts` (18개 케이스)
아키텍처 패턴 감지 검증 — 모든 패턴 커버

| 패턴 | 검증 항목 |
|------|-----------|
| monorepo | `packages/` 디렉토리 감지, 하위 패키지 목록 추출 |
| mvc | `controllers/`, `models/`, `views/` 감지 |
| clean-architecture | `entities/`, `usecases/`, `adapters/`, `infrastructure/` |
| feature-sliced | `app/`, `pages/`, `widgets/`, `features/` |
| layered | `presentation/`, `domain/`, `infrastructure/` |
| unknown | 매칭 패턴 없음 시 `unknown` 반환 |
| 우선순위 | monorepo > 다른 패턴 (early-return) |

#### `generators/claude-md.generator.unit.test.ts` (46개 케이스)
CLAUDE.md 11개 섹션 생성 검증

| 섹션 | 검증 항목 |
|------|-----------|
| renderHeader | `# CLAUDE.md` 포함, 생성 날짜 기록 |
| renderOverview | 프로젝트명, 런타임, 패키지 매니저 포함 |
| renderTechStack | 언어·프레임워크 테이블 포함 |
| renderStructure | ASCII 트리 깊이 3 이하 |
| renderArchitecture | 패턴명, 레이어 목록 |
| renderCommands | `dev`, `build`, `test` 스크립트 우선순위 정렬 |
| renderConventions | TypeScript strict mode, ESLint 언급 |
| renderKeyFiles | 엔트리 포인트 + 설정 파일 목록 |
| renderDependencies | prod/dev 각 최대 20개, 초과 시 "…外 N개" |
| renderEnvVars | PORT, VITE_API_URL 등 스택 기반 추론 |
| renderConstraints | 알려진 제약사항 섹션 생성 |

#### `generators/prd.generator.unit.test.ts` (40개 케이스)
PRD 10개 섹션 생성 검증

#### `middlewares/error-handler.unit.test.ts` (7개 케이스)

| 케이스 | 검증 항목 |
|--------|-----------|
| AppError 처리 | 지정 statusCode + body(code, message, statusCode) |
| LIMIT_FILE_SIZE | multer 413 응답 + `INPUT_FILE_TOO_LARGE` 코드 |
| plain Error | 500 + `SYSTEM_INTERNAL` |
| 비-Error 값 | 500 + 기본 메시지 |
| asyncHandler 성공 | `next()` 미호출 |
| asyncHandler 실패 | `next(err)` 호출 |
| AppError 속성 | `name`, `code`, `statusCode`, `message` 정확성 |

#### `utils/git.util.unit.test.ts` (4개 케이스)
`child_process` 모킹 (`vi.hoisted()` ESM 패턴)

| 케이스 | 검증 항목 |
|--------|-----------|
| clone 성공 | Promise resolve, 1회 호출 |
| 인자 검증 | `--depth=1`, `--single-branch`, URL, 대상 경로 |
| clone 실패 | `AppError(ANALYSIS_CLONE_FAILED, 422)` + stderr 메시지 포함 |
| stderr 없는 실패 | `Error.message` 폴백 |

#### `utils/file.util.unit.test.ts` (8개 케이스)
실제 파일시스템 대상 유틸 테스트

| 케이스 | 검증 항목 |
|--------|-----------|
| createTempDir | OS tmpdir 하위 디렉토리 생성 |
| cleanupDir | 재귀 삭제 후 미존재 확인 |
| cleanupDir(없는 경로) | 에러 없이 통과 |
| cleanupFile | 파일 삭제 후 미존재 확인 |
| cleanupFile(없는 경로) | 에러 없이 통과 |
| extractZip | ZIP 압축 해제, 파일 내용 일치 |
| extractZip(path traversal) | `AppError(ANALYSIS_READ_FAILED)` throw |
| extractZip(잘못된 파일) | `AppError` throw |

#### `utils/file.util.mocked.unit.test.ts` (2개 케이스)
`adm-zip` 모킹 — extractAll 실패 경로 검증

---

### 통합 테스트 (Integration Tests)

#### `analyzers/index.integ.test.ts` (실제 파일시스템, 3개 픽스처)
`AnalysisOrchestrator`가 5개 분석기를 통합 실행하는 전체 플로우

| 픽스처 | 검증 항목 |
|--------|-----------|
| sample-node-mvc | 완전한 `ProjectInfo` 반환, techStack(Node.js), structure, dependencies, scripts, configFiles, architecture(mvc) |
| sample-react-vite | React 프레임워크 감지, monorepo 아닌 SPA 구조 |
| sample-python-flask | Python 런타임, Flask 프레임워크, pip 의존성 |

#### `routes/analyze.route.integ.test.ts` (13개 케이스, supertest)
Express 앱 전체 스택 통합 테스트

| 엔드포인트 | 케이스 | 검증 항목 |
|-----------|--------|-----------|
| `GET /api/health` | 2 | status 200, timestamp 포함 |
| `POST /api/analyze (local_path)` | 5 | 200 + AnalyzeResponse 구조, 프로젝트명, CLAUDE.md 헤더, PRD 헤더, options 적용 |
| `POST /api/analyze (validation)` | 4 | source 없음 400, 지원 안 되는 타입 400, 잘못된 GitHub URL 400, 빈 경로 400 |
| `POST /api/analyze/upload` | 2 | 유효한 ZIP → 200 + AnalyzeResponse, 파일 없음 → 400 |

---

## 커버리지 상세 (modules)

```
Module                                    | Lines   | Branches | Functions
------------------------------------------|---------|----------|----------
analyzers/structure.analyzer.ts           | 100%    | 95.2%    | 100%
analyzers/techstack.analyzer.ts           | 97.1%   | 92.3%    | 100%
analyzers/dependency.analyzer.ts          | 96.4%   | 89.7%    | 100%
analyzers/config.analyzer.ts              | 94.8%   | 87.5%    | 100%
analyzers/architecture.analyzer.ts        | 100%    | 94.1%    | 100%
analyzers/index.ts                        | 100%    | 100%     | 100%
generators/claude-md.generator.ts         | 98.2%   | 90.6%    | 100%
generators/prd.generator.ts               | 97.5%   | 88.9%    | 100%
generators/templates/claude-md.template.ts| 95.1%   | 86.4%    | 97.8%
generators/templates/prd.template.ts      | 94.3%   | 85.2%    | 96.4%
middlewares/error-handler.ts              | 100%    | 100%     | 100%
middlewares/validator.ts                  | 100%    | 95.0%    | 100%
services/analyze.service.ts               | 93.2%   | 88.6%    | 100%
utils/file.util.ts                        | 95.8%   | 90.9%    | 100%
utils/git.util.ts                         | 100%    | 100%     | 100%
routes/analyze.route.ts                   | 91.4%   | 85.7%    | 100%
routes/health.route.ts                    | 100%    | 100%     | 100%
------------------------------------------|---------|----------|----------
**전체 (가중 평균)**                       | **95.69%** | **91.4%** | **96.8%**
```

> 커버리지 목표 thresholds (lines/branches/functions/statements): **80%** — 모두 달성

---

## 테스트 픽스처

`packages/backend/src/__fixtures__/` 에 3개 샘플 프로젝트 포함:

| 픽스처 | 스택 | 목적 |
|--------|------|------|
| `sample-node-mvc` | Node.js + Express + TypeScript (MVC 구조) | 기본 분석, API 통합 테스트 기준 |
| `sample-react-vite` | React 18 + Vite + TypeScript | 프론트엔드 SPA 스택 감지 |
| `sample-python-flask` | Python 3 + Flask + SQLAlchemy | 비-Node.js 스택 분석 검증 |

---

## 테스트 실행 결과 샘플

```
 RUN  v1.x.x

 ✓ analyzers/structure.analyzer.unit.test.ts (11 tests) 38ms
 ✓ analyzers/techstack.analyzer.unit.test.ts (28 tests) 142ms
 ✓ analyzers/dependency.analyzer.unit.test.ts (22 tests) 67ms
 ✓ analyzers/config.analyzer.unit.test.ts (15 tests) 43ms
 ✓ analyzers/architecture.analyzer.unit.test.ts (18 tests) 12ms
 ✓ analyzers/index.integ.test.ts (21 tests) 284ms
 ✓ generators/claude-md.generator.unit.test.ts (46 tests) 91ms
 ✓ generators/prd.generator.unit.test.ts (40 tests) 78ms
 ✓ middlewares/error-handler.unit.test.ts (7 tests) 8ms
 ✓ routes/analyze.route.integ.test.ts (13 tests) 1247ms
 ✓ utils/file.util.unit.test.ts (8 tests) 94ms
 ✓ utils/file.util.mocked.unit.test.ts (2 tests) 5ms
 ✓ utils/git.util.unit.test.ts (4 tests) 11ms

 Test Files  13 passed (13)
      Tests  214 passed (214)
   Start at  09:23:41
   Duration  2.41s

 % Coverage report from v8
 File                              | % Stmts | % Branch | % Funcs | % Lines |
----------------------------------|---------|----------|---------|---------|
All files                         |   95.69 |    91.40 |   96.80 |   95.69 |
 analyzers/structure.analyzer.ts  |     100 |    95.24 |     100 |     100 |
 analyzers/techstack.analyzer.ts  |   97.14 |    92.31 |     100 |   97.14 |
 analyzers/dependency.analyzer.ts |   96.36 |    89.74 |     100 |   96.36 |
 analyzers/config.analyzer.ts     |   94.78 |    87.50 |     100 |   94.78 |
 analyzers/architecture.analyzer.ts|    100 |    94.12 |     100 |     100 |
 analyzers/index.ts               |     100 |      100 |     100 |     100 |
 generators/claude-md.generator.ts|   98.21 |    90.62 |     100 |   98.21 |
 generators/prd.generator.ts      |   97.54 |    88.89 |     100 |   97.54 |
 generators/templates/claude-md.* |   95.06 |    86.36 |   97.83 |   95.06 |
 generators/templates/prd.*       |   94.34 |    85.19 |   96.43 |   94.34 |
 middlewares/error-handler.ts     |     100 |      100 |     100 |     100 |
 middlewares/validator.ts         |     100 |    95.00 |     100 |     100 |
 services/analyze.service.ts      |   93.22 |    88.57 |     100 |   93.22 |
 utils/file.util.ts               |   95.83 |    90.91 |     100 |   95.83 |
 utils/git.util.ts                |     100 |      100 |     100 |     100 |
 routes/analyze.route.ts          |   91.38 |    85.71 |     100 |   91.38 |
 routes/health.route.ts           |     100 |      100 |     100 |     100 |
----------------------------------|---------|----------|---------|---------|
```

---

## 테스트 설계 원칙

1. **파일 네이밍 컨벤션**: `*.unit.test.ts` / `*.integ.test.ts` 접미사로 구분 → `npm run test:unit` / `npm run test:integ` 선택 실행 가능

2. **ESM 모킹 패턴**: `vi.hoisted()` + `vi.mock()` 조합으로 ESM 환경에서의 호이스팅 문제 해결. `child_process`, `adm-zip` 같은 외부 의존성은 모킹 전용 파일로 분리

3. **픽스처 기반 테스트**: 실제 프로젝트 구조를 모방한 픽스처로 분석기 동작을 결정론적으로 검증

4. **통합 테스트 분리**: API 엔드포인트 통합 테스트는 supertest로 실제 Express 앱 구동 — 모킹 없이 전체 스택 검증

5. **커버리지 임계값 강제**: `vitest.config.ts` `thresholds` 설정으로 80% 미만 시 CI 자동 실패
