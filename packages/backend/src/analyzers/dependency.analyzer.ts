import fs from 'fs/promises';
import path from 'path';
import type { DependencyEntry, DependencyInfo } from '@claudemd-gen/shared';

export interface DependencyAnalyzerOptions {
  includeDevDeps: boolean;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class DependencyAnalyzer {
  readonly name = 'DependencyAnalyzer';

  async analyze(
    projectPath: string,
    options: Partial<DependencyAnalyzerOptions> = {},
  ): Promise<DependencyInfo> {
    const includeDevDeps = options.includeDevDeps ?? true;

    const pkgResult = await this.parsePackageJson(projectPath, includeDevDeps);
    if (pkgResult !== null) return pkgResult;

    const pyResult = await this.parseRequirementsTxt(projectPath);
    if (pyResult !== null) return pyResult;

    const goResult = await this.parseGoMod(projectPath);
    if (goResult !== null) return goResult;

    const cargoResult = await this.parseCargoToml(projectPath);
    if (cargoResult !== null) return cargoResult;

    return { production: [], development: [] };
  }

  private async parsePackageJson(
    projectPath: string,
    includeDevDeps: boolean,
  ): Promise<DependencyInfo | null> {
    try {
      const raw = JSON.parse(
        await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'),
      ) as PackageJson;
      const production = entriesToArray(raw.dependencies ?? {});
      const development = includeDevDeps ? entriesToArray(raw.devDependencies ?? {}) : [];
      return { production, development };
    } catch {
      return null;
    }
  }

  private async parseRequirementsTxt(projectPath: string): Promise<DependencyInfo | null> {
    try {
      const content = await fs.readFile(
        path.join(projectPath, 'requirements.txt'),
        'utf-8',
      );
      const production = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('-'))
        .map((line): DependencyEntry | null => {
          // e.g. "flask==3.0.3", "requests>=2.28", "pydantic[email]~=2.0"
          const match = /^([A-Za-z0-9_.-]+)(?:\[.*?])?(?:\s*([><=!~].+))?$/.exec(line);
          if (match === null) return null;
          return { name: match[1]!, version: match[2]?.trim() ?? '*' };
        })
        .filter((e): e is DependencyEntry => e !== null);
      return { production, development: [] };
    } catch {
      return null;
    }
  }

  private async parseGoMod(projectPath: string): Promise<DependencyInfo | null> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'go.mod'), 'utf-8');
      const production: DependencyEntry[] = [];

      // Multi-line require block: require (\n\tmodule version\n)
      const blockMatch = /require\s*\(([\s\S]*?)\)/.exec(content);
      if (blockMatch !== null) {
        for (const line of blockMatch[1]!.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.length === 0 || trimmed.startsWith('//')) continue;
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
            production.push({ name: parts[0], version: parts[1] });
          }
        }
      }

      // Single-line: require module version
      const singleMatch = /^require\s+(\S+)\s+(\S+)/m.exec(content);
      if (singleMatch !== null && production.length === 0) {
        production.push({ name: singleMatch[1]!, version: singleMatch[2]! });
      }

      if (production.length === 0) return null;
      return { production, development: [] };
    } catch {
      return null;
    }
  }

  private async parseCargoToml(projectPath: string): Promise<DependencyInfo | null> {
    try {
      const content = await fs.readFile(path.join(projectPath, 'Cargo.toml'), 'utf-8');
      const production: DependencyEntry[] = [];
      const development: DependencyEntry[] = [];

      let section = '';
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[')) {
          section = trimmed;
          continue;
        }
        if (trimmed.length === 0 || trimmed.startsWith('#')) continue;

        // Simple version string: serde = "1.0"
        const simpleMatch = /^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/.exec(trimmed);
        // Inline table: serde = { version = "1.0", features = [...] }
        const tableMatch = /^([a-zA-Z0-9_-]+)\s*=\s*\{[^}]*version\s*=\s*"([^"]+)"/.exec(
          trimmed,
        );

        const match = simpleMatch ?? tableMatch;
        if (match !== null) {
          const entry: DependencyEntry = { name: match[1]!, version: match[2]! };
          if (section === '[dev-dependencies]') {
            development.push(entry);
          } else if (section === '[dependencies]') {
            production.push(entry);
          }
        }
      }

      if (production.length === 0 && development.length === 0) return null;
      return { production, development };
    } catch {
      return null;
    }
  }
}

function entriesToArray(deps: Record<string, string>): DependencyEntry[] {
  return Object.entries(deps).map(([name, version]) => ({ name, version }));
}
