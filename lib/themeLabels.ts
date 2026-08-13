import type { Theme } from "@/types/index";

export const THEME_LABEL: Record<Theme, string> = {
  park: "공원",
  lake: "호수",
  forest: "숲·자연",
  stream: "하천",
};

export const THEME_CHIPS: { label: string; value: Theme }[] = (
  Object.entries(THEME_LABEL) as [Theme, string][]
).map(([value, label]) => ({ label, value }));
