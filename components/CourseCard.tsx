import Link from "next/link";
import { Course, WeatherData } from "@/types/index";
import { hasPollenWarning } from "@/lib/pollenWarning";

interface CourseCardProps {
  course: Course;
  pollen: WeatherData["pollen"];
}

const THEME_LABEL: Record<Course["themes"][number], string> = {
  park: "공원",
  lake: "수변",
  forest: "숲·자연",
  stream: "수변길",
};

const DIFFICULTY_LABEL: Record<Course["difficulty"], string> = {
  flat: "평탄",
  moderate: "보통",
};

export default function CourseCard({ course, pollen }: CourseCardProps) {
  const pollenWarning = hasPollenWarning(course, pollen);
  const showBottom = course.night_safe || pollenWarning;

  return (
    <Link
      href={`/course/${course.id}`}
      className="bg-surface-container-lowest rounded-xl p-md flex flex-col gap-sm"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* 상단 행 */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-h3 font-h3 text-on-surface">{course.name}</span>
          <div className="flex gap-2 flex-wrap">
            {course.themes.map((theme) => (
              <span
                key={theme}
                className="bg-[#EAF3EC] text-primary px-2 py-0.5 rounded-full font-label-sm text-label-sm"
              >
                {THEME_LABEL[theme]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 중간 행 — 코스 스탯 */}
      <div className="flex items-center gap-md text-on-surface-variant font-body-md text-body-md mt-1">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">route</span>
          {course.distance_km}km
        </span>
        <span className="w-1 h-1 rounded-full bg-outline-variant" />
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          {course.duration_min}분
        </span>
        <span className="w-1 h-1 rounded-full bg-outline-variant" />
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">landscape</span>
          {DIFFICULTY_LABEL[course.difficulty]}
        </span>
      </div>

      {/* 하단 행 — 조건부 */}
      {showBottom && (
        <div className="border-t border-surface-variant mt-2 pt-2">
          {course.night_safe ? (
            <span className="flex items-center gap-2 text-primary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">wb_twilight</span>
              야간 가능 (조명 시설 완비)
            </span>
          ) : (
            <span className="flex items-center gap-2 text-orange-600 font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              꽃가루 주의 구간 포함
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
