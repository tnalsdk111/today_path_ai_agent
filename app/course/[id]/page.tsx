"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CourseMap from "@/components/CourseMap";
import EnvIndicatorPanel from "@/components/EnvIndicatorPanel";
import VegetationPanel from "@/components/VegetationPanel";
import { ToiletFacilityBadges } from "@/components/ToiletFacilityBadges";
import { Course, WeatherData } from "@/types/index";
import coursesData from "@/data/courses.json";
import { MOCK_WEATHER } from "@/lib/mockWeather";

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

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: WeatherData) => setWeatherData(data))
      .catch(() => setWeatherData(MOCK_WEATHER));
  }, []);

  const course = (coursesData as Course[]).find((c) => c.id === id);

  if (!course) {
    return (
      <div className="max-w-[390px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-margin">
        <p className="font-body-md text-body-md text-on-surface-variant">
          코스를 찾을 수 없어요.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary font-body-md text-body-md"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          뒤로가기
        </button>
      </div>
    );
  }

  function handleKakaoMap() {
    const kakaoUrl = `https://map.kakao.com/link/to/${course!.name},${course!.start_point.lat},${course!.start_point.lng}`;
    window.open(kakaoUrl, "_blank", "noopener,noreferrer");
  }

  const pollen = weatherData?.pollen ?? MOCK_WEATHER.pollen;

  return (
    <div className="max-w-[390px] mx-auto relative min-h-screen bg-background pb-[100px]">

      {/* 지도 영역 */}
      <div className="w-full h-[240px] absolute top-0 left-0 z-0">
        <CourseMap course={course} />
      </div>

      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-50 flex items-center justify-between px-margin py-xs bg-gradient-to-b from-black/30 to-transparent">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white drop-shadow-md"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "white" }}>
            코스 상세 정보
          </span>
        </button>
        <button type="button" className="text-white drop-shadow-md">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      {/* main 콘텐츠 */}
      <main className="relative z-10 px-margin mt-[180px] flex flex-col">

        {/* 1. 코스 헤더 카드 */}
        <div
          className="bg-surface-container-lowest rounded-[16px] p-md mb-md"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <h1
            className="text-on-surface mb-2"
            style={{ fontSize: "22px", fontWeight: 700, lineHeight: "28px" }}
          >
            {course.name}
          </h1>

          {/* 테마 태그 */}
          <div className="flex gap-2 flex-wrap mb-md">
            {course.themes.map((theme) => (
              <span
                key={theme}
                className="bg-surface-container text-primary-container font-label-sm text-label-sm rounded-full px-3 py-1"
              >
                {THEME_LABEL[theme]}
              </span>
            ))}
          </div>

          {/* 스탯 그리드 */}
          <div className="grid grid-cols-2 gap-y-sm gap-x-md mb-md pt-xs">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">거리</p>
              <p className="font-body-md text-body-md font-semibold">{course.distance_km}km</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">소요 시간</p>
              <p className="font-body-md text-body-md font-semibold">약 {course.duration_min}분</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">난이도</p>
              <span className="bg-surface-container text-primary-container font-label-sm text-label-sm rounded-full px-2 py-0.5">
                {DIFFICULTY_LABEL[course.difficulty]}
              </span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">코스 유형</p>
              <p className="font-body-md text-body-md font-semibold">
                {course.is_loop ? "순환 코스" : "왕복 코스"}
              </p>
            </div>
          </div>

          {/* 야간 가능 배너 */}
          {course.night_safe && (
            <div
              className="rounded-lg p-2 flex items-center gap-2"
              style={{ backgroundColor: "#EAF3EC" }}
            >
              <span
                className="material-symbols-outlined text-primary-container text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                nightlight
              </span>
              <span className="font-label-sm text-label-sm text-primary-container">
                야간 산책 가능 (조명 시설 완비)
              </span>
            </div>
          )}
        </div>

        {/* 2. 환경 지표 */}
        <EnvIndicatorPanel course={course} />

        {/* 3. 편의 시설 카드 */}
        <div
          className="bg-surface-container-lowest rounded-[16px] p-md mb-md"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-sm border-b border-surface-variant pb-2">
            <span
              className="material-symbols-outlined text-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              wc
            </span>
            <span className="font-h3 text-h3 text-on-surface">편의 시설</span>
          </div>

          <div className="flex flex-col">
            {course.facilities.toilets.map((toilet, idx) => (
              <div
                key={`${toilet.lat}-${toilet.lng}-${toilet.name}-${idx}`}
                className={`flex items-center justify-between gap-3 font-body-md text-body-md text-on-surface ${idx !== 0 ? "border-t border-surface-variant pt-sm" : ""}`}
              >
                <span className="min-w-0">🚻 {toilet.name}</span>
                <ToiletFacilityBadges toilet={toilet} />
              </div>
            ))}
            {course.facilities.park_entrances.map((entrance) => (
              <p
                key={entrance.name}
                className="font-body-md text-body-md text-on-surface border-t border-surface-variant pt-sm"
              >
                🌳 {entrance.name}
              </p>
            ))}
          </div>
        </div>

        {/* 4. 식생 패널 */}
        <VegetationPanel course={course} pollen={pollen} />
      </main>

      {/* CTA 버튼 */}
      <div className="fixed bottom-0 left-0 w-full z-50 max-w-[390px] mx-auto right-0 pb-lg pt-4 px-margin bg-gradient-to-t from-background to-transparent">
        <button
          type="button"
          onClick={handleKakaoMap}
          className="w-full bg-primary-container text-white rounded-full py-3 px-6 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="w-[20px] h-[20px] bg-[#FEE500] rounded-sm flex items-center justify-center">
            <span style={{ color: "#191919", fontWeight: "bold", fontSize: "12px" }}>K</span>
          </div>
          <span className="font-h3 text-h3">카카오맵으로 길찾기</span>
        </button>
      </div>
    </div>
  );
}
