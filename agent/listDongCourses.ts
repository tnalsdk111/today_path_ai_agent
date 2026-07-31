import coursesData from "@/data/courses.json";
import { filterCourses } from "@/lib/filterCourses";
import type { Course } from "@/types/index";

const courses = coursesData as Course[];

/** 동 이름으로 해당 동의 전체 산책 코스를 반환한다. */
export function listCoursesByDong(dong: string): Course[] {
  return filterCourses(courses, { dong });
}
