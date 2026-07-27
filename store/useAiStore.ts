import { create } from "zustand";
import type { ExtractedConditions } from "@/types/ai";

interface AiState {
  extractedConditions: ExtractedConditions | null;

  setExtractedConditions: (conditions: ExtractedConditions) => void;
  clearExtractedConditions: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  extractedConditions: null,

  setExtractedConditions: (conditions) => set({ extractedConditions: conditions }),
  clearExtractedConditions: () => set({ extractedConditions: null }),
}));
