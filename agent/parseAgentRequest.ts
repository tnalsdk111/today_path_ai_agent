import { SUPPORTED_DONGS } from "@/lib/supportedDongs";

const DONG_FIELD_KEYS = ["dong", "selectedDong", "selected_dong", "location"] as const;
const QUERY_FIELD_KEYS = [
  "query",
  "message",
  "input",
  "text",
  "content",
  "user_message",
  "userMessage",
] as const;

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
  // "풍덕천2동", "풍덕천2동에서", "풍덕천2동 산책" 등 짧은 꼬리만 허용
  return withoutDong.length <= 4;
}

export interface ParsedAgentRequest {
  dong: string | null;
  query: string;
}

/** 외부 에이전트가 다양한 형식으로 보낸 요청을 파싱한다. */
export function parseAgentRequest(rawBody: unknown): ParsedAgentRequest {
  if (typeof rawBody === "string") {
    const text = rawBody.trim();
    const dong = findDongInText(text);
    if (dong && isDongOnlyInput(text, dong)) {
      return { dong, query: "" };
    }
    return { dong: null, query: text };
  }

  if (!rawBody || typeof rawBody !== "object") {
    return { dong: null, query: "" };
  }

  const record = rawBody as Record<string, unknown>;
  const explicitDong = pickString(record, DONG_FIELD_KEYS);
  const textInput = pickString(record, QUERY_FIELD_KEYS) ?? "";

  if (explicitDong) {
    return { dong: explicitDong, query: textInput };
  }

  const dongFromText = findDongInText(textInput);
  if (dongFromText && isDongOnlyInput(textInput, dongFromText)) {
    return { dong: dongFromText, query: "" };
  }

  return { dong: null, query: textInput };
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
