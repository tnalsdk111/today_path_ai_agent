import { NextResponse } from "next/server";
import { analyzeNaturalLanguageQuery } from "@/lib/analyzeNaturalLanguageQuery";
import type { ExtractedConditions } from "@/types/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const extracted = await analyzeNaturalLanguageQuery(query);

    console.log("[analyze] query:", query);
    console.log("[analyze] extracted:", JSON.stringify(extracted, null, 2));

    return NextResponse.json(extracted satisfies ExtractedConditions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "analyze failed";
    const status = message === "OPENAI_API_KEY is not set" ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
