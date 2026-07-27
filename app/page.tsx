"use client";

import { useEffect, useState } from "react";
import WeatherBox from "@/components/WeatherBox";
import DongSelector from "@/components/DongSelector";
import FilterPanel from "@/components/FilterPanel";
import CourseCard from "@/components/CourseCard";
import BottomNav from "@/components/BottomNav";
import { useFilterStore } from "@/store/useFilterStore";
import { filterCourses } from "@/lib/filterCourses";
import { scoreCourse, buildWeights } from "@/lib/scoreCourse";
import { Course, WeatherData } from "@/types/index";
import coursesData from "@/data/courses.json";
import { MOCK_WEATHER } from "@/lib/mockWeather";

const courses = coursesData as Course[];


export default function HomePage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const dong = useFilterStore((s) => s.dong);
  const duration = useFilterStore((s) => s.duration);
  const themes = useFilterStore((s) => s.themes);
  const nightSafe = useFilterStore((s) => s.nightSafe);
  const flatPriority = useFilterStore((s) => s.flatPriority);
  const coolPriority = useFilterStore((s) => s.coolPriority);
  const toiletPriority = useFilterStore((s) => s.toiletPriority);
  const naturePriority = useFilterStore((s) => s.naturePriority);

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!data?.weather) throw new Error("invalid response");
        return data as WeatherData;
      })
      .then((data) => setWeatherData(data))
      .catch(() => {
        setFetchError(true);
        setWeatherData(MOCK_WEATHER);
      });
  }, []);

  const rankedCourses: Course[] = (() => {
    if (!dong || !weatherData) return [];

    const safeCourses = weatherData.weather.is_raining
      ? courses.filter((c) => !c.flood_risk)
      : courses;

    const hasFilter =
      duration !== null ||
      themes.length > 0 ||
      nightSafe ||
      flatPriority ||
      coolPriority ||
      toiletPriority ||
      naturePriority;

    const filterOptions = hasFilter
      ? { dong, duration: duration ?? undefined, themes, nightSafe }
      : { dong };
    const filtered = filterCourses(safeCourses, filterOptions);

    const weights = buildWeights({
      dong,
      flatPriority,
      coolPriority,
      toiletPriority,
      naturePriority,
    });

    return filtered
      .map((c) => ({ course: c, score: scoreCourse(c, weights) })) // 각 코스에 대한 점수 계산
      .sort((a, b) => b.score - a.score) // 점수 순으로 정렬
      .map(({ course }) => course); // 코스 데이터만 반환
  })();

  return (
    <div className="font-body-md text-on-surface bg-background">
      <div className="max-w-[390px] mx-auto relative min-h-screen pb-24">

        {/* TopAppBar */}
        <header className="sticky top-0 z-50 bg-surface shadow-sm px-margin py-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-h2 font-h2 text-primary">
            <span className="material-symbols-outlined">energy_savings_leaf</span>
            오늘의 길
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 text-on-surface-variant rounded-full hover:bg-secondary-container/50"
              aria-label="알림"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              type="button"
              className="p-2 text-on-surface-variant rounded-full hover:bg-secondary-container/50"
              aria-label="검색"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        {/* main */}
        <main className="px-margin pt-md pb-xl flex flex-col gap-lg">

          {/* 1. WeatherBox */}
          {weatherData === null ? (
            <div className="h-[160px] bg-surface-container rounded-xl animate-pulse" />
          ) : (
            <WeatherBox data={weatherData} />
          )}

          {/* 2. DongSelector */}
          <DongSelector />

          {/* 3. FilterPanel */}
          <FilterPanel />

          {/* 4. 코스 결과 */}
          {dong && weatherData && (
            <section className="flex flex-col gap-md">
              <h2 className="font-h3 text-h3 text-on-surface">
                {rankedCourses.length}개의 코스를 찾았어요
              </h2>
              {rankedCourses.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">
                  조건에 맞는 코스가 없어요. 필터를 조정해보세요.
                </p>
              ) : (
                <div className="flex flex-col gap-md">
                  {rankedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      pollen={weatherData.pollen}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* fetch 에러 안내 (개발용) */}
          {fetchError && (
            <p className="text-label-sm font-label-sm text-on-surface-variant text-center">
              날씨 데이터를 불러오지 못해 목업 데이터를 사용 중입니다.
            </p>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
