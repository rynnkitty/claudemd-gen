import { describe, it, expect } from 'vitest';
import type { DirectoryTree, DirectoryNode } from '@claudemd-gen/shared';
import { ArchitectureAnalyzer } from './architecture.analyzer.js';

describe('ArchitectureAnalyzer', () => {
  const analyzer = new ArchitectureAnalyzer();

  it('has the correct analyzer name', () => {
    expect(analyzer.name).toBe('ArchitectureAnalyzer');
  });

  it('detects MVC pattern when controllers/models/views exist', () => {
    const tree = buildTree('.', ['controllers', 'models', 'views', 'src']);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('mvc');
    expect(result.layers).toContain('controllers');
    expect(result.layers).toContain('models');
    expect(result.layers).toContain('views');
  });

  it('detects MVC even with only controllers + models (partial match)', () => {
    const tree = buildTree('.', ['controllers', 'models', 'utils']);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('mvc');
  });

  it('detects clean-architecture pattern', () => {
    const tree = buildTree('.', ['entities', 'usecases', 'adapters', 'infrastructure']);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('clean-architecture');
  });

  it('detects feature-sliced pattern', () => {
    const tree = buildTree('.', ['app', 'pages', 'widgets', 'features', 'entities', 'shared']);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('feature-sliced');
  });

  it('detects monorepo when packages/ directory exists', () => {
    const tree = buildTreeWithChildren('.', {
      packages: ['frontend', 'backend', 'shared'],
      src: [],
    });
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('monorepo');
  });

  it('detects monorepo when apps/ directory exists', () => {
    const tree = buildTreeWithChildren('.', {
      apps: ['web', 'mobile'],
      libs: ['ui', 'utils'],
    });
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('monorepo');
  });

  it('extracts monorepo package names', () => {
    const tree = buildTreeWithChildren('.', {
      packages: ['frontend', 'backend', 'shared'],
    });
    const result = analyzer.analyze(tree);
    expect(result.packages).toEqual(expect.arrayContaining(['frontend', 'backend', 'shared']));
  });

  it('returns unknown when no patterns match', () => {
    const tree = buildTree('.', ['assets', 'static', 'public']);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('unknown');
    expect(result.layers).toHaveLength(0);
  });

  it('returns empty layers for unknown pattern', () => {
    const tree = buildTree('.', []);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('unknown');
    expect(result.layers).toHaveLength(0);
  });

  it('is case-insensitive for directory names', () => {
    const tree = buildTree('.', ['Controllers', 'Models', 'Views']);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('mvc');
  });

  it('prefers the pattern with the highest proportion of matched layers', () => {
    // clean-architecture has 4/4 matched layers — should win over mvc with 2/3
    const tree = buildTree('.', [
      'entities',
      'usecases',
      'adapters',
      'infrastructure',
      'controllers',
      'models',
    ]);
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('clean-architecture');
  });

  it('detects layers from deeply nested directories', () => {
    // controllers is nested under src/
    const root: DirectoryNode = {
      name: '.',
      path: '.',
      type: 'directory',
      children: [
        {
          name: 'src',
          path: 'src',
          type: 'directory',
          children: [
            makeDir('controllers'),
            makeDir('models'),
            makeDir('views'),
          ],
        },
      ],
    };
    const tree: DirectoryTree = { root, totalFiles: 0, totalDirectories: 4 };
    const result = analyzer.analyze(tree);
    expect(result.pattern).toBe('mvc');
  });
});

// ─── helpers ────────────────────────────────────────────────────────────────

function buildTree(rootName: string, dirNames: string[]): DirectoryTree {
  const children: DirectoryNode[] = dirNames.map(makeDir);
  const root: DirectoryNode = {
    name: rootName,
    path: '.',
    type: 'directory',
    children,
  };
  return { root, totalFiles: 0, totalDirectories: dirNames.length + 1 };
}

function buildTreeWithChildren(
  rootName: string,
  structure: Record<string, string[]>,
): DirectoryTree {
  const children: DirectoryNode[] = Object.entries(structure).map(([name, subDirs]) => ({
    name,
    path: name,
    type: 'directory',
    children: subDirs.map(makeDir),
  }));
  const root: DirectoryNode = {
    name: rootName,
    path: '.',
    type: 'directory',
    children,
  };
  const totalDirectories =
    1 + Object.keys(structure).length + Object.values(structure).flat().length;
  return { root, totalFiles: 0, totalDirectories };
}

function makeDir(name: string): DirectoryNode {
  return { name, path: name, type: 'directory', children: [] };
}
