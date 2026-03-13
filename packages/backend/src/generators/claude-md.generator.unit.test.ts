import { describe, it, expect } from 'vitest';
import type { ProjectInfo } from '@claudemd-gen/shared';
import { ClaudeMdGenerator } from './claude-md.generator.js';

// ─── mock 헬퍼 ───────────────────────────────────────────────────────────────

function makeProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    name: 'my-awesome-app',
    description: 'A sample application for testing generators',
    techStack: {
      languages: ['TypeScript', 'CSS'],
      frameworks: ['React', 'Express'],
      packageManager: 'npm',
      runtime: 'Node.js',
      buildTools: ['Vite'],
      testFrameworks: ['Vitest'],
    },
    structure: {
      root: {
        name: 'my-awesome-app',
        path: '.',
        type: 'directory',
        children: [
          {
            name: 'src',
            path: 'src',
            type: 'directory',
            children: [
              { name: 'index.ts', path: 'src/index.ts', type: 'file', extension: '.ts' },
              {
                name: 'components',
                path: 'src/components',
                type: 'directory',
                children: [
                  {
                    name: 'Button.tsx',
                    path: 'src/components/Button.tsx',
                    type: 'file',
                    extension: '.tsx',
                  },
                ],
              },
            ],
          },
          { name: 'package.json', path: 'package.json', type: 'file', extension: '.json' },
          { name: 'tsconfig.json', path: 'tsconfig.json', type: 'file', extension: '.json' },
        ],
      },
      totalFiles: 4,
      totalDirectories: 3,
    },
    dependencies: {
      production: [
        { name: 'react', version: '^18.3.1' },
        { name: 'express', version: '^4.18.2' },
      ],
      development: [
        { name: 'typescript', version: '^5.4.5' },
        { name: 'vite', version: '^5.2.10' },
        { name: 'vitest', version: '^1.5.0' },
      ],
    },
    scripts: [
      { name: 'dev', command: 'vite' },
      { name: 'build', command: 'tsc && vite build' },
      { name: 'test', command: 'vitest run' },
      { name: 'lint', command: 'eslint src' },
    ],
    configFiles: [
      {
        filename: 'tsconfig.json',
        relativePath: 'tsconfig.json',
        summary: { compilerOptions: '{strict, target, module}', include: '[1 items]' },
      },
      {
        filename: '.eslintrc.json',
        relativePath: '.eslintrc.json',
        summary: { extends: '["eslint:recommended"]' },
      },
    ],
    entryPoints: [{ kind: 'main', relativePath: 'src/index.ts' }],
    architecture: {
      pattern: 'mvc',
      layers: ['controllers', 'models', 'routes'],
    },
    existingDocs: [
      { filename: 'README.md', content: '# my-awesome-app\nA sample app.' },
    ],
    ...overrides,
  };
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('ClaudeMdGenerator', () => {
  const generator = new ClaudeMdGenerator();

  it('has the correct name', () => {
    expect(generator.name).toBe('ClaudeMdGenerator');
  });

  it('returns a non-empty string', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result.length).toBeGreaterThan(0);
  });

  it('starts with the CLAUDE.md header', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result.startsWith('# CLAUDE.md')).toBe(true);
  });

  it('ends with a newline', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result.endsWith('\n')).toBe(true);
  });

  describe('프로젝트 개요 섹션', () => {
    it('contains the project name', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('my-awesome-app');
    });

    it('contains the project description', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('A sample application for testing generators');
    });

    it('uses a TODO placeholder when description is null', () => {
      const result = generator.generate(makeProjectInfo({ description: null }));
      expect(result).toContain('TODO');
    });

    it('contains runtime information', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('Node.js');
    });

    it('contains package manager information', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('npm');
    });
  });

  describe('기술 스택 섹션', () => {
    it('includes the 기술 스택 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 기술 스택');
    });

    it('lists detected languages', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('TypeScript');
    });

    it('lists detected frameworks', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('React');
      expect(result).toContain('Express');
    });

    it('lists build tools', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('Vite');
    });

    it('lists test frameworks', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('Vitest');
    });

    it('shows dash when no frameworks are detected', () => {
      const result = generator.generate(
        makeProjectInfo({
          techStack: {
            languages: ['Go'],
            frameworks: [],
            packageManager: 'go modules',
            runtime: 'Go',
            buildTools: [],
            testFrameworks: [],
          },
        }),
      );
      expect(result).toContain('| 프레임워크 / 라이브러리 | - |');
    });
  });

  describe('디렉토리 구조 섹션', () => {
    it('includes the 디렉토리 구조 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 디렉토리 구조');
    });

    it('renders the tree in a code block', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('```\n');
      expect(result).toContain('my-awesome-app/');
    });

    it('includes source files', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('src/');
    });
  });

  describe('아키텍처 섹션', () => {
    it('includes the 아키텍처 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 아키텍처');
    });

    it('shows MVC pattern label', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('MVC');
    });

    it('shows detected layers', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('controllers');
      expect(result).toContain('models');
    });

    it('shows monorepo packages when applicable', () => {
      const result = generator.generate(
        makeProjectInfo({
          architecture: {
            pattern: 'monorepo',
            layers: ['packages'],
            packages: ['frontend', 'backend', 'shared'],
          },
        }),
      );
      expect(result).toContain('frontend');
      expect(result).toContain('backend');
      expect(result).toContain('shared');
    });
  });

  describe('개발 명령어 섹션', () => {
    it('includes the 개발 명령어 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 개발 명령어');
    });

    it('renders scripts in a bash code block', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('```bash');
      expect(result).toContain('npm run dev');
    });

    it('includes all known scripts', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('npm run build');
      expect(result).toContain('npm run test');
      expect(result).toContain('npm run lint');
    });

    it('adds a TODO comment when scripts list is empty', () => {
      const result = generator.generate(makeProjectInfo({ scripts: [] }));
      expect(result).toContain('TODO');
    });
  });

  describe('코딩 컨벤션 섹션', () => {
    it('includes the 코딩 컨벤션 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 코딩 컨벤션');
    });

    it('mentions TypeScript strict mode when tsconfig has strict', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('strict');
    });

    it('mentions React hooks convention when React is in the stack', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('함수형 컴포넌트');
    });
  });

  describe('주요 파일 섹션', () => {
    it('includes the 주요 파일 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 주요 파일');
    });

    it('lists entry points', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('src/index.ts');
    });

    it('lists config files with descriptions', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('tsconfig.json');
      expect(result).toContain('.eslintrc.json');
    });
  });

  describe('의존성 요약 섹션', () => {
    it('includes the 의존성 요약 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 의존성 요약');
    });

    it('lists production dependencies in a table', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('react');
      expect(result).toContain('express');
    });

    it('lists development dependencies', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('typescript');
    });

    it('shows dependency counts', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('프로덕션 (2개)');
      expect(result).toContain('개발 (3개)');
    });

    it('shows TODO when no dependencies found', () => {
      const result = generator.generate(
        makeProjectInfo({ dependencies: { production: [], development: [] } }),
      );
      expect(result).toContain('TODO');
    });
  });

  describe('환경 변수 섹션', () => {
    it('includes the 환경 변수 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 환경 변수');
    });

    it('suggests PORT and NODE_ENV for Node.js projects', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('PORT');
      expect(result).toContain('NODE_ENV');
    });

    it('suggests VITE_API_URL when Vite is in build tools', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('VITE_API_URL');
    });

    it('suggests FLASK_ENV for Python/Flask projects', () => {
      const result = generator.generate(
        makeProjectInfo({
          techStack: {
            languages: ['Python'],
            frameworks: ['Flask'],
            packageManager: 'pip',
            runtime: 'Python',
            buildTools: [],
            testFrameworks: ['pytest'],
          },
        }),
      );
      expect(result).toContain('FLASK_ENV');
    });
  });

  describe('알려진 제약사항 섹션', () => {
    it('includes the 알려진 제약사항 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 알려진 제약사항');
    });
  });

  describe('엣지 케이스', () => {
    it('handles a project with all empty arrays gracefully', () => {
      const minimal = makeProjectInfo({
        description: null,
        dependencies: { production: [], development: [] },
        scripts: [],
        configFiles: [],
        entryPoints: [],
        architecture: { pattern: 'unknown', layers: [] },
      });
      expect(() => generator.generate(minimal)).not.toThrow();
    });

    it('handles Python project without package.json conventions', () => {
      const pyProject = makeProjectInfo({
        techStack: {
          languages: ['Python'],
          frameworks: ['Flask', 'SQLAlchemy'],
          packageManager: 'pip',
          runtime: 'Python',
          buildTools: [],
          testFrameworks: ['pytest'],
        },
      });
      const result = generator.generate(pyProject);
      expect(result).toContain('Python');
      expect(result).toContain('Flask');
    });
  });
});
