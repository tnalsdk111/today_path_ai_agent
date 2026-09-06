import coursesData from "@/data/courses.json";
import {
  buildRecommendationParams,
  convertExtractedConditions,
} from "@/lib/convertExtractedConditions";
import { filterCourses } from "@/lib/filterCourses";
import { scoreCourse } from "@/lib/scoreCourse";
import type { ExtractedConditions } from "@/types/ai";
import type { Course, WeatherData } from "@/types/index";

const courses = coursesData as Course[];

/** 분석된 산책 조건과 최종 동으로 코스를 필터링·점수화한다. */
export function rankAiRecommendedCourses(
  extracted: ExtractedConditions,
  finalDong: string,
  weatherData?: WeatherData | null,
): Course[] {
  const converted = convertExtractedConditions(extracted);
  const { filterOptions, weights } = buildRecommendationParams(
    { ...converted, dong: null },
    finalDong,
  );

  const safeCourses = weatherData?.weather.is_raining
    ? courses.filter((course) => !course.flood_risk)
    : courses;

  return filterCourses(safeCourses, filterOptions)
    .map((course) => ({ course, score: scoreCourse(course, weights) }))
    .sort((a, b) => b.score - a.score)
    .map(({ course }) => course);
}
