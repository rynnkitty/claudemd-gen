/**
 * Claude API를 사용해 정적 분석 결과를 보강하는 서비스
 * ANTHROPIC_API_KEY 환경변수가 없으면 null을 반환하며, 에러 시 fallback으로 null 반환.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ProjectInfo, ClaudeEnhancements } from '@claudemd-gen/shared';

// ── 시스템 프롬프트 ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 소프트웨어 프로젝트를 분석하여 개발 문서를 작성하는 전문가입니다.
주어진 프로젝트 분석 결과를 바탕으로 정확하고 실용적인 문서를 한국어로 작성하세요.

반드시 다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "projectPurpose": "프로젝트 목적을 설명하는 2~3문장",
  "architectureDescription": "아키텍처 상세 설명 (마크다운)",
  "conventionGuidelines": "코딩 컨벤션 (마크다운 불릿 리스트)",
  "problemStatement": "PRD 문제 정의 섹션 (마크다운)",
  "constraints": "기술적 제약사항 (마크다운 불릿 리스트)"
}`;

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────

function buildPrompt(info: ProjectInfo): string {
  const readmeContent = info.existingDocs.find((d) => d.filename === 'README.md')?.content ?? '';
  const readmeExcerpt = readmeContent.slice(0, 800);

  const topProdDeps = info.dependencies.production
    .slice(0, 10)
    .map((d) => `${d.name}@${d.version}`)
    .join(', ');

  const scriptNames = info.scripts.map((s) => s.name).join(', ');

  const layers =
    info.architecture.layers.length > 0 ? info.architecture.layers.join(', ') : '(감지 없음)';

  const packages =
    info.architecture.packages && info.architecture.packages.length > 0
      ? info.architecture.packages.join(', ')
      : '';

  return `다음 프로젝트를 분석하여 문서를 작성하세요.

## 프로젝트 기본 정보
- **이름**: ${info.name}
- **설명**: ${info.description ?? '(없음)'}
- **런타임**: ${info.techStack.runtime ?? '-'}
- **언어**: ${info.techStack.languages.join(', ') || '-'}
- **프레임워크**: ${info.techStack.frameworks.join(', ') || '-'}
- **빌드 도구**: ${info.techStack.buildTools.join(', ') || '-'}
- **테스트 프레임워크**: ${info.techStack.testFrameworks.join(', ') || '-'}

## 아키텍처
- **패턴**: ${info.architecture.pattern}
- **레이어**: ${layers}
${packages ? `- **패키지**: ${packages}` : ''}

## 주요 스크립트
${scriptNames || '(없음)'}

## 프로덕션 의존성 (상위 10개)
${topProdDeps || '(없음)'}

## README 발췌 (최대 800자)
${readmeExcerpt || '(README 없음)'}

---

위 정보를 바탕으로 다음 5개 필드를 채워 JSON으로 응답하세요:

1. **projectPurpose**: 이 프로젝트가 무엇을 하는지, 어떤 가치를 제공하는지 2~3문장으로 명확하게 설명.
   README 발췌와 기술 스택을 참고해 실제적인 내용으로 작성.

2. **architectureDescription**: 아키텍처 패턴(${info.architecture.pattern})의 상세 설명.
   감지된 레이어들의 역할과 데이터 흐름을 마크다운으로 작성.
   예시 형식:
   \`\`\`
   **레이어 구성**
   - \`레이어명\`: 역할 설명

   **데이터 흐름**
   요청 → 처리 단계 → 응답
   \`\`\`

3. **conventionGuidelines**: 기술 스택에서 추론한 코딩 컨벤션을 마크다운 불릿으로 작성.
   실제 사용 중인 언어/프레임워크에 맞는 구체적인 가이드라인 5~8개.

4. **problemStatement**: PRD 문제 정의 섹션. 다음 구조로 마크다운 작성:
   - 1.1 배경: 이 프로젝트가 왜 존재하는가
   - 1.2 해결하려는 문제: 핵심 문제 2~3개
   - 1.3 타겟 사용자: 주요 사용자와 Pain Point

5. **constraints**: 이 기술 스택에서 예상되는 기술적 제약사항을 마크다운 불릿 3~5개로 작성.`;
}

// ── 응답 파서 ────────────────────────────────────────────────────────────────

function parseEnhancements(text: string): ClaudeEnhancements | null {
  // JSON 블록 추출 (```json ... ``` 또는 { ... })
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)```/) ??
    text.match(/```\s*([\s\S]*?)```/) ??
    text.match(/(\{[\s\S]*\})/);

  const jsonStr: string = jsonMatch?.[1] ?? text;

  try {
    const parsed: unknown = JSON.parse(jsonStr.trim());
    if (typeof parsed !== 'object' || parsed === null) return null;

    const obj = parsed as Record<string, unknown>;
    const fields = [
      'projectPurpose',
      'architectureDescription',
      'conventionGuidelines',
      'problemStatement',
      'constraints',
    ] as const;

    for (const key of fields) {
      if (typeof obj[key] !== 'string') return null;
    }

    return {
      projectPurpose: obj['projectPurpose'] as string,
      architectureDescription: obj['architectureDescription'] as string,
      conventionGuidelines: obj['conventionGuidelines'] as string,
      problemStatement: obj['problemStatement'] as string,
      constraints: obj['constraints'] as string,
    };
  } catch {
    return null;
  }
}

// ── 서비스 클래스 ────────────────────────────────────────────────────────────

export class ClaudeEnhancementService {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async enhance(projectInfo: ProjectInfo): Promise<ClaudeEnhancements | null> {
    try {
      const prompt = buildPrompt(projectInfo);

      const stream = this.client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const message = await stream.finalMessage();

      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return null;

      const enhancements = parseEnhancements(textBlock.text);
      if (enhancements === null) {
        console.warn('[ClaudeEnhancementService] JSON 파싱 실패, 정적 분석으로 fallback');
      }
      return enhancements;
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        console.warn('[ClaudeEnhancementService] API 키 인증 실패, 정적 분석으로 fallback');
      } else if (error instanceof Anthropic.RateLimitError) {
        console.warn('[ClaudeEnhancementService] Rate limit 초과, 정적 분석으로 fallback');
      } else {
        console.warn('[ClaudeEnhancementService] API 호출 실패, 정적 분석으로 fallback:', error);
      }
      return null;
    }
  }
}

// ── 팩토리 함수 ──────────────────────────────────────────────────────────────

/** ANTHROPIC_API_KEY 환경변수가 없으면 null 반환 */
export function createClaudeEnhancementService(): ClaudeEnhancementService | null {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) return null;
  return new ClaudeEnhancementService(apiKey);
}
