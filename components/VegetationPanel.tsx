import { Course, WeatherData } from "@/types/index";
import { hasPollenWarning } from "@/lib/pollenWarning";

interface VegetationPanelProps {
  course: Course;
  pollen?: WeatherData["pollen"];
}

const TAG_CONFIG: Record<string, { label: string; pollen: boolean }> = {
  pine:   { label: "소나무류",        pollen: true  },
  oak:    { label: "참나무류",        pollen: true  },
  grass:  { label: "아까시·버드나무", pollen: true  },
  birch:  { label: "자작나무",        pollen: true  },
  meta:   { label: "메타세콰이어",    pollen: false },
  bamboo: { label: "대나무",          pollen: false },
};

export default function VegetationPanel({ course, pollen }: VegetationPanelProps) {
  const showWarningBanner = pollen ? hasPollenWarning(course, pollen) : false;
  const tags = course.vegetation.tags.filter((t) => t in TAG_CONFIG);

  return (
    <div
      className="bg-surface-container-lowest rounded-[16px] p-md mb-md"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-sm">
        <span
          className="material-symbols-outlined text-primary-container"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          eco
        </span>
        <span className="font-h3 text-h3 text-on-surface">이 코스의 식생</span>
      </div>

      {/* 꽃가루 경고 배너 */}
      {showWarningBanner && (
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-xs mb-md flex items-start gap-2">
          <span
            className="material-symbols-outlined text-[#F57F17] mt-0.5 text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <p className="font-body-md text-body-md text-[#5D4037]">
            이 코스에는 현재 꽃가루가 날리는 수종이 있어요. 외출 시 마스크를 챙기세요.
          </p>
        </div>
      )}

      {/* 수종 태그 칩 */}
      {tags.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant">
          주요 수종 정보가 없어요
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const config = TAG_CONFIG[tag];
            return config.pollen ? (
              <span
                key={tag}
                className="bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-sm py-1 font-label-sm text-label-sm"
              >
                {config.label} 🌼
              </span>
            ) : (
              <span
                key={tag}
                className="bg-surface-container text-on-surface-variant rounded-full px-sm py-1 font-label-sm text-label-sm"
              >
                {config.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
