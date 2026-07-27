import { buildWeights } from "@/lib/scoreCourse";
import type {
  ConvertedConditions,
  ExtractedConditions,
  FilterOptions,
  FilterWeights,
} from "@/types/index";

/**
 * AI 분석 결과를 기존 필터·점수 가중치에 연결할 수 있는 형태로 변환한다.
 *
 * - required → 하드 필터 (미충족 코스 제외)
 * - preferred → 점수 가중치 (우선 추천)
 * - null → 무시
 * - unsupportedConditions → 변환 결과에 그대로 전달 (필터·점수 계산에는 사용하지 않음)
 */
export function convertExtractedConditions(
  extracted: ExtractedConditions
): ConvertedConditions {
  let duration: 30 | 60 | 999 | null = null;
  if (
    extracted.duration.strength === "required" &&
    extracted.duration.value !== null
  ) {
    duration = extracted.duration.value;
  }

  const themes = extracted.themes.length > 0 ? extracted.themes : [];

  return {
    dong: extracted.dong,
    duration,
    themes,
    nightSafe: extracted.nightSafe === "required",
    flatRequired: extracted.flat === "required",
    coolRequired: extracted.cool === "required",
    toiletRequired: extracted.toilet === "required",
    natureRequired: extracted.nature === "required",
    flatPriority: extracted.flat === "preferred",
    coolPriority: extracted.cool === "preferred",
    toiletPriority: extracted.toilet === "preferred",
    naturePriority: extracted.nature === "preferred",
    unsupportedConditions: extracted.unsupportedConditions,
  };
}

/** 변환된 조건으로 기존 filterCourses·scoreCourse에 전달할 파라미터를 생성한다. */
export function buildRecommendationParams(
  converted: ConvertedConditions,
  fallbackDong: string
): {
  filterOptions: FilterOptions;
  weights: FilterWeights;
  unsupportedConditions: string[];
} {
  const dong = converted.dong ?? fallbackDong;

  const hasFilter =
    converted.duration !== null ||
    converted.themes.length > 0 ||
    converted.nightSafe ||
    converted.flatRequired ||
    converted.coolRequired ||
    converted.toiletRequired ||
    converted.natureRequired;

  const filterOptions: FilterOptions = hasFilter
    ? {
        dong,
        duration: converted.duration ?? undefined,
        themes: converted.themes.length > 0 ? converted.themes : undefined,
        nightSafe: converted.nightSafe || undefined,
        flatRequired: converted.flatRequired || undefined,
        coolRequired: converted.coolRequired || undefined,
        toiletRequired: converted.toiletRequired || undefined,
        natureRequired: converted.natureRequired || undefined,
      }
    : { dong };

  const weights = buildWeights({
    dong,
    flatPriority: converted.flatPriority,
    coolPriority: converted.coolPriority,
    toiletPriority: converted.toiletPriority,
    naturePriority: converted.naturePriority,
  });

  return {
    filterOptions,
    weights,
    unsupportedConditions: converted.unsupportedConditions,
  };
}
