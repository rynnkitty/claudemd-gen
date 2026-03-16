/**
 * Claude API 보강(enhancement) 결과 타입
 * 정적 분석으로 채우기 어려운 섹션을 Claude API가 생성한 내용으로 채운다.
 */

export interface ClaudeEnhancements {
  /** 프로젝트 목적 — 2~3문장 설명 (CLAUDE.md 개요, PRD 배경에 사용) */
  projectPurpose: string;
  /** 아키텍처 상세 설명 — 레이어별 책임 + 데이터 흐름 (마크다운) */
  architectureDescription: string;
  /** 코딩 컨벤션 가이드라인 — 마크다운 불릿 리스트 */
  conventionGuidelines: string;
  /** PRD 문제 정의 섹션 — 배경/해결문제/타겟 사용자 (마크다운) */
  problemStatement: string;
  /** 알려진 기술적 제약사항 — 마크다운 불릿 리스트 */
  constraints: string;
}
