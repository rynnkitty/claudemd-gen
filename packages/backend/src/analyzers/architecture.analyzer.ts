import type { ArchitectureInfo, ArchitecturePattern, DirectoryNode, DirectoryTree } from '@claudemd-gen/shared';
import { ARCHITECTURE_LAYER_PATTERNS } from '@claudemd-gen/shared';

interface PatternScore {
  pattern: ArchitecturePattern;
  score: number;
  layers: string[];
}

export class ArchitectureAnalyzer {
  readonly name = 'ArchitectureAnalyzer';

  /**
   * Pure analysis of a pre-built directory tree.
   * Synchronous — no I/O required.
   */
  analyze(tree: DirectoryTree): ArchitectureInfo {
    const dirNames = collectDirectoryNames(tree.root);

    // Monorepo is detected first: it can contain MVC layers inside packages
    if (this.isMonorepo(dirNames)) {
      return {
        pattern: 'monorepo',
        layers: (ARCHITECTURE_LAYER_PATTERNS['monorepo'] ?? []).filter((l) => dirNames.has(l)),
        packages: this.extractMonorepoPackages(tree),
      };
    }

    const scores = this.scorePatterns(dirNames);
    if (scores.length === 0) {
      return { pattern: 'unknown', layers: [] };
    }

    const best = scores[0]!;
    return { pattern: best.pattern, layers: best.layers };
  }

  private isMonorepo(dirNames: Set<string>): boolean {
    return dirNames.has('packages') || dirNames.has('apps');
  }

  private extractMonorepoPackages(tree: DirectoryTree): string[] {
    const packageRoots = new Set(['packages', 'apps', 'libs', 'services']);
    const pkgs: string[] = [];

    for (const child of tree.root.children ?? []) {
      if (child.type === 'directory' && packageRoots.has(child.name)) {
        for (const pkg of child.children ?? []) {
          if (pkg.type === 'directory') pkgs.push(pkg.name);
        }
      }
    }
    return pkgs;
  }

  private scorePatterns(dirNames: Set<string>): PatternScore[] {
    const results: PatternScore[] = [];

    for (const [patternName, layers] of Object.entries(ARCHITECTURE_LAYER_PATTERNS)) {
      if (patternName === 'monorepo') continue;

      const matched = layers.filter((l) => dirNames.has(l));
      if (matched.length > 0) {
        results.push({
          pattern: patternName as ArchitecturePattern,
          score: matched.length / layers.length,
          layers: matched,
        });
      }
    }

    // Sort by score descending, then by number of matched layers descending
    return results.sort((a, b) => b.score - a.score || b.layers.length - a.layers.length);
  }
}

/** Collect all unique directory names (lowercased) from the entire tree. */
function collectDirectoryNames(node: DirectoryNode): Set<string> {
  const names = new Set<string>();

  const visit = (n: DirectoryNode): void => {
    if (n.type === 'directory' && n.name !== '.') {
      names.add(n.name.toLowerCase());
    }
    for (const child of n.children ?? []) {
      visit(child);
    }
  };

  visit(node);
  return names;
}
