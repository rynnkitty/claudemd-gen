/**
 * PRD 각 섹션 렌더링 함수
 * 모두 순수 함수 — ProjectInfo를 받아 마크다운 문자열 반환
 */

import type {
  ProjectInfo,
  TechStack,
  ArchitectureInfo,
  DependencyInfo,
  DependencyEntry,
  ScriptInfo,
} from '@claudemd-gen/shared';

// ─── public API ─────────────────────────────────────────────────────────────

export function renderPrdHeader(name: string): string {
  return `# PRD: ${name}

> 이 PRD는 정적 코드 분석을 기반으로 자동 생성된 **초안**입니다.
> 실제 비즈니스 요구사항에 맞게 수정하여 사용하세요.`;
}

export function renderProblemDef(info: ProjectInfo): string {
  if (info.claudeEnhancements?.problemStatement) {
    return `## 1. 문제 정의\n\n${info.claudeEnhancements.problemStatement}`;
  }

  const desc = info.description ?? '(프로젝트 설명 없음)';
  const lang = info.techStack.languages[0] ?? '알 수 없는 언어';
  const runtime = info.techStack.runtime ?? '알 수 없는 런타임';
  const mainFramework = info.techStack.frameworks[0];

  const stackSummary = [
    `${lang} 기반의 ${runtime} 애플리케이션`,
    mainFramework !== undefined ? `${mainFramework} 프레임워크를 사용합니다.` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return `## 1. 문제 정의

### 1.1 배경

**${info.name}**는 ${desc}

${stackSummary}

### 1.2 해결하려는 문제

> TODO: 이 프로젝트가 해결하려는 핵심 문제를 구체적으로 기술하세요.

### 1.3 타겟 사용자

> TODO: 주요 사용자 페르소나와 그들의 Pain Point를 기술하세요.`;
}

export function renderGoals(info: ProjectInfo): string {
  // 스크립트에서 목표 힌트 추출 (build → 배포 목표, test → 품질 목표 등)
  const hasTest = info.scripts.some((s) => s.name === 'test');
  const hasBuild = info.scripts.some((s) => s.name === 'build');
  const hasDocker = info.configFiles.some(
    (c) => c.filename === 'docker-compose.yml' || c.filename === 'docker-compose.yaml',
  );

  const rows: string[] = [];
  rows.push('| 목표 | 측정 지표 |');
  rows.push('|------|----------|');
  rows.push('| TODO: 핵심 목표 1 | TODO: 측정 방법 |');

  if (hasTest) rows.push('| 코드 품질 확보 | 테스트 커버리지 80% 이상 |');
  if (hasBuild) rows.push('| 프로덕션 빌드 가능 | 빌드 성공률 100% |');
  if (hasDocker) rows.push('| 독립 실행 가능 | `docker compose up` 한 줄 구동 |');

  return `## 2. 목표\n\n${rows.join('\n')}\n\n### 2.1 비목표 (Out of Scope)\n\n> TODO: 이 버전에서 다루지 않는 범위를 명시하세요.`;
}

export function renderFeatureSpec(info: ProjectInfo): string {
  const lines: string[] = ['## 3. 기능 명세', '', '### 3.1 핵심 기능 (Must Have)', ''];

  // 엔트리포인트와 아키텍처 레이어에서 기능 힌트 추출
  const layers = info.architecture.layers;
  const featureHints = inferFeatures(info);

  if (featureHints.length > 0) {
    featureHints.forEach((feature, idx) => {
      lines.push(`#### F${idx + 1}. ${feature.name}`, '');
      lines.push(`- **F${idx + 1}-1**: ${feature.desc}`);
      lines.push('');
    });
  } else {
    lines.push('#### F1. (TODO: 기능명)', '');
    lines.push('> TODO: 핵심 기능을 기술하세요.');
    lines.push('');
  }

  lines.push('### 3.2 부가 기능 (Nice to Have)', '');

  // 레이어 기반 힌트
  if (layers.includes('controllers') || layers.includes('routes')) {
    lines.push('- TODO: REST API 엔드포인트 목록');
  }
  if (layers.includes('models') || layers.includes('entities')) {
    lines.push('- TODO: 도메인 모델 목록');
  }

  lines.push('- TODO: 추가 기능을 여기에 기술하세요.');

  return lines.join('\n');
}

export function renderTechReqs(
  techStack: TechStack,
  deps: DependencyInfo,
): string {
  const lines: string[] = ['## 4. 기술 요구사항', '', '### 4.1 기술 스택', ''];

  // 기술 스택 테이블
  const stackRows: string[][] = [];
  if (techStack.runtime !== null) {
    stackRows.push(['런타임', techStack.runtime, '-']);
  }
  if (techStack.languages.length > 0) {
    stackRows.push(['언어', techStack.languages.join(', '), '-']);
  }
  for (const fw of techStack.frameworks) {
    const ver = findVersion(fw, deps);
    stackRows.push(['프레임워크', fw, ver]);
  }
  for (const bt of techStack.buildTools) {
    const ver = findVersion(bt, deps);
    stackRows.push(['빌드 도구', bt, ver]);
  }
  for (const tf of techStack.testFrameworks) {
    const ver = findVersion(tf, deps);
    stackRows.push(['테스트', tf, ver]);
  }

  lines.push('| 분류 | 기술 | 버전 |');
  lines.push('|------|------|------|');
  for (const [cat, tech, ver] of stackRows) {
    lines.push(`| ${cat} | ${tech} | ${ver} |`);
  }
  if (stackRows.length === 0) {
    lines.push('| TODO | TODO | TODO |');
  }

  return lines.join('\n');
}

export function renderArchReqs(arch: ArchitectureInfo): string {
  const archLabel = formatArchPattern(arch.pattern);
  const lines: string[] = ['### 4.2 아키텍처', '', `**패턴**: ${archLabel}`];

  if (arch.layers.length > 0) {
    lines.push('', '**레이어 구성**', '');
    for (const layer of arch.layers) {
      lines.push(`- \`${layer}/\``);
    }
  }

  if (arch.pattern === 'monorepo' && arch.packages && arch.packages.length > 0) {
    lines.push('', '**패키지 구성**', '');
    for (const pkg of arch.packages) {
      lines.push(`- \`${pkg}\``);
    }
  }

  return lines.join('\n');
}

export function renderApiDesign(scripts: ScriptInfo[]): string {
  const hasDevScript = scripts.some((s) => s.name === 'dev');
  const lines: string[] = ['### 4.3 API 설계 (초안)', ''];

  if (hasDevScript) {
    lines.push('> TODO: 주요 API 엔드포인트를 여기에 정의하세요.', '');
    lines.push('```');
    lines.push('POST /api/[resource]     # 생성');
    lines.push('GET  /api/[resource]     # 목록 조회');
    lines.push('GET  /api/[resource]/:id # 단건 조회');
    lines.push('PUT  /api/[resource]/:id # 수정');
    lines.push('DELETE /api/[resource]/:id # 삭제');
    lines.push('```');
  } else {
    lines.push('> TODO: API 엔드포인트를 정의하세요.');
  }

  return lines.join('\n');
}

export function renderNonFuncReqs(): string {
  return `## 5. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 성능 | TODO: 응답 시간 목표 (예: API 응답 200ms 이내) |
| 보안 | TODO: 인증/인가 방식, 데이터 암호화 요구사항 |
| 가용성 | TODO: 목표 가동률 (예: 99.9%) |
| 접근성 | TODO: WCAG 수준 또는 해당 없음 |
| 확장성 | TODO: 예상 트래픽 및 스케일링 전략 |`;
}

export function renderMilestones(scripts: ScriptInfo[] = []): string {
  const hasBuild = scripts.some((s) => s.name === 'build');
  const hasTest = scripts.some((s) => s.name === 'test');

  const milestones: Array<{ phase: string; deliverable: string }> = [
    { phase: 'M1: 프로젝트 셋업', deliverable: '개발 환경, CI/CD, 의존성 설치' },
    { phase: 'M2: 핵심 기능', deliverable: 'TODO: 핵심 기능 구현' },
    { phase: 'M3: 부가 기능', deliverable: 'TODO: 부가 기능 구현' },
  ];

  if (hasTest) {
    milestones.push({ phase: 'M4: 테스트', deliverable: '단위/통합 테스트 작성, 커버리지 확보' });
  }
  if (hasBuild) {
    milestones.push({ phase: 'M5: 배포', deliverable: '프로덕션 빌드, 배포 파이프라인' });
  }

  const rows = milestones.map((m) => `| ${m.phase} | TODO | ${m.deliverable} |`);

  return [
    '## 6. 마일스톤',
    '',
    '| 단계 | 기간 | 산출물 |',
    '|------|------|--------|',
    ...rows,
  ].join('\n');
}

export function renderFooter(): string {
  return `---

*이 문서는 [claudemd-gen](https://github.com/claudemd-gen/claudemd-gen)으로 자동 생성되었습니다.*
*실제 요구사항을 반영하여 TODO 항목을 업데이트하세요.*`;
}

// ─── 내부 헬퍼 ─────────────────────────────────────────────────────────────

interface FeatureHint {
  name: string;
  desc: string;
}

function inferFeatures(info: ProjectInfo): FeatureHint[] {
  const hints: FeatureHint[] = [];
  const layers = info.architecture.layers;
  const frameworks = info.techStack.frameworks;

  if (layers.includes('controllers') || layers.includes('routes')) {
    hints.push({
      name: 'API 엔드포인트',
      desc: 'REST API 엔드포인트를 제공합니다.',
    });
  }
  if (layers.includes('models') || layers.includes('entities')) {
    hints.push({
      name: '데이터 모델',
      desc: '핵심 도메인 모델을 정의하고 데이터를 관리합니다.',
    });
  }
  if (frameworks.includes('React') || layers.includes('views') || layers.includes('pages')) {
    hints.push({
      name: 'UI 컴포넌트',
      desc: '사용자 인터페이스 컴포넌트를 제공합니다.',
    });
  }
  if (frameworks.includes('Prisma') || frameworks.includes('TypeORM') || frameworks.includes('SQLAlchemy')) {
    hints.push({
      name: '데이터베이스 연동',
      desc: 'ORM을 통해 데이터베이스와 연동합니다.',
    });
  }

  return hints;
}

function findVersion(frameworkName: string, deps: DependencyInfo): string {
  const nameMap: Record<string, string[]> = {
    React: ['react'],
    'React DOM': ['react-dom'],
    Express: ['express'],
    Fastify: ['fastify'],
    NestJS: ['@nestjs/core'],
    Vite: ['vite'],
    Vitest: ['vitest'],
    Jest: ['jest'],
    'Tailwind CSS': ['tailwindcss'],
    Zustand: ['zustand'],
    Prisma: ['prisma', '@prisma/client'],
    TypeORM: ['typeorm'],
    Flask: ['flask'],
    Django: ['django'],
    FastAPI: ['fastapi'],
  };

  const pkgNames = nameMap[frameworkName] ?? [frameworkName.toLowerCase()];
  const allDeps: DependencyEntry[] = [...deps.production, ...deps.development];

  for (const pkgName of pkgNames) {
    const found = allDeps.find(
      (d) => d.name.toLowerCase() === pkgName.toLowerCase(),
    );
    if (found !== undefined) return found.version;
  }
  return '-';
}

function formatArchPattern(pattern: string): string {
  const MAP: Record<string, string> = {
    mvc: 'MVC (Model-View-Controller)',
    'clean-architecture': 'Clean Architecture',
    'feature-sliced': 'Feature-Sliced Design',
    layered: 'Layered Architecture',
    monorepo: 'Monorepo',
    unknown: '(감지 불가)',
  };
  return MAP[pattern] ?? pattern;
}
