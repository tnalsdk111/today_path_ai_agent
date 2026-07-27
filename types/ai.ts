import type { Theme } from "./index";

/** 조건 강도: 필수 / 선호 / 미언급 */
export type ConditionStrength = "required" | "preferred" | null;

/** 산책 시간 조건 (값 + 강도) */
export interface DurationCondition {
  value: 30 | 60 | 999 | null;
  strength: ConditionStrength;
}

/** AI 자연어 분석 결과 */
export interface ExtractedConditions {
  dong: string | null;
  duration: DurationCondition;
  themes: Theme[];
  flat: ConditionStrength;
  cool: ConditionStrength;
  toilet: ConditionStrength;
  nature: ConditionStrength;
  nightSafe: ConditionStrength;
  /** 현재 서비스가 처리하지 못하는 요청 (사용자 안내용) */
  unsupportedConditions: string[];
}

/** ExtractedConditions를 기존 필터·가중치 형태로 변환한 결과 */
export interface ConvertedConditions {
  dong: string | null;
  duration: 30 | 60 | 999 | null;
  themes: Theme[];
  nightSafe: boolean;
  flatRequired: boolean;
  coolRequired: boolean;
  toiletRequired: boolean;
  natureRequired: boolean;
  flatPriority: boolean;
  coolPriority: boolean;
  toiletPriority: boolean;
  naturePriority: boolean;
  unsupportedConditions: string[];
}
