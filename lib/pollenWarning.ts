import { Course, PollenLevel, PollenTag, WeatherData } from "@/types/index";

// meta, bamboo는 꽃가루 경고 대상 아님 → null
const POLLEN_TAG_MAP: Record<PollenTag, keyof WeatherData["pollen"] | null> = {
  pine:   "pine",
  birch:  "birch",
  grass:  "grass",
  oak:    "grass",
  meta:   null,
  bamboo: null,
};

const WARNING_THRESHOLD: PollenLevel[] = ["보통", "높음"];

export function hasPollenWarning(
  course: Course,
  pollen: WeatherData["pollen"]
): boolean {
  return course.vegetation.tags.some((tag) => {
    const pollenKey = POLLEN_TAG_MAP[tag];
    if (pollenKey === null) return false;
    return WARNING_THRESHOLD.includes(pollen[pollenKey]);
  });
}
