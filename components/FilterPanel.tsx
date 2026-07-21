"use client";

import { useFilterStore } from "@/store/useFilterStore";
import { Theme } from "@/types/index";

interface Chip<T> {
  label: string;
  value: T;
}

const DURATION_CHIPS: Chip<30 | 60 | 120>[] = [
  { label: "30분 이내", value: 30 },
  { label: "1시간 이내", value: 60 },
  { label: "2시간 이내", value: 120 },
];

const THEME_CHIPS: Chip<Theme>[] = [
  { label: "공원", value: "park" },
  { label: "수변", value: "lake" },
  { label: "숲·자연", value: "forest" },
  { label: "수변길", value: "stream" },
];

const WEIGHT_CHIPS: { label: string; key: "flatPriority" | "coolPriority" | "toiletPriority" | "naturePriority" }[] = [
  { label: "평탄한 길", key: "flatPriority" },
  { label: "시원한 길", key: "coolPriority" },
  { label: "화장실 자주", key: "toiletPriority" },
  { label: "자연 느낌", key: "naturePriority" },
];

function chipClass(active: boolean): string {
  const base = "flex items-center gap-1 rounded-full px-md py-1.5 font-body-md text-body-md transition-transform active:scale-95";
  return active
    ? `${base} bg-primary text-on-primary`
    : `${base} bg-surface-container-lowest border border-outline-variant text-on-surface-variant`;
}

export default function FilterPanel() {
  const dong = useFilterStore((s) => s.dong);
  const duration = useFilterStore((s) => s.duration);
  const themes = useFilterStore((s) => s.themes);
  const flatPriority = useFilterStore((s) => s.flatPriority);
  const coolPriority = useFilterStore((s) => s.coolPriority);
  const toiletPriority = useFilterStore((s) => s.toiletPriority);
  const naturePriority = useFilterStore((s) => s.naturePriority);
  const nightSafe = useFilterStore((s) => s.nightSafe);

  const setDuration = useFilterStore((s) => s.setDuration);
  const toggleTheme = useFilterStore((s) => s.toggleTheme);
  const setFlatPriority = useFilterStore((s) => s.setFlatPriority);
  const setCoolPriority = useFilterStore((s) => s.setCoolPriority);
  const setToiletPriority = useFilterStore((s) => s.setToiletPriority);
  const setNaturePriority = useFilterStore((s) => s.setNaturePriority);
  const setNightSafe = useFilterStore((s) => s.setNightSafe);

  const weightSetters = {
    flatPriority: setFlatPriority,
    coolPriority: setCoolPriority,
    toiletPriority: setToiletPriority,
    naturePriority: setNaturePriority,
  };

  const weightValues = { flatPriority, coolPriority, toiletPriority, naturePriority };

  return (
    <div className={`flex flex-col gap-sm ${dong === null ? "opacity-40 pointer-events-none" : ""}`}>
      <span className="font-label-sm text-label-sm text-on-surface-variant">검색 필터</span>

      {/* 소요 시간 */}
      <div className="flex flex-wrap gap-xs">
        {DURATION_CHIPS.map(({ label, value }) => {
          const active = duration === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setDuration(active ? null : value)}
              className={chipClass(active)}
            >
              {active && (
                <span className="material-symbols-outlined text-[18px]">check</span>
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* 테마 */}
      <div className="flex flex-wrap gap-xs">
        {THEME_CHIPS.map(({ label, value }) => {
          const active = themes.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleTheme(value)}
              className={chipClass(active)}
            >
              {active && (
                <span className="material-symbols-outlined text-[18px]">check</span>
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* 가중치 필터 */}
      <div className="flex flex-wrap gap-xs">
        {WEIGHT_CHIPS.map(({ label, key }) => {
          const active = weightValues[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => weightSetters[key](!active)}
              className={chipClass(active)}
            >
              {active && (
                <span className="material-symbols-outlined text-[18px]">check</span>
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* 야간 가능 */}
      <div className="flex flex-wrap gap-xs">
        <button
          type="button"
          onClick={() => setNightSafe(!nightSafe)}
          className={chipClass(nightSafe)}
        >
          {nightSafe && (
            <span className="material-symbols-outlined text-[18px]">check</span>
          )}
          야간 가능
        </button>
      </div>
    </div>
  );
}
