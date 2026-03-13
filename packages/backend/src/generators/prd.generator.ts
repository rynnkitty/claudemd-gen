import type { ProjectInfo } from '@claudemd-gen/shared';
import {
  renderPrdHeader,
  renderProblemDef,
  renderGoals,
  renderFeatureSpec,
  renderTechReqs,
  renderArchReqs,
  renderApiDesign,
  renderNonFuncReqs,
  renderMilestones,
  renderFooter,
} from './templates/prd.template.js';

const DIVIDER = '\n\n---\n\n';

export class PrdGenerator {
  readonly name = 'PrdGenerator';

  /**
   * ProjectInfo를 받아 완성된 PRD 초안 마크다운 문자열을 반환합니다.
   */
  generate(info: ProjectInfo): string {
    const sections = [
      renderPrdHeader(info.name),
      renderProblemDef(info),
      renderGoals(info),
      renderFeatureSpec(info),
      [
        renderTechReqs(info.techStack, info.dependencies),
        renderArchReqs(info.architecture),
        renderApiDesign(info.scripts),
      ].join('\n\n'),
      renderNonFuncReqs(),
      renderMilestones(info.scripts),
      renderFooter(),
    ];

    return sections.join(DIVIDER) + '\n';
  }
}
