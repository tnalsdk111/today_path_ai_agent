import type { Theme } from "./index";

/** 조건 강도: 필수 / 선호 / 미언급 */
export type ConditionStrength = "required" | "preferred" | null;

/** 산책 시간 조건 (값 + 강도) */
export interface DurationCondition {
  value: 30 | 60 | 999 | null;
  strength: ConditionStrength;
}

/** 조건 처리 상태 */
export type ConditionNoteStatus = "approximated" | "unsupported";

/** 조건을 그대로 처리하지 못한 이유 */
export type ConditionNoteReason =
  | "gps_not_supported"
  | "travel_time_not_supported"
  | "unsupported_facility"
  | "unsupported_duration"
  | "unsupported_location"
  | "other";

/** 변환되거나 반영되지 못한 사용자 요청 */
export interface ConditionNote {
  /** 사용자의 원래 표현 */
  sourceText: string;

  /** 근사하여 반영했는지, 반영하지 못했는지 */
  status: ConditionNoteStatus;

  /** 처리 상태의 구체적인 이유 */
  reason: ConditionNoteReason;

  /** 근사하여 적용한 값이 있을 때만 사용 */
  appliedValue?: string | number;
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
  conditionNotes: ConditionNote[];
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
  conditionNotes: ConditionNote[];
}
