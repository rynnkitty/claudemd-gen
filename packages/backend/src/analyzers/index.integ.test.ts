import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { AnalysisOrchestrator } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '../__fixtures__');
const sampleNodeMvc = path.join(fixturesDir, 'sample-node-mvc');
const sampleReactVite = path.join(fixturesDir, 'sample-react-vite');
const samplePythonFlask = path.join(fixturesDir, 'sample-python-flask');

describe('AnalysisOrchestrator (integration)', () => {
  const orchestrator = new AnalysisOrchestrator();

  describe('sample-node-mvc', () => {
    it('returns a complete ProjectInfo', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      expect(projectInfo.name).toBe('sample-node-mvc');
      expect(projectInfo.description).toBeTruthy();
    });

    it('includes techStack', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      expect(projectInfo.techStack).toBeDefined();
      expect(projectInfo.techStack.runtime).toBe('Node.js');
    });

    it('includes directory structure', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      expect(projectInfo.structure.root.name).toBe('sample-node-mvc');
      expect(projectInfo.structure.totalFiles).toBeGreaterThan(0);
    });

    it('includes dependencies', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      const prodNames = projectInfo.dependencies.production.map((d) => d.name);
      expect(prodNames).toContain('express');
    });

    it('includes scripts from package.json', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      const scriptNames = projectInfo.scripts.map((s) => s.name);
      expect(scriptNames).toContain('dev');
      expect(scriptNames).toContain('build');
      expect(scriptNames).toContain('test');
    });

    it('includes entryPoints from package.json main field', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      const mainEntry = projectInfo.entryPoints.find((e) => e.kind === 'main');
      expect(mainEntry).toBeDefined();
    });

    it('includes config files', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      const filenames = projectInfo.configFiles.map((c) => c.filename);
      expect(filenames).toContain('tsconfig.json');
    });

    it('detects MVC architecture', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc);
      expect(projectInfo.architecture.pattern).toBe('mvc');
    });

    it('records analysisTimeMs as a positive number', async () => {
      const { analysisTimeMs } = await orchestrator.analyze(sampleNodeMvc);
      expect(analysisTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('reports fileCount matching structure totalFiles', async () => {
      const { projectInfo, fileCount } = await orchestrator.analyze(sampleNodeMvc);
      expect(fileCount).toBe(projectInfo.structure.totalFiles);
    });
  });

  describe('sample-react-vite', () => {
    it('detects React framework', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleReactVite);
      expect(projectInfo.techStack.frameworks).toContain('React');
    });

    it('detects Vite as build tool', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleReactVite);
      expect(projectInfo.techStack.buildTools).toContain('Vite');
    });
  });

  describe('sample-python-flask', () => {
    it('detects Python runtime', async () => {
      const { projectInfo } = await orchestrator.analyze(samplePythonFlask);
      expect(projectInfo.techStack.runtime).toBe('Python');
    });

    it('detects Flask framework', async () => {
      const { projectInfo } = await orchestrator.analyze(samplePythonFlask);
      expect(projectInfo.techStack.frameworks).toContain('Flask');
    });

    it('still returns a valid ProjectInfo shape', async () => {
      const { projectInfo } = await orchestrator.analyze(samplePythonFlask);
      // description is null for Python projects (no package.json)
      expect(typeof projectInfo.description === 'string' || projectInfo.description === null).toBe(
        true,
      );
      expect(projectInfo).toMatchObject({
        name: expect.any(String),
        techStack: expect.any(Object),
        structure: expect.any(Object),
        dependencies: expect.any(Object),
        scripts: expect.any(Array),
        configFiles: expect.any(Array),
        entryPoints: expect.any(Array),
        architecture: expect.any(Object),
        existingDocs: expect.any(Array),
      });
    });
  });

  describe('options passthrough', () => {
    it('respects maxDepth option', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc, { maxDepth: 1 });
      const srcNode = (projectInfo.structure.root.children ?? []).find(
        (c) => c.type === 'directory' && c.name === 'src',
      );
      expect(srcNode?.children).toHaveLength(0);
    });

    it('excludes devDeps when includeDevDeps is false', async () => {
      const { projectInfo } = await orchestrator.analyze(sampleNodeMvc, {
        includeDevDeps: false,
      });
      expect(projectInfo.dependencies.development).toHaveLength(0);
    });
  });
});
