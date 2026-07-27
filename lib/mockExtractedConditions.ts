import type { ExtractedConditions } from "@/types/ai";

/** 테스트용 자연어 입력 예시 */
export const MOCK_NATURAL_LANGUAGE_QUERY =
  "상현1동에서 30분 정도 평탄한 공원 산책로를 찾아줘. 화장실도 있으면 좋겠어.";

/** MOCK_NATURAL_LANGUAGE_QUERY에 대응하는 AI 분석 결과 (mock) */
export const MOCK_EXTRACTED_CONDITIONS: ExtractedConditions = {
  dong: "상현1동",
  duration: { value: 30, strength: "preferred" },
  themes: ["park"],
  flat: "required",
  cool: null,
  toilet: "preferred",
  nature: null,
  nightSafe: null,
  conditionNotes: [
    {
      sourceText: "30분 정도",
      status: "approximated",
      reason: "unsupported_duration",
      appliedValue: 30,
    },
  ],
};
