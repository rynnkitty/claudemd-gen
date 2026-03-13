import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import type { TechStack } from '@claudemd-gen/shared';
import {
  PACKAGE_MANAGER_FILES,
  RUNTIME_INDICATOR_FILES,
  EXTENSION_TO_LANGUAGE,
  NPM_PACKAGE_TO_FRAMEWORK,
  PYTHON_PACKAGE_TO_FRAMEWORK,
  GO_MODULE_TO_FRAMEWORK,
} from '@claudemd-gen/shared';

// Lock files that reveal the actual package manager in use
const LOCK_FILE_ORDER = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'] as const;

// Directories to skip during language detection scan
const SCAN_SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.venv',
  'venv',
]);

const BUILD_TOOLS = new Set([
  'Vite',
  'webpack',
  'Rollup',
  'Parcel',
  'esbuild',
  'Turbopack',
]);

const TEST_FRAMEWORKS = new Set([
  'Vitest',
  'Jest',
  'Mocha',
  'Jasmine',
  'Playwright',
  'Cypress',
  'pytest',
]);

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class TechStackAnalyzer {
  readonly name = 'TechStackAnalyzer';

  async analyze(projectPath: string): Promise<TechStack> {
    const [packageManager, runtime] = await this.detectPackageManagerAndRuntime(projectPath);
    const languages = await this.detectLanguages(projectPath);
    const { frameworks, buildTools, testFrameworks } = await this.detectFrameworks(
      projectPath,
      runtime,
    );

    return { languages, frameworks, packageManager, runtime, buildTools, testFrameworks };
  }

  private async detectPackageManagerAndRuntime(
    projectPath: string,
  ): Promise<[string | null, string | null]> {
    // Lock files → precise package manager detection
    let packageManager: string | null = null;
    for (const lockFile of LOCK_FILE_ORDER) {
      if (await fileExists(path.join(projectPath, lockFile))) {
        packageManager = PACKAGE_MANAGER_FILES[lockFile] ?? null;
        break;
      }
    }

    // Manifest files as fallback
    if (packageManager === null) {
      for (const [file, pm] of Object.entries(PACKAGE_MANAGER_FILES)) {
        if ((LOCK_FILE_ORDER as readonly string[]).includes(file)) continue;
        if (await fileExists(path.join(projectPath, file))) {
          packageManager = pm;
          break;
        }
      }
    }

    // Runtime detection (first match wins)
    let runtime: string | null = null;
    for (const [file, rt] of Object.entries(RUNTIME_INDICATOR_FILES)) {
      if (file.includes('*')) continue;
      if (await fileExists(path.join(projectPath, file))) {
        runtime = rt;
        break;
      }
    }

    return [packageManager, runtime];
  }

  private async detectLanguages(projectPath: string): Promise<string[]> {
    const langCount = new Map<string, number>();
    await this.scanExtensions(projectPath, 0, 3, langCount);
    return [...langCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);
  }

  private async scanExtensions(
    dirPath: string,
    depth: number,
    maxDepth: number,
    langCount: Map<string, number>,
  ): Promise<void> {
    if (depth > maxDepth) return;

    let entries: Dirent[];
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SCAN_SKIP_DIRS.has(entry.name)) continue;
        await this.scanExtensions(path.join(dirPath, entry.name), depth + 1, maxDepth, langCount);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const lang = EXTENSION_TO_LANGUAGE[ext];
        if (lang !== undefined) {
          langCount.set(lang, (langCount.get(lang) ?? 0) + 1);
        }
      }
    }
  }

  private async detectFrameworks(
    projectPath: string,
    _runtime: string | null,
  ): Promise<{ frameworks: string[]; buildTools: string[]; testFrameworks: string[] }> {
    const frameworks: string[] = [];
    const buildTools: string[] = [];
    const testFrameworks: string[] = [];

    // Node.js: parse package.json
    const pkgJson = await readJson<PackageJson>(path.join(projectPath, 'package.json'));
    if (pkgJson !== null) {
      const allDeps: Record<string, string> = {
        ...pkgJson.dependencies,
        ...pkgJson.devDependencies,
      };
      for (const pkg of Object.keys(allDeps)) {
        const displayName = NPM_PACKAGE_TO_FRAMEWORK[pkg];
        if (displayName !== undefined) {
          categorize(displayName, frameworks, buildTools, testFrameworks);
        }
      }
    }

    // Python: parse requirements.txt
    const reqTxt = await readText(path.join(projectPath, 'requirements.txt'));
    if (reqTxt !== null) {
      const packages = reqTxt
        .split('\n')
        .map((line) => line.split(/[>=<!;[\s]/)[0]?.trim().toLowerCase())
        .filter((pkg): pkg is string => Boolean(pkg));
      for (const pkg of packages) {
        const displayName = PYTHON_PACKAGE_TO_FRAMEWORK[pkg];
        if (displayName !== undefined) {
          categorize(displayName, frameworks, buildTools, testFrameworks);
        }
      }
    }

    // Go: parse go.mod
    const goMod = await readText(path.join(projectPath, 'go.mod'));
    if (goMod !== null) {
      for (const [module, displayName] of Object.entries(GO_MODULE_TO_FRAMEWORK)) {
        if (goMod.includes(module)) {
          frameworks.push(displayName);
        }
      }
    }

    return {
      frameworks: dedupe(frameworks),
      buildTools: dedupe(buildTools),
      testFrameworks: dedupe(testFrameworks),
    };
  }
}

function categorize(
  name: string,
  frameworks: string[],
  buildTools: string[],
  testFrameworks: string[],
): void {
  if (BUILD_TOOLS.has(name)) {
    buildTools.push(name);
  } else if (TEST_FRAMEWORKS.has(name)) {
    testFrameworks.push(name);
  } else {
    frameworks.push(name);
  }
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function readText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}
