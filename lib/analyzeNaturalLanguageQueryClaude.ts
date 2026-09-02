import Anthropic from "@anthropic-ai/sdk";
import { buildAnalyzeQuerySystemPrompt } from "@/lib/analyzeQueryPrompt";
import { parseExtractedConditions } from "@/lib/parseExtractedConditions";
import type { ExtractedConditions } from "@/types/ai";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

function textFromMessage(message: Anthropic.Message): string | null {
  const block = message.content.find((item) => item.type === "text");
  return block?.type === "text" ? block.text : null;
}

/** 에이전트 전용: 자연어 입력을 Claude로 산책 조건 JSON 분석한다. */
export async function analyzeNaturalLanguageQueryClaude(
  query: string,
): Promise<ExtractedConditions> {
  const anthropic = getAnthropicClient();
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: buildAnalyzeQuerySystemPrompt(),
    messages: [{ role: "user", content: query }],
  });

  const content = textFromMessage(message);
  if (!content) {
    throw new Error("empty response from Claude");
  }

  return parseExtractedConditions(content);
}
