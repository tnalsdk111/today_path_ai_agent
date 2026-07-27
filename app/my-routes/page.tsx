"use client";

import { useState, useEffect } from "react";
import CourseCard from "@/components/CourseCard";
import BottomNav from "@/components/BottomNav";
import { getRecentCourses, getFavorites } from "@/lib/localStorage";
import { Course } from "@/types/index";
import coursesData from "@/data/courses.json";
import { MOCK_WEATHER } from "@/lib/mockWeather";

const courses = coursesData as Course[];
const pollen = MOCK_WEATHER.pollen;

export default function MyRoutesPage() {
  const [activeTab, setActiveTab] = useState<"recent" | "favorites">("recent");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentIds(getRecentCourses());
    setFavoriteIds(getFavorites());
  }, []);

  const displayIds = activeTab === "recent" ? recentIds : favoriteIds;
  const displayCourses = displayIds
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is Course => c !== undefined);

  const emptyIcon = activeTab === "recent" ? "directions_walk" : "favorite_border";
  const emptyText =
    activeTab === "recent" ? "아직 본 경로가 없어요" : "즐겨찾기한 경로가 없어요";

  return (
    <div className="font-body-md text-on-surface bg-background min-h-screen">
      <div className="max-w-[390px] mx-auto px-margin pt-md pb-24">
        <h1 className="font-h2 text-h2 text-on-surface mb-md">내 경로</h1>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-lg">
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`rounded-full px-md py-1.5 font-body-md text-body-md ${
              activeTab === "recent"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant"
            }`}
          >
            최근 본 경로
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={`rounded-full px-md py-1.5 font-body-md text-body-md ${
              activeTab === "favorites"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant"
            }`}
          >
            즐겨찾기
          </button>
        </div>

        {/* 코스 목록 또는 빈 상태 */}
        {displayCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl">
            <span className="material-symbols-outlined text-outline text-[48px]">
              {emptyIcon}
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              {emptyText}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {displayCourses.map((course) => (
              <CourseCard key={course.id} course={course} pollen={pollen} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
