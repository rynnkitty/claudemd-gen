import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DependencyAnalyzer } from './dependency.analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '../__fixtures__');
const sampleNodeMvc = path.join(fixturesDir, 'sample-node-mvc');
const samplePythonFlask = path.join(fixturesDir, 'sample-python-flask');

const analyzer = new DependencyAnalyzer();

describe('DependencyAnalyzer', () => {

  it('has the correct analyzer name', () => {
    expect(analyzer.name).toBe('DependencyAnalyzer');
  });

  describe('package.json (Node.js)', () => {
    it('parses production dependencies', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      const names = result.production.map((d) => d.name);
      expect(names).toContain('express');
      expect(names).toContain('cors');
    });

    it('parses development dependencies', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      const names = result.development.map((d) => d.name);
      expect(names).toContain('typescript');
      expect(names).toContain('vitest');
    });

    it('includes version strings for each dependency', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      for (const dep of result.production) {
        expect(dep.version).toBeTruthy();
      }
    });

    it('returns DependencyEntry objects with name and version', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      const express = result.production.find((d) => d.name === 'express');
      expect(express).toBeDefined();
      expect(typeof express?.name).toBe('string');
      expect(typeof express?.version).toBe('string');
    });

    it('excludes devDependencies when includeDevDeps is false', async () => {
      const result = await analyzer.analyze(sampleNodeMvc, { includeDevDeps: false });
      expect(result.development).toHaveLength(0);
      expect(result.production.length).toBeGreaterThan(0);
    });

    it('includes devDependencies by default', async () => {
      const result = await analyzer.analyze(sampleNodeMvc);
      expect(result.development.length).toBeGreaterThan(0);
    });
  });

  describe('requirements.txt (Python)', () => {
    it('parses Python production dependencies', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      const names = result.production.map((d) => d.name);
      expect(names).toContain('flask');
      expect(names).toContain('sqlalchemy');
      expect(names).toContain('pytest');
    });

    it('extracts version from pinned requirements (== notation)', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      const flask = result.production.find((d) => d.name === 'flask');
      expect(flask?.version).toBe('==3.0.3');
    });

    it('returns empty development array for requirements.txt', async () => {
      const result = await analyzer.analyze(samplePythonFlask);
      expect(result.development).toHaveLength(0);
    });
  });

  it('returns empty arrays when no dependency file is found', async () => {
    // Use fixtures root dir which has no dependency files
    const result = await analyzer.analyze(fixturesDir);
    expect(result.production).toHaveLength(0);
    expect(result.development).toHaveLength(0);
  });
});

// ─── go.mod (Go) ──────────────────────────────────────────────────────────────

describe('go.mod (Go) — multi-line require block', () => {
  let goDir: string;

  beforeAll(async () => {
    goDir = await mkdtemp(path.join(tmpdir(), 'dep-test-go-'));
    await writeFile(
      path.join(goDir, 'go.mod'),
      [
        'module github.com/example/myapp',
        '',
        'go 1.21',
        '',
        'require (',
        '\tgithub.com/gin-gonic/gin v1.9.1',
        '\tgithub.com/stretchr/testify v1.8.4',
        '\t// indirect comment line',
        ')',
      ].join('\n'),
    );
  });

  afterAll(() => rm(goDir, { recursive: true, force: true }));

  it('parses production dependencies from go.mod', async () => {
    const result = await analyzer.analyze(goDir);
    const names = result.production.map((d) => d.name);
    expect(names).toContain('github.com/gin-gonic/gin');
    expect(names).toContain('github.com/stretchr/testify');
  });

  it('extracts version strings', async () => {
    const result = await analyzer.analyze(goDir);
    const gin = result.production.find((d) => d.name === 'github.com/gin-gonic/gin');
    expect(gin?.version).toBe('v1.9.1');
  });

  it('returns empty development array for go.mod', async () => {
    const result = await analyzer.analyze(goDir);
    expect(result.development).toHaveLength(0);
  });
});

describe('go.mod (Go) — single-line require', () => {
  let goDir: string;

  beforeAll(async () => {
    goDir = await mkdtemp(path.join(tmpdir(), 'dep-test-go-single-'));
    await writeFile(
      path.join(goDir, 'go.mod'),
      'module github.com/example/simple\n\ngo 1.21\n\nrequire github.com/some/dep v1.0.0\n',
    );
  });

  afterAll(() => rm(goDir, { recursive: true, force: true }));

  it('parses single-line require statement', async () => {
    const result = await analyzer.analyze(goDir);
    const names = result.production.map((d) => d.name);
    expect(names).toContain('github.com/some/dep');
  });

  it('extracts version from single-line require', async () => {
    const result = await analyzer.analyze(goDir);
    const dep = result.production.find((d) => d.name === 'github.com/some/dep');
    expect(dep?.version).toBe('v1.0.0');
  });
});

describe('go.mod with no valid require entries returns null (falls through)', () => {
  let goDir: string;

  beforeAll(async () => {
    goDir = await mkdtemp(path.join(tmpdir(), 'dep-test-go-empty-'));
    // go.mod exists but has no require statements
    await writeFile(
      path.join(goDir, 'go.mod'),
      'module github.com/example/empty\n\ngo 1.21\n',
    );
  });

  afterAll(() => rm(goDir, { recursive: true, force: true }));

  it('returns empty arrays when go.mod has no dependencies', async () => {
    const result = await analyzer.analyze(goDir);
    expect(result.production).toHaveLength(0);
    expect(result.development).toHaveLength(0);
  });
});

// ─── Cargo.toml (Rust) ────────────────────────────────────────────────────────

describe('Cargo.toml (Rust)', () => {
  let rustDir: string;

  beforeAll(async () => {
    rustDir = await mkdtemp(path.join(tmpdir(), 'dep-test-rust-'));
    await writeFile(
      path.join(rustDir, 'Cargo.toml'),
      [
        '[package]',
        'name = "sample-rust"',
        'version = "0.1.0"',
        'edition = "2021"',
        '',
        '[dependencies]',
        'serde = { version = "1.0", features = ["derive"] }',
        'tokio = "1.0"',
        '',
        '[dev-dependencies]',
        'mockall = "0.11"',
      ].join('\n'),
    );
  });

  afterAll(() => rm(rustDir, { recursive: true, force: true }));

  it('parses production dependencies from Cargo.toml', async () => {
    const result = await analyzer.analyze(rustDir);
    const names = result.production.map((d) => d.name);
    expect(names).toContain('tokio');
    expect(names).toContain('serde');
  });

  it('extracts version from simple string value', async () => {
    const result = await analyzer.analyze(rustDir);
    const tokio = result.production.find((d) => d.name === 'tokio');
    expect(tokio?.version).toBe('1.0');
  });

  it('extracts version from inline table syntax', async () => {
    const result = await analyzer.analyze(rustDir);
    const serde = result.production.find((d) => d.name === 'serde');
    expect(serde?.version).toBe('1.0');
  });

  it('parses dev-dependencies into development array', async () => {
    const result = await analyzer.analyze(rustDir);
    const names = result.development.map((d) => d.name);
    expect(names).toContain('mockall');
  });
});
