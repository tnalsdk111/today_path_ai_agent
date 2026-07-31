import { AVAILABLE_WALK_CONDITIONS } from "@/agent/availableConditions";
import { getCourseSummary } from "@/agent/formatRecommendationMessage";
import type { Course } from "@/types/index";

export interface DongIntroItem {
  id: string;
  name: string;
  summary: string;
}

/** 동 선택 직후: 해당 동 산책로 목록 + 추가 조건 안내 메시지 */
export function formatDongIntroMessage(
  dong: string,
  courses: Course[],
): { items: DongIntroItem[]; availableConditions: string[]; message: string } {
  const items: DongIntroItem[] = courses.map((course) => ({
    id: course.id,
    name: course.name,
    summary: getCourseSummary(course),
  }));

  const availableConditions = [...AVAILABLE_WALK_CONDITIONS];

  if (items.length === 0) {
    const message = `${dong}에는 등록된 산책로가 없습니다.`;
    return { items, availableConditions, message };
  }

  const courseList = items.map((item) => `- ${item.name}`).join("\n");
  const conditionsText = availableConditions.join(", ");

  const message = [
    `${dong}에는 다음과 같은 산책로가 있습니다.`,
    courseList,
    "",
    "추가하고 싶은 산책로 조건이 있나요?",
    `다음 조건을 말씀해 주세요: ${conditionsText}`,
  ].join("\n");

  return { items, availableConditions, message };
}
