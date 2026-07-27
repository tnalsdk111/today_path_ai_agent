import { Course, FilterOptions } from "@/types/index";
import {
  meetsCoolRequired,
  meetsFlatRequired,
  meetsNatureRequired,
  meetsToiletRequired,
} from "@/lib/courseCriteria";

export function filterCourses(courses: Course[], options: FilterOptions): Course[] {
  return courses.filter((course) => {
    // 아래 조건을 모두 만족해야 필터링 됨.
    // 동 일치 여부
    if (course.dong !== options.dong) return false;

    // 소요 시간 조건
    if (options.duration !== undefined) {
      if (options.duration === 999) {
        if (course.duration_min < 60) return false;
      } else {
        if (course.duration_min > options.duration) return false;
      }
    }

    // 테마 중 하나라도 포함 여부
    if (options.themes && options.themes.length > 0) {
      const hasTheme = options.themes.some((theme) => course.themes.includes(theme));
      if (!hasTheme) return false;
    }

    // 야간 안전 조건
    if (options.nightSafe === true && !course.night_safe) return false;

    // 필수 조건 (required) — 미충족 시 제외
    if (options.flatRequired && !meetsFlatRequired(course)) return false;
    if (options.coolRequired && !meetsCoolRequired(course)) return false;
    if (options.toiletRequired && !meetsToiletRequired(course)) return false;
    if (options.natureRequired && !meetsNatureRequired(course)) return false;

    return true;
  });
}
