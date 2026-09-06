import { formatRecommendationMessage } from "@/agent/formatRecommendationMessage";
import { analyzeNaturalLanguageQueryClaude } from "@/lib/analyzeNaturalLanguageQueryClaude";
import { getWeatherData } from "@/lib/getWeatherData";
import { rankAiRecommendedCourses } from "@/lib/rankAiRecommendedCourses";
import { resolveDong } from "@/lib/resolveDong";
import { isSupportedDong } from "@/lib/supportedDongs";
import type { ExtractedConditions } from "@/types/ai";
import type { Course } from "@/types/index";

export type WalkRecommendationResult =
  | {
      status: "success";
      dong: string;
      extracted: ExtractedConditions;
      courses: Course[];
      intro: string;
      items: { id: string; name: string; summary: string }[];
      message: string;
    }
  | {
      status: "unsupported_dong";
      dong: string;
      extracted?: ExtractedConditions;
      sourceText?: string;
      message: string;
    };

/**
 * 2단계: 동이 정해진 뒤 추가 조건(자연어)으로 코스를 추천한다.
 * selectedDong은 1단계에서 사용자가 클릭한 동이다.
 */
export async function runWalkRecommendation(
  query: string,
  selectedDong: string,
): Promise<WalkRecommendationResult> {
  if (!isSupportedDong(selectedDong)) {
    return {
      status: "unsupported_dong",
      dong: selectedDong,
      message: `입력하신 '${selectedDong}'은(는) 지원하지 않는 동입니다. 수지구 9개 동만 추천할 수 있습니다.`,
    };
  }

  const weatherPromise = getWeatherData().catch(() => null);
  const extracted = await analyzeNaturalLanguageQueryClaude(query);
  const resolution = resolveDong(extracted.dong, selectedDong);

  if (resolution.status === "unsupported") {
    return {
      status: "unsupported_dong",
      dong: selectedDong,
      extracted,
      sourceText: resolution.sourceText,
      message: `입력하신 '${resolution.sourceText}'은(는) 지원하지 않는 동입니다. 선택한 ${selectedDong}에서 조건에 맞는 산책로를 찾아 주세요.`,
    };
  }

  if (resolution.status === "missing") {
    return {
      status: "unsupported_dong",
      dong: selectedDong,
      extracted,
      message: "산책할 동을 다시 선택해 주세요.",
    };
  }

  const finalDong = resolution.dong;
  const weatherData = await weatherPromise;
  const courses = rankAiRecommendedCourses(
    extracted,
    finalDong,
    weatherData,
  );

  const formatted = formatRecommendationMessage(
    finalDong,
    extracted,
    courses,
  );

  return {
    status: "success",
    dong: finalDong,
    extracted,
    courses,
    intro: formatted.intro,
    items: formatted.items,
    message: formatted.message,
  };
}
