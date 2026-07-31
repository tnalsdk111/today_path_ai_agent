import { NextResponse } from "next/server";
import {
  getConversationDong,
  setConversationDong,
} from "@/agent/conversationSession";
import {
  parseAgentRequest,
  pickQueryFromRequest,
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
 *   POST { "conversation_id": "...", "message": "풍덕천1동" }
 *
 * 2단계 — 추가 조건 (dong은 body 또는 1단계 conversation_id 세션)
 *   POST { "dong": "풍덕천1동", "message": "시원한 길" }
 *   POST { "conversation_id": "...", "message": "시원한 길" }
 */
export async function POST(req: Request) {
  try {
    const rawBody = await readAgentRequestBody(req);
    const parsed = parseAgentRequest(rawBody);
    let { dong, query } = parsed;
    const { conversationId } = parsed;

    const queryFromUrl = pickQueryFromRequest(req);
    if (!query && queryFromUrl) {
      query = queryFromUrl;
    }

    if (!dong && conversationId) {
      dong = getConversationDong(conversationId);
    }

    if (!dong) {
      return NextResponse.json(
        {
          error: "dong is required",
          hint:
            "1단계: { \"dong\": \"풍덕천1동\" } 또는 { \"conversation_id\": \"...\", \"message\": \"풍덕천1동\" }. 2단계: dong 또는 conversation_id(1단계 저장) + message(조건) 필요.",
          supportedDongs: [...SUPPORTED_DONGS],
          received: rawBody,
        },
        { status: 400 },
      );
    }

    if (!query) {
      const savedDong = conversationId
        ? getConversationDong(conversationId)
        : null;

      if (savedDong && dong === savedDong) {
        return NextResponse.json(
          {
            error: "query is required",
            hint:
              "2단계에서는 조건을 message/query 필드로 전달하세요. 예: { \"conversation_id\": \"...\", \"message\": \"시원한 길\" }",
            dong,
            conversationId,
            received: rawBody,
          },
          { status: 400 },
        );
      }

      if (conversationId) {
        setConversationDong(conversationId, dong);
      }
      const result = runDongIntro(dong);
      return NextResponse.json({
        ...result,
        conversationId,
        hint: "2단계에서는 message/query 필드로 조건을 함께 전달하세요.",
      });
    }

    const result = await runWalkRecommendation(query, dong);
    return NextResponse.json({ ...result, conversationId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "recommendation failed";
    const status =
      message === "OPENAI_API_KEY is not set" ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
