import fs from 'fs/promises';
import path from 'path';
import type {
  ProjectInfo,
  ScriptInfo,
  EntryPoint,
  ExistingDoc,
} from '@claudemd-gen/shared';
import type { AnalyzeOptions } from '@claudemd-gen/shared';
import { StructureAnalyzer } from './structure.analyzer.js';
import { TechStackAnalyzer } from './techstack.analyzer.js';
import { DependencyAnalyzer } from './dependency.analyzer.js';
import { ConfigAnalyzer } from './config.analyzer.js';
import { ArchitectureAnalyzer } from './architecture.analyzer.js';

export interface OrchestratorResult {
  projectInfo: ProjectInfo;
  analysisTimeMs: number;
  fileCount: number;
}

interface PackageJson {
  name?: string;
  description?: string;
  main?: string;
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
}

const EXISTING_DOC_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'DEVELOPMENT.md',
] as const;

export class AnalysisOrchestrator {
  private readonly structure = new StructureAnalyzer();
  private readonly techStack = new TechStackAnalyzer();
  private readonly dependency = new DependencyAnalyzer();
  private readonly config = new ConfigAnalyzer();
  private readonly architecture = new ArchitectureAnalyzer();

  async analyze(
    projectPath: string,
    options: Partial<AnalyzeOptions> = {},
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const resolvedPath = path.resolve(projectPath);

    // Read package.json once, share across helpers
    const pkgJson = await readJson<PackageJson>(path.join(resolvedPath, 'package.json'));

    // Independent analyzers run in parallel
    const [tree, techStack, dependencies, configFiles] = await Promise.all([
      this.structure.analyze(resolvedPath, {
        maxDepth: options.maxDepth ?? 5,
        ignorePaths: options.ignorePaths ?? [],
      }),
      this.techStack.analyze(resolvedPath),
      this.dependency.analyze(resolvedPath, {
        includeDevDeps: options.includeDevDeps ?? true,
      }),
      this.config.analyze(resolvedPath),
    ]);

    // Architecture depends on the completed tree
    const architectureInfo = this.architecture.analyze(tree);

    const projectInfo: ProjectInfo = {
      name: pkgJson?.name ?? path.basename(resolvedPath),
      description: pkgJson?.description ?? null,
      techStack,
      structure: tree,
      dependencies,
      scripts: extractScripts(pkgJson),
      configFiles,
      entryPoints: extractEntryPoints(pkgJson),
      architecture: architectureInfo,
      existingDocs: await collectDocs(resolvedPath),
    };

    return {
      projectInfo,
      analysisTimeMs: Date.now() - startTime,
      fileCount: tree.totalFiles,
    };
  }
}

function extractScripts(pkgJson: PackageJson | null): ScriptInfo[] {
  if (pkgJson?.scripts === undefined) return [];
  return Object.entries(pkgJson.scripts).map(([name, command]) => ({ name, command }));
}

function extractEntryPoints(pkgJson: PackageJson | null): EntryPoint[] {
  if (pkgJson === null) return [];
  const points: EntryPoint[] = [];

  if (pkgJson.main !== undefined) {
    points.push({ kind: 'main', relativePath: pkgJson.main });
  }

  if (pkgJson.bin !== undefined) {
    if (typeof pkgJson.bin === 'string') {
      points.push({ kind: 'bin', relativePath: pkgJson.bin });
    } else {
      for (const binPath of Object.values(pkgJson.bin)) {
        points.push({ kind: 'bin', relativePath: binPath });
      }
    }
  }

  return points;
}

async function collectDocs(projectPath: string): Promise<ExistingDoc[]> {
  const docs: ExistingDoc[] = [];
  for (const filename of EXISTING_DOC_FILES) {
    try {
      const content = await fs.readFile(path.join(projectPath, filename), 'utf-8');
      docs.push({ filename, content });
    } catch {
      // File doesn't exist — skip
    }
  }
  return docs;
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// Re-export individual analyzers for direct use
export { StructureAnalyzer } from './structure.analyzer.js';
export { TechStackAnalyzer } from './techstack.analyzer.js';
export { DependencyAnalyzer } from './dependency.analyzer.js';
export { ConfigAnalyzer } from './config.analyzer.js';
export { ArchitectureAnalyzer } from './architecture.analyzer.js';
