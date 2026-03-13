import { describe, it, expect } from 'vitest';
import type { ProjectInfo } from '@claudemd-gen/shared';
import { PrdGenerator } from './prd.generator.js';

// ─── mock 헬퍼 ───────────────────────────────────────────────────────────────

function makeProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    name: 'my-awesome-app',
    description: 'A sample application for testing generators',
    techStack: {
      languages: ['TypeScript'],
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
        children: [],
      },
      totalFiles: 10,
      totalDirectories: 4,
    },
    dependencies: {
      production: [
        { name: 'react', version: '^18.3.1' },
        { name: 'express', version: '^4.18.2' },
      ],
      development: [
        { name: 'typescript', version: '^5.4.5' },
        { name: 'vitest', version: '^1.5.0' },
      ],
    },
    scripts: [
      { name: 'dev', command: 'vite' },
      { name: 'build', command: 'tsc && vite build' },
      { name: 'test', command: 'vitest run' },
    ],
    configFiles: [
      {
        filename: 'tsconfig.json',
        relativePath: 'tsconfig.json',
        summary: { compilerOptions: '{strict}' },
      },
    ],
    entryPoints: [{ kind: 'main', relativePath: 'src/index.ts' }],
    architecture: {
      pattern: 'mvc',
      layers: ['controllers', 'models', 'routes'],
    },
    existingDocs: [],
    ...overrides,
  };
}

// ─── 테스트 ───────────────────────────────────────────────────────────────────

describe('PrdGenerator', () => {
  const generator = new PrdGenerator();

  it('has the correct name', () => {
    expect(generator.name).toBe('PrdGenerator');
  });

  it('returns a non-empty string', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result.length).toBeGreaterThan(0);
  });

  it('starts with the PRD title', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result.startsWith('# PRD:')).toBe(true);
  });

  it('includes the project name in the title', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result).toContain('# PRD: my-awesome-app');
  });

  it('ends with a newline', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result.endsWith('\n')).toBe(true);
  });

  it('contains a generation note in the header', () => {
    const result = generator.generate(makeProjectInfo());
    expect(result).toContain('초안');
  });

  describe('1. 문제 정의 섹션', () => {
    it('includes the 문제 정의 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 1. 문제 정의');
    });

    it('includes the project description', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('A sample application for testing generators');
    });

    it('includes the project name in the problem definition', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('my-awesome-app');
    });

    it('includes a TODO for the target user section', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('TODO');
    });

    it('mentions runtime in the tech context', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('Node.js');
    });

    it('mentions primary framework in the tech context', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('React');
    });
  });

  describe('2. 목표 섹션', () => {
    it('includes the 목표 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 2. 목표');
    });

    it('includes a goals table', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('| 목표 | 측정 지표 |');
    });

    it('adds test coverage goal when test script exists', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('테스트 커버리지');
    });

    it('adds build goal when build script exists', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('빌드 성공률');
    });

    it('includes 비목표 section', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('비목표');
    });
  });

  describe('3. 기능 명세 섹션', () => {
    it('includes the 기능 명세 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 3. 기능 명세');
    });

    it('includes 핵심 기능 subsection', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('### 3.1 핵심 기능');
    });

    it('infers API endpoint feature from controllers layer', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('API');
    });

    it('infers data model feature from models layer', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('데이터 모델');
    });

    it('infers UI feature from React framework', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('UI');
    });

    it('includes 부가 기능 subsection', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('### 3.2 부가 기능');
    });
  });

  describe('4. 기술 요구사항 섹션', () => {
    it('includes the 기술 요구사항 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 4. 기술 요구사항');
    });

    it('includes the tech stack table', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('| 분류 | 기술 | 버전 |');
    });

    it('lists all detected frameworks with versions', () => {
      const result = generator.generate(makeProjectInfo());
      // Express version from deps
      expect(result).toContain('^4.18.2');
      // React version from deps
      expect(result).toContain('^18.3.1');
    });

    it('shows dash when version is not in dependencies', () => {
      const result = generator.generate(
        makeProjectInfo({
          techStack: {
            languages: ['TypeScript'],
            frameworks: ['SomeUnknownFramework'],
            packageManager: 'npm',
            runtime: 'Node.js',
            buildTools: [],
            testFrameworks: [],
          },
        }),
      );
      expect(result).toContain('SomeUnknownFramework');
    });

    it('includes architecture subsection', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('### 4.2 아키텍처');
    });

    it('shows MVC architecture pattern', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('MVC');
    });

    it('includes API design stub when dev script exists', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('### 4.3 API 설계');
    });
  });

  describe('5. 비기능 요구사항 섹션', () => {
    it('includes the 비기능 요구사항 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 5. 비기능 요구사항');
    });

    it('includes performance, security, availability rows', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('성능');
      expect(result).toContain('보안');
      expect(result).toContain('가용성');
    });
  });

  describe('6. 마일스톤 섹션', () => {
    it('includes the 마일스톤 heading', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('## 6. 마일스톤');
    });

    it('includes a milestone table', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('| 단계 | 기간 | 산출물 |');
    });

    it('includes test milestone when test script exists', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('M4: 테스트');
    });

    it('includes deploy milestone when build script exists', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('M5: 배포');
    });
  });

  describe('footer', () => {
    it('includes a generated-by notice', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('claudemd-gen');
    });
  });

  describe('섹션 구분자', () => {
    it('separates sections with horizontal dividers', () => {
      const result = generator.generate(makeProjectInfo());
      expect(result).toContain('---');
    });
  });

  describe('엣지 케이스', () => {
    it('handles empty scripts gracefully', () => {
      const result = generator.generate(makeProjectInfo({ scripts: [] }));
      expect(result).toContain('## 6. 마일스톤');
      // No test/deploy milestones when scripts is empty
      expect(result).not.toContain('M4: 테스트');
    });

    it('handles null description gracefully', () => {
      const result = generator.generate(makeProjectInfo({ description: null }));
      expect(result).toContain('프로젝트 설명 없음');
    });

    it('handles Python project correctly', () => {
      const result = generator.generate(
        makeProjectInfo({
          techStack: {
            languages: ['Python'],
            frameworks: ['Flask', 'SQLAlchemy'],
            packageManager: 'pip',
            runtime: 'Python',
            buildTools: [],
            testFrameworks: ['pytest'],
          },
        }),
      );
      expect(result).toContain('Python');
      expect(result).toContain('Flask');
    });

    it('does not throw for a minimal project info', () => {
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
  });
});
