import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { StructureAnalyzer } from './structure.analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '../__fixtures__');
const sampleNodeMvc = path.join(fixturesDir, 'sample-node-mvc');
const sampleReactVite = path.join(fixturesDir, 'sample-react-vite');

describe('StructureAnalyzer', () => {
  const analyzer = new StructureAnalyzer();

  it('has the correct analyzer name', () => {
    expect(analyzer.name).toBe('StructureAnalyzer');
  });

  it('builds the root node with the project directory name', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc);
    expect(tree.root.name).toBe('sample-node-mvc');
    expect(tree.root.type).toBe('directory');
    expect(tree.root.path).toBe('.');
  });

  it('counts files and directories', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc);
    expect(tree.totalFiles).toBeGreaterThan(0);
    expect(tree.totalDirectories).toBeGreaterThan(0);
  });

  it('includes known source files in the tree', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc);
    const allFiles = collectFilePaths(tree.root);
    expect(allFiles.some((p) => p.includes('package.json'))).toBe(true);
    expect(allFiles.some((p) => p.includes('tsconfig.json'))).toBe(true);
  });

  it('records correct file extension', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc);
    const allFiles = collectFileNodes(tree.root);
    const tsFile = allFiles.find((f) => f.name === 'index.ts');
    expect(tsFile).toBeDefined();
    expect(tsFile?.extension).toBe('.ts');
  });

  it('sorts directories before files', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc);
    const rootChildren = tree.root.children ?? [];
    const firstDirIdx = rootChildren.findIndex((c) => c.type === 'directory');
    const firstFileIdx = rootChildren.findIndex((c) => c.type === 'file');
    // All directories should appear before the first file
    if (firstDirIdx !== -1 && firstFileIdx !== -1) {
      expect(firstDirIdx).toBeLessThan(firstFileIdx);
    }
  });

  it('excludes directories listed in IGNORE_DIRECTORIES', async () => {
    // The fixture does not have node_modules, but we can verify the pattern
    // by passing a known dir name as ignorePaths
    const tree = await analyzer.analyze(sampleNodeMvc, { ignorePaths: ['src'] });
    const rootDirNames = (tree.root.children ?? [])
      .filter((c) => c.type === 'directory')
      .map((c) => c.name);
    expect(rootDirNames).not.toContain('src');
  });

  it('respects maxDepth: depth=1 should not recurse into subdirectories', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc, { maxDepth: 1 });
    // src directory should exist but have no children
    const srcNode = (tree.root.children ?? []).find(
      (c) => c.type === 'directory' && c.name === 'src',
    );
    expect(srcNode).toBeDefined();
    expect(srcNode?.children).toHaveLength(0);
  });

  it('respects maxDepth: depth=2 descends one level into src', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc, { maxDepth: 2 });
    const srcNode = (tree.root.children ?? []).find(
      (c) => c.type === 'directory' && c.name === 'src',
    );
    expect(srcNode?.children?.length).toBeGreaterThan(0);
  });

  it('ignores files matching IGNORE_FILE_PATTERNS (e.g. *.log)', async () => {
    // All files in the tree should not have .log extension
    const tree = await analyzer.analyze(sampleNodeMvc);
    const allFiles = collectFileNodes(tree.root);
    const logFiles = allFiles.filter((f) => f.extension === '.log');
    expect(logFiles).toHaveLength(0);
  });

  it('handles a different fixture (sample-react-vite)', async () => {
    const tree = await analyzer.analyze(sampleReactVite);
    const allFiles = collectFilePaths(tree.root);
    expect(allFiles.some((p) => p.includes('App.tsx'))).toBe(true);
  });

  it('returns a relative path for file nodes', async () => {
    const tree = await analyzer.analyze(sampleNodeMvc);
    const allFiles = collectFileNodes(tree.root);
    for (const file of allFiles) {
      expect(path.isAbsolute(file.path)).toBe(false);
    }
  });
});

// ─── helpers ────────────────────────────────────────────────────────────────

function collectFilePaths(
  node: import('@claudemd-gen/shared').DirectoryNode,
): string[] {
  const paths: string[] = [];
  const visit = (n: import('@claudemd-gen/shared').DirectoryNode): void => {
    if (n.type === 'file') paths.push(n.path);
    for (const child of n.children ?? []) visit(child);
  };
  visit(node);
  return paths;
}

function collectFileNodes(
  node: import('@claudemd-gen/shared').DirectoryNode,
): import('@claudemd-gen/shared').DirectoryNode[] {
  const files: import('@claudemd-gen/shared').DirectoryNode[] = [];
  const visit = (n: import('@claudemd-gen/shared').DirectoryNode): void => {
    if (n.type === 'file') files.push(n);
    for (const child of n.children ?? []) visit(child);
  };
  visit(node);
  return files;
}
