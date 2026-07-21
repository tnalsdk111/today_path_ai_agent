import { Course, PollenLevel, PollenTag, VegetationSpecies, WeatherData } from "@/types/index";
import { hasPollenWarning } from "@/lib/pollenWarning";

interface VegetationPanelProps {
  course: Course;
  pollen: WeatherData["pollen"];
}

const SPECIES_TO_TAG: Record<string, PollenTag> = {
  소나무: "pine",
  자작나무: "birch",
  참나무: "oak",
};

const POLLEN_TAG_TO_KEY: Record<PollenTag, keyof WeatherData["pollen"]> = {
  pine: "pine",
  birch: "birch",
  oak: "grass",
  grass: "grass",
};

const WARNING_LEVELS: PollenLevel[] = ["보통", "높음"];

function isPollenWarningSpecies(
  species: VegetationSpecies,
  pollen: WeatherData["pollen"]
): boolean {
  if (!species.note.includes("꽃가루")) return false;
  const tag = SPECIES_TO_TAG[species.name] ?? "grass";
  const pollenKey = POLLEN_TAG_TO_KEY[tag];
  return WARNING_LEVELS.includes(pollen[pollenKey]);
}

function speciesIcon(name: string): string {
  if (["갈대", "풀류"].some((k) => name.includes(k))) return "grass";
  if (["소나무", "참나무", "자작나무", "나무"].some((k) => name.includes(k))) return "park";
  return "eco";
}

export default function VegetationPanel({ course, pollen }: VegetationPanelProps) {
  const showWarningBanner = hasPollenWarning(course, pollen);

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

      {/* 수종 목록 */}
      <div className="flex flex-col gap-md mb-md">
        {course.vegetation.species.map((species, idx) => {
          const isWarning = isPollenWarningSpecies(species, pollen);
          return (
            <div
              key={species.name}
              className={`flex items-center gap-3 ${idx !== 0 ? "border-t border-surface-variant pt-md" : ""}`}
            >
              {/* 아이콘 영역 */}
              <div className="w-[44px] h-[44px] rounded-full bg-surface-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary-container text-[24px]">
                  {speciesIcon(species.name)}
                </span>
              </div>

              {/* 텍스트 영역 */}
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-semibold text-on-surface">
                  {species.name}
                </span>
                {isWarning ? (
                  <span className="font-label-sm text-label-sm text-[#F57F17] bg-[#FFF8E1] px-2 py-0.5 rounded-full mt-1 w-max">
                    꽃가루 주의
                  </span>
                ) : (
                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full mt-1 w-max">
                    {species.note}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 코스 설명 인용구 */}
      <div className="bg-surface-container-low rounded-lg p-sm border-l-4 border-primary-container">
        <p className="font-body-md text-body-md italic text-on-surface-variant">
          &ldquo;{course.vegetation.description}&rdquo;
        </p>
      </div>
    </div>
  );
}
