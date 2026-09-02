import courseSummaries from "@/data/course-summaries.json";
import type { ExtractedConditions, ConditionStrength } from "@/types/ai";
import type { Course } from "@/types/index";
import { THEME_LABEL } from "@/lib/themeLabels";

const summaries = courseSummaries as Record<string, string>;

function isActive(strength: ConditionStrength): boolean {
  return strength === "required" || strength === "preferred";
}

function durationPhrase(value: 30 | 60 | 999): string {
  if (value === 30) return "30분 이내";
  if (value === 60) return "60분 이내";
  return "90분 이상";
}

/** 추출된 조건을 자연어 소개 문장의 수식어 목록으로 변환한다. */
export function buildConditionModifiers(extracted: ExtractedConditions): string[] {
  const modifiers: string[] = [];

  if (
    extracted.duration.value !== null &&
    isActive(extracted.duration.strength)
  ) {
    modifiers.push(durationPhrase(extracted.duration.value));
  }

  if (isActive(extracted.flat)) modifiers.push("평탄한 길");
  if (isActive(extracted.cool)) modifiers.push("시원한 길");
  if (isActive(extracted.toilet)) modifiers.push("화장실이 있는 길");
  if (isActive(extracted.nature)) modifiers.push("자연적인 길");
  if (isActive(extracted.nightSafe)) modifiers.push("야간에도 안전한 길");

  if (extracted.themes.length > 0) {
    modifiers.push(
      extracted.themes.map((theme) => THEME_LABEL[theme]).join("·") + " 테마",
    );
  }

  return modifiers;
}

export function buildIntroLine(dong: string, extracted: ExtractedConditions): string {
  const modifiers = buildConditionModifiers(extracted);

  if (modifiers.length === 0) {
    return `${dong}에서 산책로를 추천합니다.`;
  }

  const modifierText = modifiers.join("의 ");
  return `${dong}에서 ${modifierText}을 추천합니다.`;
}

export function getCourseSummary(course: Course): string {
  return summaries[course.id] ?? `${course.name} 산책 코스입니다.`;
}

export interface FormattedCourseItem {
  id: string;
  name: string;
  summary: string;
}

/** 추천 코스 목록을 에이전트용 자연어 블록으로 포맷한다. */
export function formatRecommendationMessage(
  dong: string,
  extracted: ExtractedConditions,
  courses: Course[],
): { intro: string; items: FormattedCourseItem[]; message: string } {
  const intro = buildIntroLine(dong, extracted);

  const items: FormattedCourseItem[] = courses.map((course) => ({
    id: course.id,
    name: course.name,
    summary: getCourseSummary(course),
  }));

  if (items.length === 0) {
    const message = `${intro}\n\n조건에 맞는 산책로를 찾지 못했습니다.`;
    return { intro, items, message };
  }

  const body = items
    .map((item, index) => `${index + 1}. ${item.name}\n${item.summary}`)
    .join("\n");

  const message = `${intro}\n${body}`;
  return { intro, items, message };
}
