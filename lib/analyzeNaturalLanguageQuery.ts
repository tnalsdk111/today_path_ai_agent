import OpenAI from "openai";
import { buildAnalyzeQuerySystemPrompt } from "@/lib/analyzeQueryPrompt";
import { parseExtractedConditions } from "@/lib/parseExtractedConditions";
import type { ExtractedConditions } from "@/types/ai";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

/** discovery 전용: 자연어 입력을 OpenAI로 산책 조건 JSON 분석한다. */
export async function analyzeNaturalLanguageQuery(
  query: string,
): Promise<ExtractedConditions> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildAnalyzeQuerySystemPrompt() },
      { role: "user", content: query },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("empty response from OpenAI");
  }

  return parseExtractedConditions(content);
}
