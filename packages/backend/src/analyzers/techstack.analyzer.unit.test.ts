import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { TechStackAnalyzer } from './techstack.analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '../__fixtures__');
const sampleNodeMvc = path.join(fixturesDir, 'sample-node-mvc');
const sampleReactVite = path.join(fixturesDir, 'sample-react-vite');
const samplePythonFlask = path.join(fixturesDir, 'sample-python-flask');

describe('TechStackAnalyzer', () => {
  const analyzer = new TechStackAnalyzer();

  it('has the correct analyzer name', () => {
    expect(analyzer.name).toBe('TechStackAnalyzer');
  });

  describe('sample-node-mvc (Express + TypeScript)', () => {
    it('detects npm as package manager (package-lock.json absent → falls back to package.json)', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(result.packageManager).toBe('npm');
    });

    it('detects Node.js as runtime', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(result.runtime).toBe('Node.js');
    });

    it('detects TypeScript language from .ts files', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(result.languages).toContain('TypeScript');
    });

    it('detects Express as a framework', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(result.frameworks).toContain('Express');
    });

    it('detects Vitest as a test framework', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(result.testFrameworks).toContain('Vitest');
    });

    it('returns a valid TechStack shape', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(Array.isArray(result.languages)).toBe(true);
      expect(Array.isArray(result.frameworks)).toBe(true);
      expect(Array.isArray(result.buildTools)).toBe(true);
      expect(Array.isArray(result.testFrameworks)).toBe(true);
    });
  });

  describe('sample-react-vite (React + Vite + Tailwind)', () => {
    it('detects React as a framework', async () => {
      const result = await analyzer.analyze(sampleReactVite);
      expect(result.frameworks).toContain('React');
    });

    it('detects Vite as a build tool', async () => {
      const result = await analyzer.analyze(sampleReactVite);
      expect(result.buildTools).toContain('Vite');
    });

    it('detects Tailwind CSS as a framework', async () => {
      const result = await analyzer.analyze(sampleReactVite);
      expect(result.frameworks).toContain('Tailwind CSS');
    });

    it('detects TypeScript and TSX from source files', async () => {
      const result = await analyzer.analyze(sampleReactVite);
      expect(result.languages).toContain('TypeScript');
    });
  });

  describe('sample-python-flask (Python + Flask)', () => {
    it('detects Python as runtime', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      expect(result.runtime).toBe('Python');
    });

    it('detects Flask from requirements.txt', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      expect(result.frameworks).toContain('Flask');
    });

    it('detects SQLAlchemy from requirements.txt', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      expect(result.frameworks).toContain('SQLAlchemy');
    });

    it('detects pytest as a test framework', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      expect(result.testFrameworks).toContain('pytest');
    });

    it('detects Python language from .py files', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      expect(result.languages).toContain('Python');
    });

    it('detects poetry as packageManager when pyproject.toml exists', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      // pyproject.toml maps to 'poetry' in PACKAGE_MANAGER_FILES
      expect(result.packageManager).toBe('poetry');
    });
  });

  it('does not produce duplicate framework entries', async () => {
    const result = await analyzer.analyze(sampleReactVite);
    const all = [...result.frameworks, ...result.buildTools, ...result.testFrameworks];
    const unique = new Set(all);
    expect(all.length).toBe(unique.size);
  });
});
