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

### 3.1 핵심 기능 (Must Have)

#### F1. 프로젝트 입력
- **F1-1**: GitHub 퍼블릭 저장소 URL 입력 → 자동 클론 및 분석
- **F1-2**: 로컬 프로젝트 디렉토리 경로 입력 → 직접 분석
- **F1-3**: ZIP 파일 업로드 → 압축 해제 후 분석

#### F2. 프로젝트 정적 분석 엔진
- **F2-1**: 디렉토리 구조 트리 생성 (무시 패턴: node_modules, .git, __pycache__ 등)
- **F2-2**: 기술 스택 감지 (package.json, requirements.txt, go.mod, Cargo.toml 등)
- **F2-3**: 주요 설정 파일 파싱 (tsconfig.json, .eslintrc, pyproject.toml 등)
- **F2-4**: 엔트리 포인트 및 아키텍처 패턴 감지 (MVC, Clean Architecture 등)
- **F2-5**: 의존성 목록 및 버전 추출
- **F2-6**: 기존 README.md, CONTRIBUTING.md 등 문서 수집

#### F3. CLAUDE.md 생성
- **F3-1**: 분석 결과를 기반으로 구조화된 CLAUDE.md 생성
- **F3-2**: 생성되는 CLAUDE.md 섹션:
  ```
  - 프로젝트 개요
  - 기술 스택 및 버전
  - 디렉토리 구조
  - 아키텍처 설명
  - 개발 환경 설정 (빌드, 실행, 테스트 명령어)
  - 코딩 컨벤션
  - 주요 파일 설명
  - 의존성 요약
  - 환경 변수
  ```
- **F3-3**: Markdown 미리보기 및 섹션별 편집 기능

#### F4. PRD 초안 생성
- **F4-1**: 분석된 프로젝트 정보 기반 PRD 템플릿 자동 채우기
- **F4-2**: 문제 정의, 기능 목록, 기술 스택 섹션 자동 생성

#### F5. 결과 내보내기
- **F5-1**: 생성된 파일 Markdown 원문 복사
- **F5-2**: 파일 다운로드 (.md)
- **F5-3**: 생성 이력 로컬 저장 (브라우저 IndexedDB)

### 3.2 부가 기능 (Nice to Have)
- **F6**: 다크 모드 지원
- **F7**: 생성된 CLAUDE.md 품질 점수 표시
- **F8**: 이전 생성 이력 비교 (diff view)

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
