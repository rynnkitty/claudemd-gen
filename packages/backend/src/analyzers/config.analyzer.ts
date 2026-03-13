import fs from 'fs/promises';
import path from 'path';
import type { ConfigFile } from '@claudemd-gen/shared';
import { KNOWN_CONFIG_FILES } from '@claudemd-gen/shared';

export class ConfigAnalyzer {
  readonly name = 'ConfigAnalyzer';

  async analyze(projectPath: string): Promise<ConfigFile[]> {
    const results: ConfigFile[] = [];

    for (const filename of KNOWN_CONFIG_FILES) {
      // Skip entries that reference directories (e.g. ".github/workflows")
      if (filename.includes('/')) continue;

      const filePath = path.join(projectPath, filename);
      try {
        await fs.access(filePath);
        const summary = await this.summarize(filePath, filename);
        results.push({ filename, relativePath: filename, summary });
      } catch {
        // File not present — skip
      }
    }

    return results;
  }

  private async summarize(
    filePath: string,
    filename: string,
  ): Promise<Record<string, unknown>> {
    const ext = path.extname(filename).toLowerCase();

    if (ext === '.json' || ext === '.jsonc') {
      return this.summarizeJson(filePath);
    }
    if (ext === '.toml') {
      return this.summarizeToml(filePath);
    }
    if (ext === '.yml' || ext === '.yaml') {
      return this.summarizeYaml(filePath);
    }
    if (ext === '.js' || ext === '.ts' || ext === '.cjs' || ext === '.mjs') {
      return { note: 'JavaScript/TypeScript config — not statically parsed' };
    }
    // Plain text config (e.g. .prettierrc without extension)
    if (filename === '.prettierrc') {
      return this.summarizeJson(filePath);
    }
    return {};
  }

  private async summarizeJson(filePath: string): Promise<Record<string, unknown>> {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      // Strip single-line and multi-line JSON comments (tsconfig, jsconfig allow them)
      const stripped = raw
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const parsed = JSON.parse(stripped) as Record<string, unknown>;
      return flattenTopLevel(parsed);
    } catch {
      return {};
    }
  }

  private async summarizeToml(filePath: string): Promise<Record<string, unknown>> {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      // Minimal TOML reader: extract section headers and scalar key=value pairs
      const result: Record<string, Record<string, unknown>> = {};
      let currentSection = '_root';
      result[currentSection] = {};

      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed.length === 0) continue;

        if (trimmed.startsWith('[') && !trimmed.startsWith('[[')) {
          currentSection = trimmed.replace(/^\[+|\]+$/g, '');
          if (result[currentSection] === undefined) result[currentSection] = {};
          continue;
        }

        const match = /^([a-zA-Z0-9_."-]+)\s*=\s*(.+)/.exec(trimmed);
        if (match !== null) {
          (result[currentSection] as Record<string, unknown>)[match[1]!] = match[2]!.trim();
        }
      }

      // Flatten: promote _root keys up, nest other sections
      const flat: Record<string, unknown> = { ...result['_root'] };
      for (const [section, values] of Object.entries(result)) {
        if (section !== '_root') flat[section] = values;
      }
      return flat;
    } catch {
      return {};
    }
  }

  private async summarizeYaml(filePath: string): Promise<Record<string, unknown>> {
    // No YAML parser dependency — extract top-level key: value pairs only
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const result: Record<string, unknown> = {};
      for (const line of raw.split('\n').slice(0, 30)) {
        if (line.startsWith('#') || line.startsWith(' ') || line.startsWith('\t')) continue;
        const match = /^([a-zA-Z0-9_-]+):\s*(.*)/.exec(line.trim());
        if (match !== null) {
          result[match[1]!] = match[2]!.trim() || null;
        }
      }
      return result;
    } catch {
      return {};
    }
  }
}

/**
 * Returns a flat summary of an object's top-level keys.
 * Scalars are kept as-is; arrays/objects are summarised as strings.
 */
function flattenTopLevel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || typeof value !== 'object') {
      result[key] = value;
    } else if (Array.isArray(value)) {
      result[key] = `[${(value as unknown[]).length} items]`;
    } else {
      result[key] = `{${Object.keys(value as object).join(', ')}}`;
    }
  }
  return result;
}
