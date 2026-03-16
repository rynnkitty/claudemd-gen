import type { ProjectInfo } from '@claudemd-gen/shared';
import {
  renderHeader,
  renderOverview,
  renderTechStack,
  renderStructure,
  renderArchitecture,
  renderCommands,
  renderConventions,
  renderKeyFiles,
  renderDependencies,
  renderEnvVars,
  renderConstraints,
} from './templates/claude-md.template.js';

export class ClaudeMdGenerator {
  readonly name = 'ClaudeMdGenerator';

  /**
   * ProjectInfo를 받아 완성된 CLAUDE.md 마크다운 문자열을 반환합니다.
   */
  generate(info: ProjectInfo): string {
    const sections = [
      renderHeader(info.name),
      renderOverview(info),
      renderTechStack(info.techStack),
      renderStructure(info.structure),
      renderArchitecture(info.architecture, info),
      renderCommands(info.scripts),
      renderConventions(info.configFiles, info.techStack, info.claudeEnhancements?.conventionGuidelines),
      renderKeyFiles(info.entryPoints, info.configFiles),
      renderDependencies(info.dependencies),
      renderEnvVars(info.techStack),
      renderConstraints(info.claudeEnhancements?.constraints),
    ];

    // 각 섹션 사이에 빈 줄 두 개, 문서 끝에 개행 하나
    return sections.join('\n\n') + '\n';
  }
}
