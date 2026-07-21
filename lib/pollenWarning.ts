import { Course, PollenLevel, PollenTag, WeatherData } from "@/types/index";

// oak은 grass 지수로 대체
const POLLEN_TAG_MAP: Record<PollenTag, keyof WeatherData["pollen"]> = {
  pine: "pine",
  birch: "birch",
  grass: "grass",
  oak: "grass",
};

const WARNING_THRESHOLD: PollenLevel[] = ["보통", "높음"];

export function hasPollenWarning(
  course: Course,
  pollen: WeatherData["pollen"]
): boolean {
  return course.vegetation.tags.some((tag) => {
    const pollenKey = POLLEN_TAG_MAP[tag];
    return WARNING_THRESHOLD.includes(pollen[pollenKey]);
  });
}
