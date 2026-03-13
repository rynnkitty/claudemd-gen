import fs from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';
import type { DirectoryNode, DirectoryTree } from '@claudemd-gen/shared';
import { IGNORE_DIRECTORIES, IGNORE_FILE_PATTERNS } from '@claudemd-gen/shared';

export interface StructureAnalyzerOptions {
  maxDepth: number;
  ignorePaths: string[];
}

const DEFAULT_OPTIONS: StructureAnalyzerOptions = {
  maxDepth: 5,
  ignorePaths: [],
};

export class StructureAnalyzer {
  readonly name = 'StructureAnalyzer';

  async analyze(
    projectPath: string,
    options: Partial<StructureAnalyzerOptions> = {},
  ): Promise<DirectoryTree> {
    const opts: StructureAnalyzerOptions = { ...DEFAULT_OPTIONS, ...options };

    let totalFiles = 0;
    let totalDirectories = 0;

    const traverse = async (dirPath: string, depth: number): Promise<DirectoryNode> => {
      const name = path.basename(dirPath);
      const relativePath = path.relative(projectPath, dirPath) || '.';

      const node: DirectoryNode = {
        name,
        path: relativePath,
        type: 'directory',
        children: [],
      };
      totalDirectories++;

      if (depth >= opts.maxDepth) return node;

      let entries: Dirent[];
      try {
        entries = await fs.readdir(dirPath, { withFileTypes: true });
      } catch {
        return node;
      }

      // sort: directories first, then files, alphabetically within each group
      entries.sort((a, b) => {
        const aDir = a.isDirectory();
        const bDir = b.isDirectory();
        if (aDir !== bDir) return aDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (shouldIgnoreDir(entry.name, opts.ignorePaths)) continue;
          const child = await traverse(path.join(dirPath, entry.name), depth + 1);
          node.children!.push(child);
        } else {
          if (shouldIgnoreFile(entry.name, opts.ignorePaths)) continue;
          totalFiles++;
          const ext = path.extname(entry.name);
          node.children!.push({
            name: entry.name,
            path: path.relative(projectPath, path.join(dirPath, entry.name)),
            type: 'file',
            ...(ext ? { extension: ext } : {}),
          });
        }
      }

      return node;
    };

    const root = await traverse(projectPath, 0);
    return { root, totalFiles, totalDirectories };
  }
}

function shouldIgnoreDir(name: string, extraPaths: string[]): boolean {
  if (IGNORE_DIRECTORIES.includes(name)) return true;
  return extraPaths.some((p) => name === p || matchGlob(name, p));
}

function shouldIgnoreFile(name: string, extraPaths: string[]): boolean {
  if (IGNORE_FILE_PATTERNS.some((p) => matchGlob(name, p))) return true;
  return extraPaths.some((p) => name === p || matchGlob(name, p));
}

function matchGlob(name: string, pattern: string): boolean {
  if (!pattern.includes('*')) return name === pattern;
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(name);
}
