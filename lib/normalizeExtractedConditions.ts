import type {
  ConditionNote,
  ConditionNoteReason,
  ConditionNoteStatus,
  ConditionStrength,
  DurationCondition,
  ExtractedConditions,
} from "@/types/ai";
import type { Theme } from "@/types/index";

const VALID_THEMES = new Set<Theme>(["park", "lake", "forest", "stream"]);
const VALID_DURATIONS = new Set<30 | 60 | 999>([30, 60, 999]);
const VALID_NOTE_STATUSES = new Set<ConditionNoteStatus>(["approximated", "unsupported"]);
const VALID_NOTE_REASONS = new Set<ConditionNoteReason>([
  "gps_not_supported",
  "travel_time_not_supported",
  "unsupported_facility",
  "unsupported_duration",
  "unsupported_location",
  "other",
]);

function normalizeStrength(value: unknown): ConditionStrength {
  if (value === "required" || value === "preferred") return value;
  return null;
}

function normalizeDuration(value: unknown): DurationCondition {
  if (value === null || value === undefined) {
    return { value: null, strength: null };
  }

  if (typeof value === "number") {
    const durationValue = VALID_DURATIONS.has(value as 30 | 60 | 999)
      ? (value as 30 | 60 | 999)
      : null;
    return { value: durationValue, strength: null };
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const rawValue = record.value;
    const durationValue =
      typeof rawValue === "number" && VALID_DURATIONS.has(rawValue as 30 | 60 | 999)
        ? (rawValue as 30 | 60 | 999)
        : null;

    return {
      value: durationValue,
      strength: normalizeStrength(record.strength),
    };
  }

  return { value: null, strength: null };
}

function normalizeThemes(value: unknown): Theme[] {
  if (!Array.isArray(value)) return [];
  return value.filter((theme): theme is Theme => VALID_THEMES.has(theme as Theme));
}

function normalizeConditionNotes(value: unknown): ConditionNote[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((note) => {
    if (!note || typeof note !== "object") return [];

    const record = note as Record<string, unknown>;
    if (typeof record.sourceText !== "string") return [];
    if (!VALID_NOTE_STATUSES.has(record.status as ConditionNoteStatus)) return [];
    if (!VALID_NOTE_REASONS.has(record.reason as ConditionNoteReason)) return [];

    const normalized: ConditionNote = {
      sourceText: record.sourceText,
      status: record.status as ConditionNoteStatus,
      reason: record.reason as ConditionNoteReason,
    };

    if (
      record.appliedValue !== undefined &&
      (typeof record.appliedValue === "string" || typeof record.appliedValue === "number")
    ) {
      normalized.appliedValue = record.appliedValue;
    }

    return [normalized];
  });
}

/** GPT 응답을 ExtractedConditions 형태로 보정한다. */
export function normalizeExtractedConditions(value: unknown): ExtractedConditions | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const dong = record.dong;

  if (dong !== null && typeof dong !== "string") return null;

  return {
    dong,
    duration: normalizeDuration(record.duration),
    themes: normalizeThemes(record.themes),
    flat: normalizeStrength(record.flat),
    cool: normalizeStrength(record.cool),
    toilet: normalizeStrength(record.toilet),
    nature: normalizeStrength(record.nature),
    nightSafe: normalizeStrength(record.nightSafe),
    conditionNotes: normalizeConditionNotes(record.conditionNotes),
  };
}
