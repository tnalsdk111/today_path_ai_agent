import { NextResponse } from "next/server";
import { runDongIntro } from "@/agent/runDongIntro";
import { runWalkRecommendation } from "@/agent/runWalkRecommendation";

export const dynamic = "force-dynamic";

/**
 * 산책로 추천 에이전트 API (2단계 대화)
 *
 * 1단계 — 동만 선택 (query 없음)
 *   POST { "dong": "풍덕천1동" }
 *   → 해당 동 산책로 목록 + 추가 조건 안내
 *
 * 2단계 — 추가 조건 입력
 *   POST { "dong": "풍덕천1동", "query": "30분 이내 시원한 길" }
 *   → 조건에 맞는 산책로 추천
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const dong =
      typeof body?.dong === "string" && body.dong.trim()
        ? body.dong.trim()
        : null;

    if (!dong) {
      return NextResponse.json({ error: "dong is required" }, { status: 400 });
    }

    if (!query) {
      const result = runDongIntro(dong);
      return NextResponse.json(result);
    }

    const result = await runWalkRecommendation(query, dong);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "recommendation failed";
    const status =
      message === "OPENAI_API_KEY is not set" ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
