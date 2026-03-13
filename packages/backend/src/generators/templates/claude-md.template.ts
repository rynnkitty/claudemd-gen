/**
 * CLAUDE.md 각 섹션 렌더링 함수
 * 모두 순수 함수(pure function) — I/O 없음, ProjectInfo 서브셋을 받아 마크다운 문자열 반환
 */

import type {
  ProjectInfo,
  TechStack,
  ArchitectureInfo,
  DependencyInfo,
  DependencyEntry,
  ScriptInfo,
  ConfigFile,
  EntryPoint,
  DirectoryTree,
  DirectoryNode,
} from '@claudemd-gen/shared';

// ─── public API ─────────────────────────────────────────────────────────────

export function renderHeader(name: string): string {
  return `# CLAUDE.md - AI 컨텍스트 파일

> **${name}** 프로젝트를 위한 AI 컨텍스트입니다.
> 자동 생성됨 by [claudemd-gen](https://github.com/claudemd-gen/claudemd-gen)`;
}

export function renderOverview(info: ProjectInfo): string {
  const desc = info.description ?? 'TODO: 프로젝트 설명을 추가하세요.';
  const primaryLang = info.techStack.languages[0] ?? '-';
  const archLabel = formatArchPattern(info.architecture.pattern);

  return `## 프로젝트 개요

**${info.name}**: ${desc}

| 항목 | 값 |
|------|---|
| 런타임 | ${info.techStack.runtime ?? '-'} |
| 패키지 매니저 | ${info.techStack.packageManager ?? '-'} |
| 주요 언어 | ${primaryLang} |
| 아키텍처 패턴 | ${archLabel} |`;
}

export function renderTechStack(techStack: TechStack): string {
  const rows: string[][] = [
    ['언어', techStack.languages.join(', ') || '-'],
    ['프레임워크 / 라이브러리', techStack.frameworks.join(', ') || '-'],
    ['빌드 도구', techStack.buildTools.join(', ') || '-'],
    ['테스트 프레임워크', techStack.testFrameworks.join(', ') || '-'],
  ];

  const table = [
    '| 분류 | 목록 |',
    '|------|------|',
    ...rows.map(([cat, val]) => `| ${cat} | ${val} |`),
  ].join('\n');

  return `## 기술 스택\n\n${table}`;
}

export function renderStructure(tree: DirectoryTree, maxDepth = 3): string {
  const ascii = buildAsciiTree(tree, maxDepth);
  return `## 디렉토리 구조\n\n\`\`\`\n${ascii}\n\`\`\``;
}

export function renderArchitecture(arch: ArchitectureInfo): string {
  const label = formatArchPattern(arch.pattern);
  const lines: string[] = [`## 아키텍처`, '', `**패턴**: ${label}`];

  if (arch.layers.length > 0) {
    lines.push('', `감지된 레이어: ${arch.layers.join(', ')}`);
  }

  if (arch.pattern === 'monorepo' && arch.packages && arch.packages.length > 0) {
    lines.push('', '**패키지 목록**', ...arch.packages.map((p) => `- \`${p}\``));
  }

  const archDescriptions: Record<string, string> = {
    mvc: 'MVC 패턴은 Model-View-Controller를 분리하여 관심사를 명확히 구분합니다.',
    'clean-architecture':
      'Clean Architecture는 도메인 로직을 외부 의존성으로부터 완전히 분리합니다.',
    'feature-sliced':
      'Feature-Sliced Design은 기능 단위로 코드를 수직 분리합니다.',
    layered: '레이어드 아키텍처는 Presentation → Application → Domain → Infrastructure 계층을 분리합니다.',
    monorepo: '모노레포는 여러 패키지를 단일 저장소에서 관리합니다.',
    unknown: '',
  };

  const desc = archDescriptions[arch.pattern];
  if (desc) lines.push('', desc);

  return lines.join('\n');
}

export function renderCommands(scripts: ScriptInfo[]): string {
  if (scripts.length === 0) {
    return `## 개발 명령어\n\n<!-- TODO: 개발 명령어를 추가하세요 -->`;
  }

  // 주요 스크립트 우선 정렬
  const priority = ['dev', 'start', 'build', 'test', 'lint', 'type-check', 'preview'];
  const sorted = [
    ...scripts.filter((s) => priority.includes(s.name)),
    ...scripts.filter((s) => !priority.includes(s.name)),
  ];

  const COMMENT_MAP: Record<string, string> = {
    dev: '# 개발 서버 실행',
    start: '# 프로덕션 서버 실행',
    build: '# 프로덕션 빌드',
    test: '# 테스트 실행',
    lint: '# 린트 검사',
    'type-check': '# 타입 체크',
    preview: '# 빌드 결과 미리보기',
  };

  const lines: string[] = [];
  for (const script of sorted) {
    const comment = COMMENT_MAP[script.name];
    if (comment !== undefined) lines.push(comment);
    lines.push(`npm run ${script.name}`);
    lines.push('');
  }

  return `## 개발 명령어\n\n\`\`\`bash\n${lines.join('\n').trimEnd()}\n\`\`\``;
}

export function renderConventions(configFiles: ConfigFile[], techStack: TechStack): string {
  const lines: string[] = ['## 코딩 컨벤션', ''];

  // TypeScript
  if (techStack.languages.includes('TypeScript')) {
    const tsconfig = configFiles.find((c) => c.filename === 'tsconfig.json');
    if (tsconfig !== undefined) {
      const opts = tsconfig.summary['compilerOptions'];
      if (typeof opts === 'string' && opts.includes('strict')) {
        lines.push('- **TypeScript**: `strict` 모드 활성화 — 타입 안전성 최대화');
      } else {
        lines.push('- **TypeScript**: tsconfig.json 설정 존재');
      }
    }
    lines.push('- `any` 타입 사용 금지 → `unknown` 으로 대체 후 타입 가드 사용');
    lines.push('- 모든 함수에 반환 타입 명시');
  }

  // Prettier
  const prettierFile = configFiles.find(
    (c) => c.filename === '.prettierrc' || c.filename === 'prettier.config.js',
  );
  if (prettierFile !== undefined) {
    const tw = prettierFile.summary['tabWidth'] ?? 2;
    const sq = prettierFile.summary['singleQuote'] ?? true;
    const tc = prettierFile.summary['trailingComma'] ?? 'all';
    lines.push(`- **Prettier**: tabWidth=${String(tw)}, singleQuote=${String(sq)}, trailingComma=${String(tc)}`);
  } else {
    lines.push('- 들여쓰기: 2 spaces');
  }

  // ESLint
  const eslintFile = configFiles.find(
    (c) => c.filename.startsWith('.eslintrc') || c.filename === 'eslint.config.js',
  );
  if (eslintFile !== undefined) {
    lines.push('- **ESLint**: 정적 분석 및 코드 품질 검사');
  }

  // React conventions
  if (techStack.frameworks.includes('React')) {
    lines.push('- **React**: 함수형 컴포넌트 + 훅(Hooks) 사용 (클래스 컴포넌트 사용 금지)');
    lines.push('- 컴포넌트 파일 하나에 하나의 컴포넌트만 정의');
    lines.push('- Props 타입은 컴포넌트 파일 상단에 정의');
  }

  // Naming conventions based on language
  if (techStack.languages.includes('TypeScript') || techStack.languages.includes('JavaScript')) {
    lines.push('');
    lines.push('### 네이밍 컨벤션');
    lines.push('- **파일명**: kebab-case (예: `user-service.ts`)');
    lines.push('- **클래스/타입/인터페이스**: PascalCase');
    lines.push('- **변수/함수**: camelCase');
    lines.push('- **상수**: UPPER_SNAKE_CASE');
  } else if (techStack.languages.includes('Python')) {
    lines.push('');
    lines.push('### 네이밍 컨벤션');
    lines.push('- **파일/모듈**: snake_case');
    lines.push('- **클래스**: PascalCase');
    lines.push('- **함수/변수**: snake_case');
    lines.push('- **상수**: UPPER_SNAKE_CASE');
  }

  if (lines.length <= 2) {
    lines.push('<!-- TODO: 프로젝트별 코딩 컨벤션을 여기에 추가하세요 -->');
  }

  return lines.join('\n');
}

export function renderKeyFiles(
  entryPoints: EntryPoint[],
  configFiles: ConfigFile[],
): string {
  const lines: string[] = ['## 주요 파일', ''];

  // Entry points
  if (entryPoints.length > 0) {
    lines.push('### 엔트리포인트', '');
    for (const ep of entryPoints) {
      lines.push(`- \`${ep.relativePath}\` (${ep.kind})`);
    }
    lines.push('');
  }

  // Config files with descriptions
  if (configFiles.length > 0) {
    lines.push('### 설정 파일', '');
    for (const cf of configFiles) {
      const desc = CONFIG_FILE_DESCRIPTIONS[cf.filename] ?? '설정 파일';
      lines.push(`- \`${cf.filename}\` — ${desc}`);
    }
  }

  return lines.join('\n').trimEnd();
}

export function renderDependencies(deps: DependencyInfo): string {
  const MAX_DISPLAY = 20;
  const lines: string[] = ['## 의존성 요약', ''];

  if (deps.production.length > 0) {
    lines.push(`### 프로덕션 (${deps.production.length}개)`, '');
    lines.push(renderDepTable(deps.production.slice(0, MAX_DISPLAY)));
    if (deps.production.length > MAX_DISPLAY) {
      lines.push(`\n> … 외 ${deps.production.length - MAX_DISPLAY}개`);
    }
    lines.push('');
  }

  if (deps.development.length > 0) {
    lines.push(`### 개발 (${deps.development.length}개)`, '');
    lines.push(renderDepTable(deps.development.slice(0, MAX_DISPLAY)));
    if (deps.development.length > MAX_DISPLAY) {
      lines.push(`\n> … 외 ${deps.development.length - MAX_DISPLAY}개`);
    }
  }

  if (deps.production.length === 0 && deps.development.length === 0) {
    lines.push('<!-- TODO: 의존성 정보를 확인하세요 -->');
  }

  return lines.join('\n').trimEnd();
}

export function renderEnvVars(techStack: TechStack): string {
  const vars: Array<{ key: string; example: string; desc: string }> = [];

  // Node.js / Express
  if (techStack.runtime === 'Node.js') {
    vars.push({ key: 'PORT', example: '3000', desc: '서버 포트' });
    vars.push({ key: 'NODE_ENV', example: 'development', desc: '실행 환경 (development | production | test)' });
  }

  // Frontend / Vite
  if (techStack.buildTools.includes('Vite')) {
    vars.push({ key: 'VITE_API_URL', example: 'http://localhost:3000', desc: '백엔드 API URL' });
  }

  // Database frameworks
  const dbFrameworks = ['Prisma', 'TypeORM', 'Drizzle', 'Mongoose', 'SQLAlchemy'];
  if (techStack.frameworks.some((f) => dbFrameworks.includes(f))) {
    vars.push({ key: 'DATABASE_URL', example: 'postgresql://user:pass@localhost:5432/db', desc: '데이터베이스 연결 문자열' });
  }

  // Python / Flask / Django
  if (techStack.runtime === 'Python') {
    vars.push({ key: 'FLASK_ENV', example: 'development', desc: '실행 환경' });
    vars.push({ key: 'SECRET_KEY', example: 'your-secret-key', desc: '앱 비밀 키' });
  }

  const lines: string[] = ['## 환경 변수', ''];

  if (vars.length > 0) {
    lines.push('`.env` 파일을 프로젝트 루트에 생성하세요:', '');
    lines.push('```env');
    for (const v of vars) {
      lines.push(`# ${v.desc}`);
      lines.push(`${v.key}=${v.example}`);
      lines.push('');
    }
    lines.push('```');
  } else {
    lines.push('```env');
    lines.push('# TODO: 필요한 환경 변수를 여기에 추가하세요');
    lines.push('```');
  }

  return lines.join('\n').trimEnd();
}

export function renderConstraints(): string {
  return `## 알려진 제약사항

<!-- TODO: 알려진 기술적 제약사항이나 한계를 여기에 추가하세요 -->`;
}

// ─── 내부 헬퍼 ─────────────────────────────────────────────────────────────

function buildAsciiTree(tree: DirectoryTree, maxDepth: number): string {
  const lines: string[] = [];
  const rootName = tree.root.name === '.' ? 'project' : tree.root.name;
  lines.push(`${rootName}/`);

  function traverse(node: DirectoryNode, prefix: string, depth: number): void {
    const children = node.children ?? [];
    children.forEach((child, idx) => {
      const isLast = idx === children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      if (child.type === 'directory') {
        lines.push(`${prefix}${connector}${child.name}/`);
        if (depth < maxDepth) {
          traverse(child, prefix + childPrefix, depth + 1);
        } else if ((child.children ?? []).length > 0) {
          lines.push(`${prefix}${childPrefix}    ...`);
        }
      } else {
        lines.push(`${prefix}${connector}${child.name}`);
      }
    });
  }

  traverse(tree.root, '', 0);
  return lines.join('\n');
}

function renderDepTable(deps: DependencyEntry[]): string {
  const header = '| 패키지 | 버전 |\n|--------|------|';
  const rows = deps.map((d) => `| ${d.name} | \`${d.version}\` |`);
  return [header, ...rows].join('\n');
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

const CONFIG_FILE_DESCRIPTIONS: Record<string, string> = {
  'tsconfig.json': 'TypeScript 컴파일러 설정',
  'tsconfig.base.json': 'TypeScript 베이스 설정 (공유)',
  '.eslintrc.cjs': 'ESLint 코드 품질 설정',
  '.eslintrc.json': 'ESLint 코드 품질 설정',
  '.eslintrc.js': 'ESLint 코드 품질 설정',
  'eslint.config.js': 'ESLint 코드 품질 설정',
  '.prettierrc': 'Prettier 코드 포맷 설정',
  'prettier.config.js': 'Prettier 코드 포맷 설정',
  'vite.config.ts': 'Vite 빌드/개발 서버 설정',
  'vite.config.js': 'Vite 빌드/개발 서버 설정',
  'vitest.config.ts': 'Vitest 테스트 설정',
  'tailwind.config.ts': 'Tailwind CSS 설정',
  'tailwind.config.js': 'Tailwind CSS 설정',
  'jest.config.js': 'Jest 테스트 설정',
  'jest.config.ts': 'Jest 테스트 설정',
  'next.config.js': 'Next.js 프레임워크 설정',
  'next.config.ts': 'Next.js 프레임워크 설정',
  'pyproject.toml': 'Python 프로젝트 및 도구 설정',
  'Cargo.toml': 'Rust 패키지 및 의존성 설정',
  'go.mod': 'Go 모듈 정의',
  'docker-compose.yml': 'Docker Compose 서비스 설정',
  'docker-compose.yaml': 'Docker Compose 서비스 설정',
};
