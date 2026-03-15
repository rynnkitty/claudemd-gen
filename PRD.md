# PRD: CLAUDE.md 자동 생성기 (claudemd-gen)

## 1. 문제 정의

### 1.1 배경
AI 기반 개발 도구(Claude Code, GitHub Copilot 등)가 프로젝트 컨텍스트를 정확히 이해하려면 `CLAUDE.md` 같은 AI 컨텍스트 파일이 필수적이다. 그러나 현실에서는:

- **수동 작성의 부담**: 개발자가 프로젝트 구조, 기술 스택, 컨벤션을 일일이 문서화해야 함
- **동기화 문제**: 코드가 변경되어도 문서가 갱신되지 않아 AI가 잘못된 컨텍스트를 참조
- **표준 부재**: CLAUDE.md에 무엇을 담아야 하는지 가이드라인이 없어 품질이 들쭉날쭉

### 1.2 해결하려는 문제
> GitHub 저장소 URL 또는 로컬 프로젝트 경로를 입력하면, 코드를 정적 분석하여 **CLAUDE.md와 PRD 초안을 자동 생성**하는 독립 실행형 웹 애플리케이션

### 1.3 타겟 사용자
- Claude Code를 사용하는 개발자
- AI-Native 개발 환경을 구축하려는 팀 리더
- 오픈소스 프로젝트의 AI 접근성을 높이려는 메인테이너

---

## 1-A. 경쟁 분석 및 차별화

### 기존 도구와의 비교

| 항목 | claudemd-gen | README 생성기 (readme.so 등) | API 문서 생성기 (Swagger 등) | GitHub Copilot 요약 |
|------|-------------|---------------------------|---------------------------|---------------------|
| **대상 산출물** | CLAUDE.md + PRD (AI 컨텍스트 특화) | README.md (사람 대상) | API 참조 문서 | 인라인 코드 설명 |
| **분석 범위** | 전체 프로젝트 구조·스택·아키텍처 | 사용자가 수동 입력 | API 엔드포인트만 | 파일 단위 |
| **LLM 의존성** | 없음 (순수 정적 분석) | 일부 LLM 활용 | 없음 | LLM 필수 (유료) |
| **오프라인 동작** | 가능 (로컬 ZIP 업로드) | 불가 | 가능 | 불가 |
| **다국어 지원** | 7개 언어 (JS/TS, Python, Go, Rust, Java, Ruby, PHP) | 언어 무관 | 언어 무관 | 언어 무관 |
| **아키텍처 패턴 감지** | MVC, Clean, Feature-Sliced, monorepo | 없음 | 없음 | 없음 |
| **PRD 초안 동시 생성** | 있음 | 없음 | 없음 | 없음 |

### 핵심 차별화 포인트

1. **AI 개발 도구 전용 포맷**: CLAUDE.md는 사람이 아닌 AI 에이전트(Claude Code)가 읽는 문서다. 개발 명령어, 에러 처리 패턴, 코딩 컨벤션 등 AI가 코드 작업 시 실제로 참조하는 섹션에 특화되어 있다. 기존 README 생성기는 이 목적에 맞지 않는다.

2. **LLM 없이 동작하는 정적 분석**: API 비용, rate limit, 인터넷 연결 없이 로컬에서 결정론적으로 동일한 결과를 생성한다. ZIP 업로드로 민감한 사내 코드를 외부에 전송하지 않고도 분석 가능하다.

3. **아키텍처 패턴 자동 감지**: 디렉토리 구조에서 MVC, Clean Architecture, Feature-Sliced Design, monorepo 패턴을 자동으로 감지하고 CLAUDE.md에 기술한다. AI가 코드 수정 시 레이어 구조를 이해하는 데 핵심 정보다.

4. **CLAUDE.md + PRD 동시 생성**: 하나의 분석 결과로 AI 컨텍스트 파일과 제품 요구사항 문서 초안을 동시에 생성한다. 프로젝트를 새로 인수하거나 AI-Native 팀 온보딩 시 두 문서 모두 즉시 활용 가능하다.

---

## 2. 목표

### 2.1 핵심 목표
| 목표 | 측정 지표 |
|------|----------|
| 프로젝트 분석 자동화 | 입력 후 30초 이내 결과 생성 |
| 높은 품질의 CLAUDE.md 생성 | 필수 섹션 100% 포함 |
| 독립 실행 가능 | `docker compose up` 한 줄로 구동 |
| 다양한 입력 지원 | GitHub URL, 로컬 경로, ZIP 업로드 |

### 2.2 비목표 (Out of Scope)
- 실시간 코드 변경 감지 (v2에서 고려)
- 프라이빗 GitHub 저장소의 OAuth 인증 (v2에서 고려)
- CLAUDE.md 외 다른 AI 도구(Cursor Rules 등) 포맷 지원 (v2에서 고려)

---

## 3. 기능 명세

### 3.1 핵심 기능 구현 현황

> **F1~F5 Must Have 기능 모두 구현 완료**

| 기능 | 상태 | 구현 위치 |
|------|------|-----------|
| F1. 프로젝트 입력 (3종) | ✅ 완료 | `App.tsx` InputScreen, `analyze.route.ts` |
| F2. 정적 분석 엔진 (5개 모듈) | ✅ 완료 | `analyzers/` (863 LOC) |
| F3. CLAUDE.md 생성 (11섹션) | ✅ 완료 | `generators/templates/claude-md.template.ts` (378 LOC) |
| F4. PRD 초안 생성 (10섹션) | ✅ 완료 | `generators/templates/prd.template.ts` (316 LOC) |
| F5. 결과 내보내기 (복사/다운로드) | ✅ 완료 | `App.tsx` ResultScreen |
| F6. 다크 모드 | ✅ 완료 | `App.tsx` + `index.css` 커스텀 테마 |

### 3.2 핵심 기능 상세 명세

#### F1. 프로젝트 입력
- **F1-1** ✅: GitHub 퍼블릭 저장소 URL 입력 → `git.util.ts` shallow clone (`--depth=1`) 후 분석
- **F1-2** ✅: 로컬 프로젝트 디렉토리 경로 입력 → 직접 분석
- **F1-3** ✅: ZIP 파일 드래그앤드롭 업로드 → `file.util.ts` extractZip (path traversal 방지) 후 분석

#### F2. 프로젝트 정적 분석 엔진
- **F2-1** ✅: 디렉토리 구조 트리 생성 — `structure.analyzer.ts`: 52개 무시 디렉토리, 33개 파일 패턴, maxDepth 5
- **F2-2** ✅: 기술 스택 감지 — `techstack.analyzer.ts`: 7개 언어, 100+ 프레임워크 매핑
- **F2-3** ✅: 설정 파일 파싱 — `config.analyzer.ts`: JSON/JSONC/TOML/YAML
- **F2-4** ✅: 아키텍처 패턴 감지 — `architecture.analyzer.ts`: monorepo/mvc/clean/feature-sliced/layered
- **F2-5** ✅: 의존성 추출 — `dependency.analyzer.ts`: npm/pip/go.mod/Cargo.toml 파서
- **F2-6** ✅: 기존 문서 수집 — README.md, CONTRIBUTING.md, CHANGELOG.md, DEVELOPMENT.md

#### F3. CLAUDE.md 생성 (11개 섹션)
- **F3-1** ✅: 분석 결과 기반 구조화된 CLAUDE.md 생성
- **F3-2** ✅: 생성 섹션: 프로젝트 개요 / 기술 스택 / 디렉토리 구조 / 아키텍처 / 개발 명령어 / 코딩 컨벤션 / 주요 파일 / 의존성 / 환경 변수 / 제약사항 (+ 헤더)
- **F3-3** ✅: Markdown 미리보기 + 인라인 편집 (ResultScreen textarea)

#### F4. PRD 초안 생성 (10개 섹션)
- **F4-1** ✅: 문제 정의 / 목표 / 기능 명세 / 기술 요구사항 / 아키텍처 / API 설계 / 비기능 요구사항 / 마일스톤 자동 생성
- **F4-2** ✅: 기술 스택 기반 목표 추론 (test 스크립트 → 테스트 목표, docker → 컨테이너화 목표)

#### F5. 결과 내보내기
- **F5-1** ✅: 클립보드 복사 (`navigator.clipboard.writeText`)
- **F5-2** ✅: `.md` 파일 다운로드 (`Blob` + `URL.createObjectURL`)
- **F5-3** ⏳: 생성 이력 로컬 저장 — v2에서 구현 예정

### 3.3 부가 기능 (Nice to Have)
- **F6** ✅: 다크 모드 (`#0c0b09` 배경, `#c6f135` 액센트, JetBrains Mono 폰트)
- **F7** ⏳: 생성된 CLAUDE.md 품질 점수 표시 — v2
- **F8** ⏳: 이전 생성 이력 비교 (diff view) — v2

---

## 4. 기술 요구사항

### 4.1 기술 스택
| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| Frontend | React 18 + TypeScript | 컴포넌트 기반 UI, 타입 안전성 |
| Styling | Tailwind CSS | 빠른 UI 개발, 반응형 기본 지원 |
| Backend | Node.js + Express + TypeScript | 프론트엔드와 언어 통일, 풍부한 파일 시스템 API |
| 분석 엔진 | Custom TypeScript 모듈 | 외부 의존성 최소화, 프로젝트 맞춤 분석 |
| 빌드 | Vite (Frontend), tsx (Backend) | 빠른 HMR, TypeScript 네이티브 실행 |
| 테스트 | Vitest + Testing Library | Vite 생태계 통합, 빠른 실행 |
| 컨테이너 | Docker + Docker Compose | 독립 실행 환경 보장 |
| CI/CD | GitHub Actions | 자동 테스트, 린트, 빌드, Docker 이미지 빌드 |

### 4.2 아키텍처

```
claudemd-gen/
├── packages/
│   ├── frontend/          # React SPA
│   │   ├── src/
│   │   │   ├── components/    # UI 컴포넌트
│   │   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── hooks/         # 커스텀 훅
│   │   │   ├── services/      # API 클라이언트
│   │   │   ├── types/         # TypeScript 타입
│   │   │   └── utils/         # 유틸리티
│   │   └── package.json
│   ├── backend/           # Express API 서버
│   │   ├── src/
│   │   │   ├── routes/        # API 라우트
│   │   │   ├── services/      # 비즈니스 로직
│   │   │   ├── analyzers/     # 프로젝트 분석 모듈
│   │   │   ├── generators/    # 문서 생성 모듈
│   │   │   ├── types/         # TypeScript 타입
│   │   │   └── utils/         # 유틸리티
│   │   └── package.json
│   └── shared/            # 공유 타입 및 상수
│       ├── src/
│       │   ├── types/
│       │   └── constants/
│       └── package.json
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
├── .github/
│   └── workflows/
│       ├── ci.yml         # PR 시 테스트/린트
│       └── cd.yml         # main 머지 시 빌드/배포
├── CLAUDE.md
├── README.md
├── PRD.md
└── DEVELOPMENT.md
```

### 4.3 API 설계

#### POST /api/analyze
프로젝트를 분석하고 결과를 반환한다.

**Request:**
```json
{
  "source": {
    "type": "github_url" | "local_path" | "zip_upload",
    "value": "https://github.com/user/repo" | "/path/to/project"
  },
  "options": {
    "includeDevDeps": true,
    "maxDepth": 5,
    "ignorePaths": ["dist", "build"]
  }
}
```

**Response:**
```json
{
  "projectInfo": {
    "name": "string",
    "description": "string",
    "techStack": [...],
    "structure": {...},
    "dependencies": [...],
    "scripts": {...},
    "configFiles": [...],
    "entryPoints": [...]
  },
  "generatedFiles": {
    "claudeMd": "string (markdown)",
    "prdMd": "string (markdown)"
  },
  "metadata": {
    "analyzedAt": "ISO timestamp",
    "fileCount": 0,
    "analysisTimeMs": 0
  }
}
```

#### POST /api/analyze/upload
ZIP 파일 업로드 분석 (multipart/form-data)

#### GET /api/health
서버 헬스 체크

---

## 5. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 성능 | 분석 완료까지 30초 이내 (1000파일 기준) |
| 보안 | 업로드 파일 10분 후 자동 삭제, path traversal 방지 |
| 접근성 | WCAG 2.1 AA 수준 |
| 반응형 | 모바일(360px) ~ 데스크톱(1920px) 대응 |
| 브라우저 | Chrome, Firefox, Safari, Edge 최신 2개 버전 |

---

## 6. 마일스톤

| 단계 | 기간 | 산출물 |
|------|------|--------|
| M1: 프로젝트 셋업 | Day 1 | 모노레포 구조, Docker 환경, CI 파이프라인 |
| M2: 분석 엔진 | Day 2-3 | 정적 분석 모듈 (구조, 스택, 의존성) |
| M3: 문서 생성기 | Day 4-5 | CLAUDE.md, PRD 생성 로직 |
| M4: 프론트엔드 | Day 6-7 | React UI, API 연동, 미리보기 |
| M5: 테스트 & 배포 | Day 8 | 테스트 작성, Docker 이미지, CI/CD |
| M6: 문서화 & 정리 | Day 9 | README, DEVELOPMENT.md 최종화 |
