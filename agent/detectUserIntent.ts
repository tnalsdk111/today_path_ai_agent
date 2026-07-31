import { SUPPORTED_DONGS } from "@/lib/supportedDongs";
import { findDongInText } from "@/agent/parseAgentRequest";

export type UserIntent =
  | { type: "reset_dong" }
  | { type: "list_supported_dongs" }
  | { type: "select_dong"; dong: string }
  | { type: "recommend"; query: string }
  | { type: "empty" };

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, "");
}

function isDongOnlyInput(text: string, dong: string): boolean {
  const normalized = normalize(text);
  const dongNormalized = dong.replace(/\s+/g, "");
  if (normalized === dongNormalized) return true;

  const withoutDong = normalized.replace(dongNormalized, "");
  return withoutDong.length <= 4;
}

const LIST_DONG_PATTERNS = [
  /지원.*동/,
  /어떤\s*동/,
  /동\s*목록/,
  /동\s*어디/,
  /동\s*알려/,
  /선택.*동/,
  /가능.*동/,
  /동\s*종류/,
  /동\s*리스트/,
];

const RESET_DONG_PATTERNS = [
  /동\s*(초기화|리셋)/i,
  /reset/i,
  /처음부터/,
  /동\s*다시/,
  /동\s*바꿔/,
  /동\s*바꾸/,
  /동\s*변경/,
  /다른\s*동/,
  /동\s*선택.*다시/,
  /선택.*취소/,
];

const CHANGE_DONG_PATTERNS = [
  /바꿔/,
  /바꾸/,
  /변경/,
  /으로\s*할/,
  /로\s*할/,
  /으로\s*해/,
  /로\s*해/,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/** 사용자 발화 의도를 분류한다. (세션 동보다 먼저 처리) */
export function detectUserIntent(text: string): UserIntent {
  const trimmed = text.trim();
  if (!trimmed) return { type: "empty" };

  const dongInText = findDongInText(trimmed);

  if (dongInText) {
    if (isDongOnlyInput(trimmed, dongInText)) {
      return { type: "select_dong", dong: dongInText };
    }
    if (matchesAny(trimmed, CHANGE_DONG_PATTERNS)) {
      return { type: "select_dong", dong: dongInText };
    }
  }

  if (matchesAny(trimmed, RESET_DONG_PATTERNS)) {
    return { type: "reset_dong" };
  }

  if (!dongInText && matchesAny(trimmed, LIST_DONG_PATTERNS)) {
    return { type: "list_supported_dongs" };
  }

  return { type: "recommend", query: trimmed };
}

export function formatSupportedDongsMessage(): string {
  const list = SUPPORTED_DONGS.map((dong) => `- ${dong}`).join("\n");
  return [
    "지원하는 동은 다음과 같습니다.",
    list,
    "",
    "산책할 동을 선택해 주세요.",
  ].join("\n");
}

export function formatDongResetMessage(): string {
  const list = SUPPORTED_DONGS.map((dong) => `- ${dong}`).join("\n");
  return [
    "선택한 동을 초기화했습니다.",
    "산책할 동을 다시 선택해 주세요.",
    list,
  ].join("\n");
}
