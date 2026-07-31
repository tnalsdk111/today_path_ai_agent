import type { Course } from "@/types/index";
// required일 경우 아래 조건을 만족해야 필터링 됨.

/** 평탄한 길 (경사도 3° 이하, difficulty flat) */
export function meetsFlatRequired(course: Course): boolean {
  return course.difficulty === "flat";
}

/** 시원한 길 (UTCI 쾌적 이하) */
export function meetsCoolRequired(course: Course): boolean {
  return course.utci_score <= 5;
}

/** 화장실 보유 */
export function meetsToiletRequired(course: Course): boolean {
  return course.toilet_count >= 1;
}

/** 자연 친화적 길 (생태등급 3 이하 또는 생태축 인접) */
export function meetsNatureRequired(course: Course): boolean {
  return course.biotope_grade <= 3 || course.eco_axis;
}
