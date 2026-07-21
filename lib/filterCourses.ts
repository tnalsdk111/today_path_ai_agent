import { Course, FilterOptions } from "@/types/index";

export function filterCourses(courses: Course[], options: FilterOptions): Course[] {
  return courses.filter((course) => {
    // 동 일치 여부
    if (course.dong !== options.dong) return false;

    // 소요 시간 이하 조건
    if (options.duration !== undefined && course.duration_min > options.duration) return false;

    // 테마 중 하나라도 포함 여부
    if (options.themes && options.themes.length > 0) {
      const hasTheme = options.themes.some((theme) => course.themes.includes(theme));
      if (!hasTheme) return false;
    }

    // 야간 안전 조건
    if (options.nightSafe === true && !course.night_safe) return false;

    return true;
  });
}
