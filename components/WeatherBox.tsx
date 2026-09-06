import type { ReactNode } from "react";
import { WeatherData, AirGrade, PollenLevel, PollenReading } from "@/types/index";

interface WeatherBoxProps {
  data: WeatherData;
}

function formatTime(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (isNaN(date.getTime())) {
    const match = updatedAt.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : updatedAt;
  }
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function weatherIcon(condition: WeatherData["weather"]["condition"]): string {
  switch (condition) {
    case "맑음": return "sunny";
    case "구름많음": return "partly_cloudy_day";
    case "흐림": return "cloud";
    case "비": return "rainy";
    case "눈": return "ac_unit";
  }
}

function airGradeBadgeClass(grade: AirGrade): string {
  switch (grade) {
    case "좋음": return "bg-[#EAF3EC] text-primary";
    case "보통": return "bg-orange-100 text-orange-800";
    case "나쁨": return "bg-red-100 text-red-800";
    case "매우나쁨": return "bg-red-200 text-red-900";
  }
}

function airGradeDotClass(grade: AirGrade): string {
  switch (grade) {
    case "좋음": return "bg-primary";
    case "보통": return "bg-orange-400";
    case "나쁨": return "bg-red-400";
    case "매우나쁨": return "bg-red-600";
  }
}

function pollenLevelClass(level: PollenLevel): string {
  switch (level) {
    case "매우높음":
    case "높음": return "text-orange-600";
    case "보통": return "text-yellow-600";
    case "낮음": return "text-on-surface-variant";
  }
}

function pollenReadingLabel(reading: PollenReading): string {
  if (reading.status === "ok") return reading.level;
  if (reading.status === "off_season") return "시즌 외";
  return "불러오지 못함";
}

function pollenReadingClass(reading: PollenReading): string {
  if (reading.status === "ok") return pollenLevelClass(reading.level);
  return "text-on-surface-variant";
}

function alertMessage(data: WeatherData): string | null {
  if (data.weather.is_raining) {
    return "비가 오고 있어요. 우산을 챙기세요.";
  }
  if (data.air.pm10_grade === "나쁨" || data.air.pm10_grade === "매우나쁨") {
    return "오늘은 미세먼지가 나쁩니다. 마스크를 착용하세요.";
  }
  const pollenNames: Record<"pine" | "oak" | "grass", string> = {
    pine: "소나무",
    oak: "참나무",
    grass: "잡초류",
  };
  for (const key of ["pine", "oak", "grass"] as const) {
    if (data.pollen[key].status === "ok" &&
        (data.pollen[key].level === "높음" || data.pollen[key].level === "매우높음")) {
      return `오늘은 ${pollenNames[key]} 꽃가루가 많아요. 마스크를 챙기세요.`;
    }
  }
  return null;
}

function WeatherBoxFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="bg-surface-container-lowest rounded-xl p-md flex flex-col gap-md min-h-[160px]"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>
  );
}

export function WeatherBoxLoading() {
  return (
    <WeatherBoxFrame>
      <div className="flex-1 flex items-center justify-center">
        <span className="text-on-surface-variant font-body-md text-body-md">
          날씨 로드 중입니다
        </span>
      </div>
    </WeatherBoxFrame>
  );
}

export function WeatherBoxError() {
  return (
    <WeatherBoxFrame>
      <div className="flex-1 flex items-center justify-center">
        <span className="text-on-surface-variant font-body-md text-body-md">
          날씨를 불러오지 못했어요
        </span>
      </div>
    </WeatherBoxFrame>
  );
}

export default function WeatherBox({ data }: WeatherBoxProps) {
  const alert = alertMessage(data);

  return (
    <WeatherBoxFrame>
      {/* 상단 행 */}
      <div className="flex justify-between items-start">
        {/* 왼쪽: 아이콘 + 기온 + 날씨 상태 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-4xl text-orange-400"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {weatherIcon(data.weather.condition)}
            </span>
            <span className="text-h1 font-h1 text-on-surface">
              {data.weather.temp}°
            </span>
          </div>
          <span className="text-label-sm font-label-sm text-on-surface-variant">
            {data.weather.condition} • {formatTime(data.updated_at)} 기준
          </span>
        </div>

        {/* 오른쪽: PM10 + PM2.5 배지 */}
        <div className="flex flex-col gap-1 items-end">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm ${airGradeBadgeClass(data.air.pm10_grade)}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${airGradeDotClass(data.air.pm10_grade)}`}
            />
            미세먼지 {data.air.pm10_grade}
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm ${airGradeBadgeClass(data.air.pm25_grade)}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${airGradeDotClass(data.air.pm25_grade)}`}
            />
            초미세먼지 {data.air.pm25_grade}
          </div>
        </div>
      </div>

      {/* 꽃가루 지수 섹션 */}
      <div className="bg-surface-container-low rounded-lg p-sm">
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
          꽃가루 지수
        </p>
        <div className="flex">
          {(
            [
              { key: "pine", label: "소나무" },
              { key: "oak", label: "참나무" },
              { key: "grass", label: "잡초류" },
            ] as const
          ).map(({ key, label }, idx) => (
            <div key={key} className="flex flex-1">
              {idx !== 0 && (
                <div className="w-[1px] bg-outline-variant/30 mx-2 self-stretch" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="font-body-md text-body-md text-on-surface">
                  {label}
                </span>
                <span
                  className={`font-label-sm text-label-sm font-semibold ${pollenReadingClass(data.pollen[key])}`}
                >
                  {pollenReadingLabel(data.pollen[key])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상황별 안내 문구 */}
      {alert && (
        <div className="flex items-center gap-2 bg-orange-50 border-l-4 border-orange-400 p-sm rounded-r-lg">
          <span
            className="material-symbols-outlined text-orange-500 text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <p className="font-body-md text-body-md text-orange-800">{alert}</p>
        </div>
      )}
    </WeatherBoxFrame>
  );
}
