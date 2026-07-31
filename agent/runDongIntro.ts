import { formatDongIntroMessage } from "@/agent/formatDongIntroMessage";
import { listCoursesByDong } from "@/agent/listDongCourses";
import { isSupportedDong } from "@/lib/supportedDongs";

export type DongIntroResult =
  | {
      status: "dong_intro";
      dong: string;
      items: { id: string; name: string; summary: string }[];
      availableConditions: string[];
      message: string;
    }
  | {
      status: "unsupported_dong";
      dong: string;
      message: string;
    };

/** 동 선택 후 1단계: 해당 동 산책로 목록과 추가 조건 안내를 반환한다. */
export function runDongIntro(dong: string): DongIntroResult {
  if (!isSupportedDong(dong)) {
    return {
      status: "unsupported_dong",
      dong,
      message: `입력하신 '${dong}'은(는) 지원하지 않는 동입니다. 수지구 9개 동만 추천할 수 있습니다.`,
    };
  }

  const courses = listCoursesByDong(dong);
  const formatted = formatDongIntroMessage(dong, courses);

  return {
    status: "dong_intro",
    dong,
    items: formatted.items,
    availableConditions: formatted.availableConditions,
    message: formatted.message,
  };
}
