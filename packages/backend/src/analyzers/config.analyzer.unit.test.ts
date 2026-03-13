import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigAnalyzer } from './config.analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '../__fixtures__');
const sampleNodeMvc = path.join(fixturesDir, 'sample-node-mvc');
const samplePythonFlask = path.join(fixturesDir, 'sample-python-flask');

describe('ConfigAnalyzer', () => {
  const analyzer = new ConfigAnalyzer();

  it('has the correct analyzer name', () => {
    expect(analyzer.name).toBe('ConfigAnalyzer');
  });

  describe('sample-node-mvc (tsconfig.json + .eslintrc.json)', () => {
    it('finds tsconfig.json', async () => {
      const configs = await analyzer.analyze(sampleNodeMvc);
      const filenames = configs.map((c) => c.filename);
      expect(filenames).toContain('tsconfig.json');
    });

    it('finds .eslintrc.json', async () => {
      const configs = await analyzer.analyze(sampleNodeMvc);
      const filenames = configs.map((c) => c.filename);
      expect(filenames).toContain('.eslintrc.json');
    });

    it('relativePath matches filename for root-level config files', async () => {
      const configs = await analyzer.analyze(sampleNodeMvc);
      for (const config of configs) {
        expect(config.relativePath).toBe(config.filename);
      }
    });

    it('summarizes tsconfig.json top-level keys', async () => {
      const configs = await analyzer.analyze(sampleNodeMvc);
      const tsconfig = configs.find((c) => c.filename === 'tsconfig.json');
      expect(tsconfig).toBeDefined();
      // tsconfig has "compilerOptions", "include", "exclude"
      expect(Object.keys(tsconfig!.summary)).toContain('compilerOptions');
    });

    it('summary values for arrays are represented as strings', async () => {
      const configs = await analyzer.analyze(sampleNodeMvc);
      const tsconfig = configs.find((c) => c.filename === 'tsconfig.json');
      expect(tsconfig).toBeDefined();
      const includeValue = tsconfig!.summary['include'];
      expect(typeof includeValue).toBe('string');
      expect(String(includeValue)).toMatch(/^\[\d+ items\]$/);
    });

    it('does not throw for JS/TS config files — returns a note instead', async () => {
      // vite.config.ts would return a note (not in sample-node-mvc, but we can
      // test the fixture that has vite.config.ts)
      const reactConfigs = await analyzer.analyze(
        path.join(fixturesDir, 'sample-react-vite'),
      );
      const viteConfig = reactConfigs.find((c) => c.filename === 'vite.config.ts');
      expect(viteConfig).toBeDefined();
      expect(viteConfig!.summary).toHaveProperty('note');
    });
  });

  describe('sample-python-flask (pyproject.toml)', () => {
    it('finds pyproject.toml', async () => {
      const configs = await analyzer.analyze(samplePythonFlask);
      const filenames = configs.map((c) => c.filename);
      expect(filenames).toContain('pyproject.toml');
    });

    it('summarizes pyproject.toml sections', async () => {
      const configs = await analyzer.analyze(samplePythonFlask);
      const pyproject = configs.find((c) => c.filename === 'pyproject.toml');
      expect(pyproject).toBeDefined();
      expect(typeof pyproject!.summary).toBe('object');
    });
  });

  it('returns an empty array when no known config files exist', async () => {
    // Use a temp path with no files — vitest tmp dir won't have these
    const emptyDir = path.join(fixturesDir, '__nonexistent__');
    const configs = await analyzer.analyze(emptyDir);
    expect(configs).toHaveLength(0);
  });

  it('returns an array of ConfigFile objects with required shape', async () => {
    const configs = await analyzer.analyze(sampleNodeMvc);
    for (const config of configs) {
      expect(typeof config.filename).toBe('string');
      expect(typeof config.relativePath).toBe('string');
      expect(typeof config.summary).toBe('object');
    }
  });
});
