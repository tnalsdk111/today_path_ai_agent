import { NextResponse } from "next/server";
import {
  parseAgentRequest,
  readAgentRequestBody,
} from "@/agent/parseAgentRequest";
import { runDongIntro } from "@/agent/runDongIntro";
import { runWalkRecommendation } from "@/agent/runWalkRecommendation";
import { SUPPORTED_DONGS } from "@/lib/supportedDongs";

export const dynamic = "force-dynamic";

/**
 * 산책로 추천 에이전트 API (2단계 대화)
 *
 * 1단계 — 동 선택
 *   POST { "dong": "풍덕천1동" }
 *   POST { "message": "풍덕천1동" }
 *   POST 풍덕천1동  (plain text)
 *
 * 2단계 — 추가 조건
 *   POST { "dong": "풍덕천1동", "query": "30분 이내 시원한 길" }
 *   POST { "dong": "풍덕천1동", "message": "시원한 길" }
 */
export async function POST(req: Request) {
  try {
    const rawBody = await readAgentRequestBody(req);
    const { dong, query } = parseAgentRequest(rawBody);

    if (!dong) {
      return NextResponse.json(
        {
          error: "dong is required",
          hint:
            "JSON 예: { \"dong\": \"풍덕천2동\" } 또는 { \"message\": \"풍덕천2동\" }. 동 이름만 plain text로도 가능합니다.",
          supportedDongs: [...SUPPORTED_DONGS],
          received: rawBody,
        },
        { status: 400 },
      );
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
