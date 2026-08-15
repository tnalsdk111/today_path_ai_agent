import { normalizeExtractedConditions } from "@/lib/normalizeExtractedConditions";
import type { ExtractedConditions } from "@/types/ai";

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

/** LLM 텍스트 응답을 ExtractedConditions로 정규화한다. */
export function parseExtractedConditions(content: string): ExtractedConditions {
  const parsed: unknown = parseJsonContent(content);
  const extracted = normalizeExtractedConditions(parsed);
  if (!extracted) {
    throw new Error("invalid response shape");
  }
  return extracted;
}
