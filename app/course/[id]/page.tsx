"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CourseMap from "@/components/CourseMap";
import EnvIndicatorPanel from "@/components/EnvIndicatorPanel";
import VegetationPanel from "@/components/VegetationPanel";
import { Course, WeatherData } from "@/types/index";
import coursesData from "@/data/courses.json";
import { MOCK_WEATHER } from "@/lib/mockWeather";
import { addRecentCourse } from "@/lib/localStorage";
import { THEME_LABEL } from "@/lib/themeLabels";

const DIFFICULTY_LABEL: Record<Course["difficulty"], string> = {
  flat: "평탄",
  moderate: "보통",
  steep: "가파름",
};

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const [sheetState, setSheetState] = useState<"peek" | "expanded">("peek");
  const [showToilets, setShowToilets] = useState(false);
  const [isToiletExpanded, setIsToiletExpanded] = useState(false);
  const [showParkEntrances, setShowParkEntrances] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const dragStartY = useRef(0);
  const didDrag = useRef(false);

  useEffect(() => {
    if (id) addRecentCourse(id);
  }, [id]);

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
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 bg-background px-margin">
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

  const pollen = weatherData?.pollen ?? MOCK_WEATHER.pollen;

  function handleKakaoMap() {
    const encodedName = encodeURIComponent(course!.name);
    const url = `https://map.kakao.com/link/to/${encodedName},${course!.start_point.lat},${course!.start_point.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onHandlePointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    didDrag.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (Math.abs(e.clientY - dragStartY.current) > 8) didDrag.current = true;
  }

  function onHandlePointerUp(e: React.PointerEvent) {
    const delta = e.clientY - dragStartY.current;
    if (!didDrag.current) {
      setSheetState((s) => (s === "peek" ? "expanded" : "peek"));
    } else if (delta < -40) {
      setSheetState("expanded");
    } else if (delta > 40) {
      setSheetState("peek");
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <CourseMap
          course={course}
          showToilets={showToilets}
          showParkEntrances={showParkEntrances}
        />
      </div>

      {/* Back button overlay */}
      <button
        type="button"
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-white text-[22px]">
          arrow_back
        </span>
      </button>

      {/* Bottom Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 bg-surface-container-lowest rounded-t-[24px] transition-[height] duration-300 ease-in-out"
        style={{
          height: sheetState === "expanded" ? "85dvh" : "40dvh",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Drag handle */}
        <div
          className="h-9 flex justify-center items-center cursor-pointer touch-none select-none"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
        >
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto h-[calc(100%-36px)] px-margin pt-sm pb-xl">

          {/* ── 핵심 정보 (peek) ────────────────────── */}
          <h1 className="font-h2 text-h2 text-on-surface mb-2">{course.name}</h1>

          {/* 테마 태그 */}
          <div className="flex gap-2 flex-wrap mb-sm">
            {course.themes.map((theme) => (
              <span
                key={theme}
                className="bg-[#EAF3EC] text-primary px-2 py-0.5 rounded-full font-label-sm text-label-sm"
              >
                {THEME_LABEL[theme]}
              </span>
            ))}
          </div>

          {/* 핵심 스탯 한 줄 */}
          <div className="flex items-center gap-md text-on-surface-variant font-body-md text-body-md mb-2">
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
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
              {course.calories}kcal
            </span>
          </div>

          {/* 야간 가능 태그 */}
          {course.night_safe && (
            <span className="inline-flex items-center gap-1 bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full mb-sm">
              <span className="material-symbols-outlined text-[14px]">
                wb_twilight
              </span>
              야간 가능
            </span>
          )}

          {/* POI 토글 버튼 */}
          <div className="flex gap-2 mt-sm mb-md">
            <button
              type="button"
              onClick={() => setShowToilets((v) => !v)}
              className={`font-label-sm text-label-sm rounded-full px-md py-1.5 transition-colors ${
                showToilets
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              🚻 화장실
            </button>
            <button
              type="button"
              onClick={() => setShowParkEntrances((v) => !v)}
              className={`font-label-sm text-label-sm rounded-full px-md py-1.5 transition-colors ${
                showParkEntrances
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              🅿️ 공원 입구
            </button>
          </div>

          {/* ── 확장 콘텐츠 (expanded) ──────────────── */}
          <div className="h-[0.5px] bg-outline-variant/30 mb-md" />

          {/* 섹션 1: 이 코스의 환경 */}
          <EnvIndicatorPanel course={course} />

          {/* 섹션 2: 부가 정보 (화장실 + 공원 입구) */}
          <section className="mb-md">
            <h2 className="font-h3 text-h3 text-on-surface mb-sm">부가 정보</h2>

            {/* 화장실 아코디언 헤더 */}
            <button
              type="button"
              onClick={() => course.toilet_count > 0 && setIsToiletExpanded((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 text-on-surface-variant font-body-md text-body-md ${course.toilet_count > 0 ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">wc</span>
                {course.toilet_count > 0 ? `화장실 ${course.toilet_count}개` : "화장실 없음"}
              </div>
              {course.toilet_count > 0 && (
                <span className="material-symbols-outlined text-[18px]">
                  {isToiletExpanded ? "expand_less" : "expand_more"}
                </span>
              )}
            </button>

            {/* 화장실 목록 */}
            {isToiletExpanded && course.toilet_count > 0 && (
              <div className="mt-sm flex flex-col transition-all duration-200">
                <div className="flex gap-2 mb-sm">
                  <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-label-sm text-label-sm">♿ 장애인</span>
                  <span className="bg-[#EAF3EC] text-primary rounded-full px-2 py-0.5 font-label-sm text-label-sm">🧒 어린이</span>
                  <span className="bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 font-label-sm text-label-sm">🔔 비상벨</span>
                </div>
                {course.facilities.toilets.map((toilet, idx) => (
                  <div key={`${toilet.name}-${idx}`}>
                    {idx > 0 && <div className="h-[0.5px] bg-outline-variant/30" />}
                    <div className="flex items-center justify-between py-1 gap-2">
                      <span className="font-body-md text-body-md text-on-surface">
                        🚻 {toilet.name}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        {toilet.accessible && (
                          <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-label-sm text-label-sm">
                            ♿
                          </span>
                        )}
                        {toilet.children && (
                          <span className="bg-[#EAF3EC] text-primary rounded-full px-2 py-0.5 font-label-sm text-label-sm">
                            🧒
                          </span>
                        )}
                        {toilet.emergency_bell && (
                          <span className="bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 font-label-sm text-label-sm">
                            🔔
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {course.facilities.park_entrances.length > 0 && (
              <>
                <div className="h-[0.5px] bg-outline-variant/30 my-sm" />
                <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                  <span className="material-symbols-outlined text-[18px]">park</span>
                  공원 입구 {course.facilities.park_entrances.length}개
                </div>
              </>
            )}
          </section>

          {/* 섹션 3: 이 코스의 식생 */}
          <VegetationPanel course={course} pollen={pollen} />

          {/* CTA */}
          <button
            type="button"
            onClick={handleKakaoMap}
            className="w-full bg-primary-container text-white rounded-full py-3 px-6 flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="w-[20px] h-[20px] bg-[#FEE500] rounded-sm flex items-center justify-center">
              <span
                style={{ color: "#191919", fontWeight: "bold", fontSize: "12px" }}
              >
                K
              </span>
            </div>
            <span className="font-h3 text-h3">카카오맵으로 길찾기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
