"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { getRecentCourses, getFavorites } from "@/lib/localStorage";

const dummyUser = {
  name: "김수지",
  email: "suji@example.com",
  joinDate: "2026년 5월",
};

export default function ProfilePage() {
  const router = useRouter();
  const [recentCount, setRecentCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    setRecentCount(getRecentCourses().length);
    setFavoriteCount(getFavorites().length);
  }, []);

  const initial = dummyUser.name.slice(0, 1);

  return (
    <div className="font-body-md text-on-surface bg-background min-h-screen">
      <div className="max-w-[390px] mx-auto px-margin pt-md pb-24">

        {/* 프로필 영역 */}
        <div className="flex flex-col items-center py-lg">
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[28px] font-bold mb-sm">
            {initial}
          </div>
          <h1 className="font-h2 text-h2 text-on-surface">{dummyUser.name}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            {dummyUser.email}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
            {dummyUser.joinDate} 가입
          </p>
        </div>

        {/* 통계 카드 */}
        <div
          className="bg-surface-container-lowest rounded-xl p-md mb-lg flex justify-around items-center"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="font-h2 text-h2 text-on-surface">{recentCount}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              최근 본 경로
            </span>
          </div>
          <div className="w-[0.5px] h-10 bg-outline-variant/30" />
          <div className="flex flex-col items-center gap-1">
            <span className="font-h2 text-h2 text-on-surface">{favoriteCount}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              즐겨찾기
            </span>
          </div>
        </div>

        {/* 메뉴 목록 */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => router.push("/my-routes")}
            className="flex items-center justify-between py-md"
          >
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                favorite
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                즐겨찾기 보기
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
              chevron_right
            </span>
          </button>

          <div className="h-[0.5px] bg-outline-variant/30" />

          <button
            type="button"
            onClick={() => router.push("/my-routes")}
            className="flex items-center justify-between py-md"
          >
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                history
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                최근 본 경로
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
