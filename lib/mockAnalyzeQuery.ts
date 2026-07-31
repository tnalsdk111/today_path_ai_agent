import { MOCK_EXTRACTED_CONDITIONS } from "@/lib/mockExtractedConditions";
import type { ExtractedConditions } from "@/types/ai";

/** GPT API 연결 전, 자연어 입력을 분석한 것처럼 mock 결과를 반환한다. */
export function mockAnalyzeQuery(query: string): ExtractedConditions {
  if (query.includes("상현동")) {
    return { ...MOCK_EXTRACTED_CONDITIONS, dong: "상현동" };
  }

  return { ...MOCK_EXTRACTED_CONDITIONS, dong: null };
}
