import { isSupportedDong, type SupportedDong } from "@/lib/supportedDongs";

export type DongResolutionResult =
  | {
      status: "resolved";
      dong: SupportedDong;
      source: "ai" | "selected";
    }
  | {
      status: "missing";
      dong: null;
    }
  | {
      status: "unsupported";
      dong: null;
      sourceText: string;
    };

/**
 * AI가 추출한 동과 UI에서 선택한 동을 바탕으로 최종 동을 결정한다.
 *
 * - extractedDong이 지원 동이면 AI 동을 사용 (source: "ai")
 * - extractedDong이 없으면 selectedDong 사용 (source: "selected")
 * - 둘 다 없으면 missing
 * - extractedDong이 미지원 동이면 unsupported (선택 동으로 대체하지 않음)
 */
export function resolveDong(
  extractedDong: string | null,
  selectedDong: string | null,
): DongResolutionResult {
  if (extractedDong !== null) {
    if (isSupportedDong(extractedDong)) {
      return { status: "resolved", dong: extractedDong, source: "ai" };
    }
    return { status: "unsupported", dong: null, sourceText: extractedDong };
  }

  if (selectedDong === null) {
    return { status: "missing", dong: null };
  }

  if (isSupportedDong(selectedDong)) {
    return { status: "resolved", dong: selectedDong, source: "selected" };
  }

  return { status: "unsupported", dong: null, sourceText: selectedDong };
}
