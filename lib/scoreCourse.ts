import { Course, FilterOptions, FilterWeights } from "@/types/index";

// 필터 ON이면 25, OFF면 5
export function buildWeights(options: FilterOptions): FilterWeights {
  return {
    flat: options.flatPriority ? 25 : 5,
    cool: options.coolPriority ? 25 : 5,
    toilet: options.toiletPriority ? 25 : 5,
    nature: options.naturePriority ? 25 : 5,
  };
}

export function scoreCourse(course: Course, weights: FilterWeights): number {
  const flat = weights.flat * (1 - course.slope_grade / 10);

  const cool =
    weights.cool * ((1 - course.utci_score / 10) * 0.6 + course.shade_ratio * 0.4);

  const toilet =
    weights.toilet *
    (Math.min(course.toilet_count, 5) / 5 * 0.8 + (course.shelter_nearby ? 0.2 : 0));

  const nature =
    weights.nature *
    ((course.eco_axis ? 0.5 : 0) + (1 - course.biotope_grade / 5) * 0.5);

  return flat + cool + toilet + nature;
}
