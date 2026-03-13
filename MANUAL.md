# MANUAL.md - Claude Code 구현 매뉴얼

> 이 문서는 VSCode에서 Claude Code를 사용하여 claudemd-gen을 구현하는 단계별 가이드입니다.

---

## 사전 준비

### 1. 필수 설치 항목

```bash
# Node.js 20+ 확인
node --version  # v20.x.x 이상

# npm 10+ 확인
npm --version   # 10.x.x 이상

# Docker (선택, 배포 시 필요)
docker --version
docker compose version

# Git
git --version
```

### 2. VSCode 확장 설치

- **Claude Code** (Anthropic 공식 확장)
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Importer

### 3. 프로젝트 디렉토리 생성

```bash
mkdir claudemd-gen
cd claudemd-gen
git init
```

---

## 구현 순서 (Claude Code 명령어)

아래 명령어들을 VSCode 터미널에서 Claude Code에게 순서대로 입력하세요.
각 단계가 완료되면 다음 단계로 넘어갑니다.

---

### 단계 1: 프로젝트 초기화

Claude Code 터미널(Ctrl+Shift+`)에서 다음을 입력하세요:

```
CLAUDE.md 파일을 읽고 프로젝트를 초기화해줘.

1. npm workspaces 기반 모노레포 구조 생성
2. 루트 package.json에 workspaces 설정 (packages/*)
3. tsconfig.base.json 공유 TypeScript 설정
4. .eslintrc.cjs 공유 ESLint 설정
5. .prettierrc 설정
6. .gitignore 설정

packages/shared, packages/frontend, packages/backend 3개 패키지 생성하되
각각의 package.json과 tsconfig.json을 만들어줘.
```

**확인 사항:**
- `npm install`이 에러 없이 완료되는지 확인
- `packages/` 하위에 3개 디렉토리가 생성되었는지 확인

---

### 단계 2: 공유 타입 패키지

```
CLAUDE.md와 PRD.md를 참고해서 packages/shared를 구현해줘.

1. src/types/analysis.ts - 프로젝트 분석 결과 타입 정의
   - ProjectAnalysis, TechStack, DirectoryTree, DependencyInfo 등
2. src/types/api.ts - API 요청/응답 타입
   - AnalyzeRequest, AnalyzeResponse, SourceType enum
3. src/constants/ignore-patterns.ts - 분석 시 무시할 경로 패턴
4. src/constants/tech-stacks.ts - 지원하는 기술 스택 매핑 정보
5. src/index.ts - barrel export

모든 타입은 export하고, 다른 패키지에서 import 가능하게 해줘.
```

---

### 단계 3: 백엔드 - 분석 엔진

```
CLAUDE.md를 참고해서 packages/backend의 분석 엔진을 구현해줘.

src/analyzers/ 디렉토리에 다음 모듈을 만들어:

1. structure.analyzer.ts
   - 디렉토리를 재귀 탐색하여 트리 구조 생성
   - ignore-patterns 적용 (node_modules, .git, __pycache__ 등)
   - 최대 깊이 제한 옵션

2. techstack.analyzer.ts
   - package.json → Node.js/React/Vue/Angular 등 감지
   - requirements.txt/pyproject.toml → Python 감지
   - go.mod, Cargo.toml, pom.xml 등 지원
   - 프레임워크, 라이브러리, 빌드도구 분류

3. dependency.analyzer.ts
   - 의존성 파일 파싱
   - production/dev 분류
   - 주요 의존성 하이라이트

4. config.analyzer.ts
   - tsconfig, eslint, prettier, docker 등 설정 파일 탐지 및 요약

5. architecture.analyzer.ts
   - 디렉토리 패턴 기반 아키텍처 추론
   - MVC, Clean Architecture, Feature-based 등

6. index.ts
   - 모든 분석기를 조합하는 AnalysisOrchestrator 클래스

각 분석기마다 단위 테스트도 함께 작성해줘.
테스트 픽스처는 src/__fixtures__/에 샘플 프로젝트 구조로 만들어.
```

---

### 단계 4: 백엔드 - 문서 생성기

```
CLAUDE.md를 참고해서 packages/backend의 문서 생성기를 구현해줘.

src/generators/ 디렉토리에:

1. templates/claude-md.template.ts
   - CLAUDE.md 마크다운 템플릿 (변수 플레이스홀더 포함)
   - 섹션: 프로젝트 개요, 기술 스택, 디렉토리 구조, 아키텍처,
     개발 명령어, 코딩 컨벤션, 환경 변수, 의존성

2. templates/prd.template.ts
   - PRD 마크다운 템플릿

3. claude-md.generator.ts
   - ProjectAnalysis를 받아 CLAUDE.md 마크다운 문자열 생성
   - 각 분석 결과를 적절한 섹션에 매핑

4. prd.generator.ts
   - ProjectAnalysis를 받아 PRD 초안 생성

단위 테스트도 함께 작성해줘.
```

---

### 단계 5: 백엔드 - API 서버

```
CLAUDE.md와 PRD.md의 API 설계를 참고해서 Express 서버를 구현해줘.

1. src/app.ts - Express 앱 설정
   - CORS, JSON 파싱, 에러 핸들링 미들웨어

2. src/routes/analyze.route.ts
   - POST /api/analyze - GitHub URL 또는 로컬 경로 분석
   - POST /api/analyze/upload - ZIP 파일 업로드 분석

3. src/routes/health.route.ts
   - GET /api/health

4. src/services/analyze.service.ts
   - 입력 유형별 처리 (git clone, 로컬 경로, ZIP 해제)
   - AnalysisOrchestrator 호출
   - Generator 호출
   - 결과 조합 반환

5. src/middlewares/error-handler.ts
   - 글로벌 에러 핸들링

6. src/middlewares/validator.ts
   - 요청 검증 (URL 형식, 경로 존재 여부 등)

7. src/utils/git.util.ts
   - GitHub URL에서 shallow clone

8. src/utils/file.util.ts
   - ZIP 해제, 임시 디렉토리 관리, 정리

통합 테스트도 작성해줘 (supertest 사용).
```

---

### 단계 6: 프론트엔드

```
CLAUDE.md를 참고해서 packages/frontend를 구현해줘.

React + Tailwind CSS로 다음을 만들어:

1. src/components/layout/Header.tsx - 앱 헤더 (로고, 다크모드 토글)
2. src/components/layout/Footer.tsx - 앱 푸터

3. src/pages/HomePage.tsx - 메인 입력 페이지
   - 탭 UI: GitHub URL / ZIP 업로드
   - URL 입력 필드 + 분석 시작 버튼
   - 파일 드래그앤드롭 업로드 영역

4. src/pages/ResultPage.tsx - 결과 페이지
   - 좌우 분할: CLAUDE.md / PRD 탭 전환
   - Markdown 미리보기 (react-markdown)
   - 원문 편집 토글
   - 복사 버튼, 다운로드 버튼

5. src/components/features/AnalysisProgress.tsx
   - 분석 진행 상태 표시 (스피너, 단계별 진행)

6. src/services/api.ts - axios 인스턴스 및 API 호출 함수
7. src/hooks/useAnalysis.ts - 분석 요청/상태 관리 커스텀 훅
8. src/App.tsx - 라우팅 (react-router-dom)

반응형으로 만들어줘 (모바일 360px ~ 데스크톱 1920px).
다크 모드도 지원해줘 (Tailwind dark: 클래스).
```

---

### 단계 7: Docker 설정

```
독립 실행 가능한 Docker 환경을 만들어줘.

1. Dockerfile.frontend
   - Multi-stage: build → nginx로 서빙
   - nginx.conf에 /api 프록시 설정

2. Dockerfile.backend
   - Multi-stage: build → node로 실행

3. docker-compose.yml
   - frontend: 포트 3000
   - backend: 포트 4000
   - 네트워크 설정

docker compose up 한 줄로 전체가 동작해야 해.
```

---

### 단계 8: CI/CD 파이프라인

```
GitHub Actions 워크플로우를 만들어줘.

1. .github/workflows/ci.yml
   - 트리거: PR 생성/업데이트
   - 잡: lint → type-check → test (병렬)
   - Node.js 20 사용
   - npm ci로 의존성 설치

2. .github/workflows/cd.yml
   - 트리거: main 브랜치 push
   - 잡: build → Docker 이미지 빌드
   - 태그: latest + git sha

두 워크플로우 모두 캐싱 적용해줘 (npm cache).
```

---

### 단계 9: 테스트 보강 및 마무리

```
테스트 커버리지를 보강하고 프로젝트를 마무리해줘.

1. 부족한 테스트 추가하여 라인 커버리지 80% 이상 달성
2. vitest.workspace.ts로 워크스페이스 테스트 설정
3. README.md의 스크립트 섹션이 실제 package.json과 일치하는지 확인
4. CLAUDE.md를 실제 구현된 구조와 맞게 업데이트
5. DEVELOPMENT.md의 체크리스트를 완료 상태로 업데이트
6. 불필요한 console.log 제거
7. TODO 주석 정리

npm run lint && npm run type-check && npm run test 가 모두 통과해야 해.
```

---

## 유용한 Claude Code 명령어 모음

### 진행 상황 확인
```
현재 프로젝트 구조를 보여줘
```

### 테스트 실행
```
npm run test를 실행하고 실패하는 테스트가 있으면 수정해줘
```

### 린트 수정
```
npm run lint를 실행하고 에러를 모두 수정해줘
```

### 특정 파일 디버깅
```
[파일경로]에서 에러가 발생해. 원인을 분석하고 수정해줘
```

### 타입 에러 수정
```
npm run type-check에서 에러가 나와. 모두 수정해줘
```

### Docker 테스트
```
docker compose up --build를 실행하고 정상 동작하는지 확인해줘
```

---

## 트러블슈팅

### npm install 실패
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules packages/*/node_modules
npm install
```

### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :5173  # 프론트엔드
lsof -i :4000  # 백엔드
```

### TypeScript 경로 인식 문제
```bash
# shared 패키지 빌드 후 재시도
cd packages/shared && npm run build && cd ../..
```

### Docker 빌드 실패
```bash
# 캐시 무시 재빌드
docker compose build --no-cache
```

---

## 최종 체크리스트

구현이 모두 끝난 후 아래를 확인하세요:

- [ ] `npm run lint` 통과
- [ ] `npm run type-check` 통과
- [ ] `npm run test` 통과 (커버리지 80%+)
- [ ] `npm run build` 성공
- [ ] `docker compose up` 으로 앱 정상 구동
- [ ] http://localhost:3000 접속하여 GitHub URL 분석 테스트
- [ ] 생성된 CLAUDE.md가 의미 있는 내용을 포함하는지 확인
- [ ] 반응형 디자인 확인 (개발자 도구 → 모바일 뷰)
- [ ] README.md 내용이 실제 프로젝트와 일치
- [ ] CLAUDE.md 내용이 실제 프로젝트와 일치
- [ ] DEVELOPMENT.md 체크리스트 업데이트
- [ ] 커밋 이력이 Conventional Commits 형식
