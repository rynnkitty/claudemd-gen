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

---

### M3: 문서 생성기 ✅ 완료

**목표**: 분석 결과 기반 CLAUDE.md, PRD 생성

- [x] Markdown 템플릿 시스템 구현 (순수 함수 기반)
- [x] ClaudeMdGenerator 구현 (11개 섹션)
- [x] PrdGenerator 구현 (8개 섹션)
- [x] 기술 스택·아키텍처 기반 내용 자동 추론
- [x] 단위 테스트 작성 (86개 테스트)

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

---

### M6: 문서화 & 정리 ✅ 완료

**목표**: 최종 문서화 및 코드 정리

- [x] README.md 최종 업데이트
- [x] CLAUDE.md 실제 프로젝트 반영 업데이트
- [x] 불필요한 console.log 제거
- [x] vitest 커버리지 thresholds 설정 (80%)
- [x] 모든 테스트 통과 확인 (214개)

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
