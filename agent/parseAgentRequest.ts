import { SUPPORTED_DONGS } from "@/lib/supportedDongs";

const DONG_FIELD_KEYS = [
  "dong",
  "selectedDong",
  "selected_dong",
  "location",
  "neighborhood",
] as const;

const QUERY_FIELD_KEYS = [
  "query",
  "message",
  "input",
  "text",
  "content",
  "user_message",
  "userMessage",
  "user_input",
  "userInput",
  "utterance",
  "prompt",
  "human_input",
  "latest_message",
  "latestMessage",
  "user_utterance",
] as const;

const CONVERSATION_FIELD_KEYS = [
  "conversation_id",
  "conversationId",
  "session_id",
  "sessionId",
] as const;

const NESTED_OBJECT_KEYS = [
  "payload",
  "data",
  "body",
  "parameters",
  "arguments",
  "params",
  "tool_input",
  "toolInput",
  "metadata",
  "context",
  "request",
] as const;

const UUID_LIKE = /^[0-9a-f-]{20,}$/i;

function pickString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function isUuidLike(value: string): boolean {
  return UUID_LIKE.test(value.replace(/\s/g, ""));
}

function collectUserTexts(record: Record<string, unknown>): string[] {
  const texts: string[] = [];

  const direct = pickString(record, QUERY_FIELD_KEYS);
  if (direct && !isUuidLike(direct)) texts.push(direct);

  const messages = record.messages;
  if (Array.isArray(messages)) {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const item = messages[i];
      if (!item || typeof item !== "object") continue;
      const msg = item as Record<string, unknown>;
      const role = typeof msg.role === "string" ? msg.role : "";
      const content =
        typeof msg.content === "string" ? msg.content.trim() : "";
      if (content && (role === "user" || role === "human" || !role)) {
        texts.push(content);
        break;
      }
    }
  }

  for (const key of NESTED_OBJECT_KEYS) {
    const nested = record[key];
    if (typeof nested === "string") {
      try {
        const parsed = JSON.parse(nested) as unknown;
        if (parsed && typeof parsed === "object") {
          texts.push(...collectUserTexts(parsed as Record<string, unknown>));
        } else if (typeof parsed === "string" && parsed.trim()) {
          texts.push(parsed.trim());
        }
      } catch {
        if (nested.trim() && !isUuidLike(nested)) texts.push(nested.trim());
      }
    } else if (nested && typeof nested === "object") {
      texts.push(...collectUserTexts(nested as Record<string, unknown>));
    }
  }

  return texts;
}

/** 텍스트 안에 포함된 지원 동 이름을 찾는다. (긴 이름 우선) */
export function findDongInText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (SUPPORTED_DONGS.includes(trimmed)) return trimmed;

  const sorted = [...(SUPPORTED_DONGS as readonly string[])].sort(
    (a, b) => b.length - a.length,
  );
  for (const dong of sorted) {
    if (trimmed.includes(dong)) return dong;
  }

  return null;
}

/** 동 이름만 입력했는지 (추가 조건 없이 선택한 경우) */
function isDongOnlyInput(text: string, dong: string): boolean {
  const normalized = text.trim().replace(/\s+/g, "");
  const dongNormalized = dong.replace(/\s+/g, "");
  if (normalized === dongNormalized) return true;

  const withoutDong = normalized.replace(dongNormalized, "");
  return withoutDong.length <= 4;
}

export interface ParsedAgentRequest {
  dong: string | null;
  query: string;
  conversationId: string | null;
}

function parseFromRecord(record: Record<string, unknown>): ParsedAgentRequest {
  const conversationId = pickString(record, CONVERSATION_FIELD_KEYS);
  let dong = pickString(record, DONG_FIELD_KEYS);
  const userTexts = collectUserTexts(record);

  let query = "";
  for (const text of userTexts) {
    const dongInText = findDongInText(text);
    if (dongInText && isDongOnlyInput(text, dongInText)) {
      dong = dong ?? dongInText;
      continue;
    }
    if (!query) query = text;
  }

  if (!dong) {
    for (const text of userTexts) {
      const dongInText = findDongInText(text);
      if (dongInText) {
        dong = dongInText;
        break;
      }
    }
  }

  return { dong, query, conversationId };
}

/** 외부 에이전트가 다양한 형식으로 보낸 요청을 파싱한다. */
export function parseAgentRequest(rawBody: unknown): ParsedAgentRequest {
  if (typeof rawBody === "string") {
    const text = rawBody.trim();
    const dong = findDongInText(text);
    if (dong && isDongOnlyInput(text, dong)) {
      return { dong, query: "", conversationId: null };
    }
    return { dong: null, query: text, conversationId: null };
  }

  if (!rawBody || typeof rawBody !== "object") {
    return { dong: null, query: "", conversationId: null };
  }

  return parseFromRecord(rawBody as Record<string, unknown>);
}

export async function readAgentRequestBody(req: Request): Promise<unknown> {
  const raw = await req.text();
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw.trim();
  }
}

export function pickQueryFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  for (const key of QUERY_FIELD_KEYS) {
    const value = url.searchParams.get(key);
    if (value?.trim()) return value.trim();
  }
  const headerMessage =
    req.headers.get("x-user-message") ?? req.headers.get("x-message");
  return headerMessage?.trim() ?? null;
}
