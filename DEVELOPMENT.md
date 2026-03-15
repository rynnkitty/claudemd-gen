# DEVELOPMENT.md - 개발 진행 기록

> 이 문서는 프로젝트의 개발 과정을 추적합니다. 각 마일스톤별 완료 항목, 기술적 의사결정, 변경사항을 기록합니다.

## 커밋 컨벤션

모든 커밋은 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 따릅니다:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**타입**: feat, fix, test, docs, chore, refactor, style, perf

---

## 마일스톤 진행 현황

### M1: 프로젝트 셋업 ✅ 완료

**목표**: 모노레포 구조, Docker 환경, CI 파이프라인 구축

- [x] npm workspaces 모노레포 초기화
- [x] TypeScript 공유 설정 (tsconfig.base.json)
- [x] ESLint + Prettier 설정
- [x] packages/frontend - Vite + React + Tailwind 초기화
- [x] packages/backend - Express + TypeScript 초기화
- [x] packages/shared - 공유 타입 패키지 초기화
- [x] Docker Compose 설정 (frontend + backend)
- [x] GitHub Actions CI 워크플로우 (lint + type-check + test)

**기술 결정:**
| 결정 | 선택 | 대안 | 이유 |
|------|------|------|------|
| 모노레포 도구 | npm workspaces | Turborepo, Lerna | 추가 의존성 없이 npm 내장 기능만으로 충분 |
| 프론트엔드 빌드 | Vite | CRA, Next.js | SPA로 충분, SSR 불필요, 빠른 HMR |
| 상태 관리 | Zustand | Redux, Jotai | 보일러플레이트 최소, 러닝커브 낮음 |
| CSS | Tailwind CSS | styled-components | 반응형 기본 지원, 유틸리티 우선 |

**기술적 도전과제 및 해결:**

- **도전**: `packages/shared` 타입을 백엔드와 프론트엔드에서 동시에 참조할 때 TypeScript `moduleResolution: "Node16"` 에서 `.js` 확장자 요구로 빌드 오류 발생
  - **해결**: `tsconfig.json`의 `paths`에 `@claudemd-gen/shared` → `dist/index.d.ts` 명시적 매핑 추가. `package.json`의 `exports` 필드를 `{ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }` 구조로 정의하여 타입과 런타임 경로 일치

- **도전**: npm workspaces 환경에서 `tsc --build`(project references) 사용 시 각 패키지 빌드 순서 의존성 관리
  - **해결**: `vitest.workspace.ts`와 CI `type-check` 잡에서 shared를 먼저 빌드(`npm run build --workspace=packages/shared`)하는 단계를 명시적으로 분리

---

### M2: 분석 엔진 ✅ 완료

**목표**: 프로젝트 정적 분석 모듈 구현

- [x] StructureAnalyzer - 디렉토리 트리 생성 (최대 깊이·무시 패턴 적용)
- [x] TechStackAnalyzer - 기술 스택 감지 (15+ 스택 지원)
- [x] DependencyAnalyzer - 의존성 추출 및 분류 (npm, pip, Go, Cargo)
- [x] ConfigAnalyzer - 설정 파일 파싱 (JSON/TOML/YAML)
- [x] ArchitectureAnalyzer - 아키텍처 패턴 감지 (MVC, Clean, monorepo 등)
- [x] AnalysisOrchestrator - 병렬 분석기 통합 실행
- [x] 각 분석기 단위 테스트 작성
- [x] 테스트 픽스처 (sample-node-mvc, sample-react-vite, sample-python-flask)

**지원 기술 스택 목록:**
```
JavaScript/TypeScript: package.json, tsconfig.json
Python: requirements.txt, pyproject.toml, setup.py, Pipfile
Go: go.mod
Rust: Cargo.toml
Java: pom.xml, build.gradle
Ruby: Gemfile
PHP: composer.json
```

**기술적 도전과제 및 해결:**

- **도전**: `fs.readdir`로 재귀 탐색 시 심볼릭 링크 순환 참조 가능성 + 대용량 프로젝트에서 5,000개 파일 제한 초과 처리
  - **해결**: `withFileTypes: true` 옵션으로 `Dirent` 객체를 활용해 심볼릭 링크를 파일로만 처리(재귀 미진입). 파일 카운터를 재귀 상태로 공유하여 `MAX_FILE_COUNT` 초과 시 즉시 탐색 중단

- **도전**: Python `requirements.txt`의 다양한 버전 표기 형식(`==1.0`, `>=1.0,<2.0`, `package[extra]~=1.4`) 파싱 불일치
  - **해결**: 정규식 `^([A-Za-z0-9_.-]+)(\[.*?\])?\s*([>=<!~^]{0,2}\s*[\d.]+.*)?$`로 패키지명·extras·버전을 분리 파싱. 빈 버전은 `"*"`로 정규화

- **도전**: ArchitectureAnalyzer가 디렉토리 이름만으로 패턴을 판단할 때, `packages/` 디렉토리를 가진 monorepo와 MVC 패턴이 동시에 매칭되는 중복 탐지
  - **해결**: monorepo 패턴을 최우선으로 평가(early-return). monorepo 감지 시 하위 패키지별로 재탐색하여 패키지 목록을 `packages[]`에 기록

---

### M3: 문서 생성기 ✅ 완료

**목표**: 분석 결과 기반 CLAUDE.md, PRD 생성

- [x] Markdown 템플릿 시스템 구현 (순수 함수 기반)
- [x] ClaudeMdGenerator 구현 (11개 섹션)
- [x] PrdGenerator 구현 (8개 섹션)
- [x] 기술 스택·아키텍처 기반 내용 자동 추론
- [x] 단위 테스트 작성 (86개 테스트)

**기술적 도전과제 및 해결:**

- **도전**: 템플릿 함수가 `ProjectInfo` 전체를 인자로 받으면 테스트 작성 시 모든 필드를 채워야 해서 픽스처가 거대해지는 문제
  - **해결**: 각 `render*` 함수가 필요한 필드만 구조 분해 인자로 받도록 시그니처 분리(`renderTechStack(techStack: TechStack)`). 테스트에서 관심사 외 필드를 제거 가능

- **도전**: `scripts[]` 배열에서 `dev`, `start`, `build`, `test`, `lint` 등 우선순위 순으로 정렬된 개발 명령어 섹션 생성 시, 프로젝트마다 스크립트 이름이 상이(`dev:backend`, `serve` 등)
  - **해결**: 우선순위 키워드 배열 `['dev', 'start', 'build', 'test', 'lint', 'type-check', 'preview']`를 정의하고, 스크립트 이름이 해당 키워드를 포함하는지 `includes()`로 매칭 후 우선순위 인덱스로 정렬

---

### M4: Express API 서버 ✅ 완료

**목표**: REST API 서버 구현

- [x] POST /api/analyze - GitHub URL / 로컬 경로 분석
- [x] POST /api/analyze/upload - ZIP 파일 업로드 분석
- [x] GET /api/health - 헬스 체크
- [x] AppError 클래스 + 전역 에러 핸들러 미들웨어
- [x] 요청 유효성 검사 미들웨어
- [x] git.util.ts (shallow clone), file.util.ts (ZIP 추출 + path traversal 방지)
- [x] analyze.service.ts - 소스 타입별 분기, 임시파일 정리
- [x] 통합 테스트 작성 (supertest)

**기술적 도전과제 및 해결:**

- **도전**: ZIP 업로드 시 `../../etc/passwd` 같은 path traversal 공격으로 서버 임시 디렉토리 외부 파일 덮어쓰기 가능성
  - **해결**: `adm-zip`으로 각 엔트리를 추출 전에 `path.normalize(entry.entryName)`이 `../`를 포함하는지 검사. 위반 시 `AppError(ANALYSIS_READ_FAILED, 400)` 즉시 throw

- **도전**: GitHub clone 중 네트워크 오류 발생 시 임시 디렉토리가 정리되지 않고 디스크 누수 발생
  - **해결**: `analyze.service.ts`의 `finally` 블록에서 항상 `cleanupDir(tempDir)`를 호출. multer 업로드 파일도 동일 `finally`에서 `cleanupFile(uploadedFilePath)` 처리

- **도전**: Express 4에서 `async` 라우트 핸들러의 미처리 Promise rejection이 글로벌 에러 핸들러에 도달하지 않는 문제
  - **해결**: `asyncHandler` 래퍼 함수 구현 — `fn(req, res, next).catch(next)` 패턴으로 rejection을 Express `next(err)`로 전달

---

### M5: 테스트 & Docker ✅ 완료

**목표**: 테스트 커버리지 확보 및 컨테이너화

- [x] 백엔드 통합 테스트 (API 엔드포인트 13개)
- [x] 라인 커버리지 80% 이상 달성 (현재 95.69%)
- [x] Dockerfile.frontend — multi-stage (node → nginx)
- [x] Dockerfile.backend — multi-stage (node build → node runtime + git)
- [x] docker-compose.yml — healthcheck, depends_on, 브리지 네트워크
- [x] nginx.conf — SPA 라우팅 + /api/ 프록시
- [x] GitHub Actions CI (lint + type-check + test 병렬)
- [x] GitHub Actions CD (Docker 이미지 빌드·푸시, sha 태그)

**기술적 도전과제 및 해결:**

- **도전**: ESM 환경에서 `adm-zip`과 `child_process` 같은 Node 내장 모듈을 Vitest로 모킹할 때 `vi.mock()` 호이스팅 문제 — import 선언보다 늦게 실행되어 실제 모듈이 먼저 로드됨
  - **해결**: `vi.hoisted()` 를 사용해 모킹 팩토리를 최상단으로 끌어올림. `file.util.mocked.unit.test.ts`에 adm-zip 모킹 케이스를 별도 파일로 분리하여 실제 파일시스템 테스트(`file.util.unit.test.ts`)와 충돌 방지

- **도전**: Docker multi-stage 빌드에서 백엔드 이미지가 런타임에 `git clone`을 실행해야 하므로 최종 이미지에 `git` 바이너리가 필요했으나, node:alpine 기본 이미지에는 미포함
  - **해결**: runtime 스테이지에서 `apk add --no-cache git`으로 git만 추가 설치. 불필요한 빌드 도구는 builder 스테이지에만 존재하도록 분리하여 이미지 크기 최소화

- **도전**: nginx에서 React SPA 라우팅(`/result`, `/history` 등 클라이언트 경로) 요청 시 404 반환
  - **해결**: `nginx.conf`에 `try_files $uri $uri/ /index.html` 설정으로 모든 정적 경로 미매칭 시 `index.html` 반환. `/api/` prefix는 `location /api/`로 upstream 백엔드로 프록시

---

### M6: 문서화 & 정리 ✅ 완료

**목표**: 최종 문서화 및 코드 정리

- [x] README.md — Mermaid 아키텍처 다이어그램, CI 배지, API 응답 예시 추가
- [x] CLAUDE.md — 실제 프로젝트 반영 업데이트
- [x] TESTING.md — 214개 테스트 케이스 목록, 커버리지 95.69% 상세 문서화
- [x] DEVELOPMENT.md — 마일스톤별 기술적 도전과제·해결 과정, ADR 5개
- [x] 불필요한 console.log 제거
- [x] vitest 커버리지 thresholds 설정 (lines/branches/functions/statements ≥ 80%)
- [x] 모든 테스트 통과 확인 (214개)
- [x] GitHub Actions CI — 커버리지 아티팩트 업로드 + GITHUB_STEP_SUMMARY 게시

---

## 핵심 구현 코드 스니펫

### 병렬 분석기 실행 (AnalysisOrchestrator)

```typescript
// packages/backend/src/analyzers/index.ts
const [tree, techStack, dependencies, configFiles] = await Promise.all([
  this.structure.analyze(resolvedPath, { maxDepth: options.maxDepth ?? 5 }),
  this.techStack.analyze(resolvedPath),
  this.dependency.analyze(resolvedPath, { includeDevDeps: options.includeDevDeps ?? true }),
  this.config.analyze(resolvedPath),
]);
// architecture는 tree에 의존하므로 직렬 실행
const architectureInfo = this.architecture.analyze(tree);
```

### path traversal 방지 (file.util.ts)

```typescript
// packages/backend/src/utils/file.util.ts
for (const entry of zip.getEntries()) {
  const normalized = path.normalize(entry.entryName);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new AppError(
      `ZIP entry path traversal detected: ${entry.entryName}`,
      ApiErrorCode.ANALYSIS_READ_FAILED,
      400,
    );
  }
}
zip.extractAllTo(targetDir, true);
```

### async 라우트 에러 전파 (error-handler.ts)

```typescript
// packages/backend/src/middlewares/error-handler.ts
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);  // Promise rejection → Express next(err)
  };
}
```

### ESM 환경 vi.hoisted() 모킹 패턴 (git.util.unit.test.ts)

```typescript
// packages/backend/src/utils/git.util.unit.test.ts
const execFileMock = vi.hoisted(() => vi.fn()); // ← import보다 먼저 실행
vi.mock('node:child_process', () => ({ execFile: execFileMock }));
import { shallowClone } from './git.util.js'; // ← mock이 이미 적용됨
```

---

## 기술적 의사결정 기록 (ADR)

### ADR-001: 모노레포 구조 채택
- **상태**: 승인
- **컨텍스트**: 프론트엔드와 백엔드가 TypeScript 타입을 공유해야 함
- **결정**: npm workspaces 기반 모노레포
- **결과**: 공유 타입 패키지로 API 계약 일원화, 빌드 스크립트 통합

### ADR-002: LLM API 미사용 결정
- **상태**: 승인
- **컨텍스트**: 문서 생성 시 LLM을 사용할지 정적 분석만으로 할지
- **결정**: v1은 정적 분석 + 템플릿 기반, LLM 없이 독립 실행
- **결과**: 외부 API 키 불필요, 오프라인 동작 가능, 결과 일관성 보장

### ADR-003: Docker 기반 배포
- **상태**: 승인
- **컨텍스트**: 독립 실행 환경 보장이 요구사항
- **결정**: Docker Compose로 frontend(nginx) + backend(node) 구성
- **결과**: `docker compose up` 한 줄로 전체 스택 구동

### ADR-004: AdmZip 선택 (ZIP 처리)
- **상태**: 승인
- **컨텍스트**: ZIP 파일 압축 해제 라이브러리 선택
- **결정**: adm-zip (순수 Node.js, 시스템 바이너리 의존성 없음)
- **결과**: Docker 이미지에 unzip 등 추가 패키지 설치 불필요

### ADR-005: 테스트 파일 네이밍 컨벤션
- **상태**: 승인
- **결정**: `*.unit.test.ts` / `*.integ.test.ts` 접미사로 단위·통합 테스트 구분
- **결과**: `npm run test:unit` / `npm run test:integ` 명령으로 선택 실행 가능

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-03-13 | 프로젝트 초기화, 모노레포 구조 구축 (M1) |
| 2026-03-13 | 분석 엔진 5개 모듈 + 오케스트레이터 구현 (M2) |
| 2026-03-13 | CLAUDE.md / PRD 생성기 구현 (M3) |
| 2026-03-13 | Express API 서버 구현 (M4) |
| 2026-03-13 | Docker 환경, GitHub Actions CI/CD 구성 (M5) |
| 2026-03-13 | 테스트 커버리지 95.69% 달성, 문서 정리 (M6) |
| 2026-03-15 | DEVELOPMENT.md 마일스톤별 기술 도전과제 상세화 |
| 2026-03-15 | PRD.md 경쟁 분석 및 차별화 섹션 추가 |
| 2026-03-15 | TESTING.md 신규 작성 (214개 테스트 케이스 상세 문서화) |
| 2026-03-15 | README.md Mermaid 아키텍처 다이어그램, API 예시, CI 배지 추가 |
| 2026-03-15 | CI 커버리지 아티팩트 업로드 및 Job Summary 게시 추가 |
