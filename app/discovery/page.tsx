"use client";

import { useEffect, useState } from "react";
import DongSelector from "@/components/DongSelector";
import BottomNav from "@/components/BottomNav";
import CourseCard from "@/components/CourseCard";
import CoursesStartMap from "@/components/CoursesStartMap";
import UnsupportedDongNotice from "@/components/UnsupportedDongNotice";
import { rankAiRecommendedCourses } from "@/lib/rankAiRecommendedCourses";
import { resolveDong } from "@/lib/resolveDong";
import { useAiStore } from "@/store/useAiStore";
import { useFilterStore } from "@/store/useFilterStore";
import type { ExtractedConditions } from "@/types/ai";
import type { Course, WeatherData } from "@/types/index";

export default function DiscoveryPage() {
  // 홈과 공유하는 상태(Zustand)
  const dong = useFilterStore((s) => s.dong); // 홈과 공유하는 선택 동
  const extractedConditions = useAiStore((s) => s.extractedConditions); // AI 분석 결과
  const setExtractedConditions = useAiStore((s) => s.setExtractedConditions); // AI 분석 결과 설정

  // 현재 페이지에서 사용하는 상태 (로컬 state)
  const [query, setQuery] = useState(""); // 사용자 입력 쿼리
  const [unsupportedSourceText, setUnsupportedSourceText] = useState<string | null>(null); // null이 아니면 UnsupportedDongNotice 표시
  const [rankedCourses, setRankedCourses] = useState<Course[]>([]); // 추천된 코스 목록
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null); // 날씨, 꽃가루
  const [missingDongMessage, setMissingDongMessage] = useState(false); // 동이 없을 때 안내 표시 여부
  const [isAnalyzing, setIsAnalyzing] = useState(false); // GPT 분석 중
  const [analyzeError, setAnalyzeError] = useState<string | null>(null); // 분석 실패 메시지

  // 날씨, 꽃가루 데이터 가져오기
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
      .catch(() => setWeatherData(null));
  }, []);

  // 추천 실행 - finalDong과 분석 결과로 코스를 계산한다.
  function runRecommendation(extracted: typeof extractedConditions, finalDong: string) {
    if (!extracted) return;

    const courses = rankAiRecommendedCourses(extracted, finalDong, weatherData);
    setRankedCourses(courses);
    setUnsupportedSourceText(null);
    setMissingDongMessage(false);
  }

  function applyRecommendation(extracted: ExtractedConditions) {
    const resolution = resolveDong(extracted.dong, dong);

    if (resolution.status === "resolved") {
      runRecommendation(extracted, resolution.dong);
      return;
    }

    setRankedCourses([]);

    if (resolution.status === "unsupported") {
      setUnsupportedSourceText(resolution.sourceText);
      setMissingDongMessage(false);
      return;
    }

    setUnsupportedSourceText(null);
    setMissingDongMessage(true);
  }

  // 사용자 입력 처리 - '추천 받기' 클릭 -> GPT 분석 후 추천 실행
  async function handleRecommend() {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "분석에 실패했습니다.");
      }

      const extracted = data as ExtractedConditions;
      console.log("[AI 추출 조건]", extracted);
      setExtractedConditions(extracted);
      applyRecommendation(extracted);
    } catch (error) {
      setRankedCourses([]);
      setUnsupportedSourceText(null);
      setMissingDongMessage(false);
      setAnalyzeError(error instanceof Error ? error.message : "분석에 실패했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  // [ㅇㅇ동으로 추천 받기] 버튼
  function handleRecommendWithSelected() {
    if (!dong || !extractedConditions) return;
    runRecommendation(extractedConditions, dong);
  }

  // [다시 입력하기] 버튼
  function handleRetryInput() {
    setUnsupportedSourceText(null);
  }

  useEffect(() => {
    if (!extractedConditions || rankedCourses.length === 0) return;
    applyRecommendation(extractedConditions);
  }, [weatherData]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="font-body-md text-on-surface bg-background">
      <div className="max-w-[390px] mx-auto relative min-h-screen pb-24">
        <header className="sticky top-0 z-50 bg-surface shadow-sm px-margin py-sm flex items-center">
          <div className="flex items-center gap-2 text-h2 font-h2 text-primary">
            <span className="material-symbols-outlined">explore</span>
            AI 산책로 추천
          </div>
        </header>

        <main className="px-margin pt-md pb-xl flex flex-col gap-lg">
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            현재 GPS 기반 위치 추천을 지원하지 않습니다.
            <br />
            산책할 동을 선택한 뒤 원하는 산책 조건을 입력해 주세요.
          </p>

          <DongSelector />

          <section className="flex flex-col gap-sm">
            <h3 className="text-h3 font-h3 text-on-surface">어떤 산책을 원하시나요?</h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 30분 정도 평탄한 공원 산책로를 찾아줘. 화장실도 있으면 좋겠어."
              rows={4}
              className="w-full resize-none rounded-lg px-md py-sm text-body-lg font-body-lg bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/30"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            />
          </section>

          <button
            type="button"
            disabled={!query.trim() || isAnalyzing}
            onClick={handleRecommend}
            className="w-full rounded-lg bg-primary text-on-primary font-body-lg text-body-lg py-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {isAnalyzing ? "분석 중..." : "추천 받기"}
          </button>

          {analyzeError && (
            <p className="font-body-md text-body-md text-error text-center">
              {analyzeError}
            </p>
          )}

          {unsupportedSourceText && (
            <UnsupportedDongNotice
              sourceText={unsupportedSourceText}
              selectedDong={dong}
              onRecommendWithSelected={handleRecommendWithSelected}
              onRetryInput={handleRetryInput}
            />
          )}

          <section className="flex flex-col gap-md">
            <h2 className="font-h3 text-h3 text-on-surface">추천 결과</h2>
            {missingDongMessage ? (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">
                동을 선택하거나 입력해 주세요.
              </p>
            ) : rankedCourses.length > 0 ? (
              <>
                <p className="font-body-md text-body-md text-on-surface">
                  {rankedCourses.length}개의 코스를 찾았어요
                </p>
                <CoursesStartMap courses={rankedCourses} />
                <div className="flex flex-col gap-md">
                  {rankedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} pollen={weatherData?.pollen} />
                  ))}
                </div>
              </>
            ) : unsupportedSourceText ? null : (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-lg">
                산책 조건을 입력한 뒤 추천 받기를 눌러 주세요.
              </p>
            )}
          </section>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
