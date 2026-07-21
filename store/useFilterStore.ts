import { create } from "zustand";
import { Theme } from "@/types/index";

interface FilterState {
  dong: string | null;
  duration: 30 | 60 | 120 | null;
  themes: Theme[];
  nightSafe: boolean;
  flatPriority: boolean;
  coolPriority: boolean;
  toiletPriority: boolean;
  naturePriority: boolean;

  setDong: (dong: string) => void;
  setDuration: (duration: 30 | 60 | 120 | null) => void;
  toggleTheme: (theme: Theme) => void;
  setNightSafe: (v: boolean) => void;
  setFlatPriority: (v: boolean) => void;
  setCoolPriority: (v: boolean) => void;
  setToiletPriority: (v: boolean) => void;
  setNaturePriority: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  dong: null,
  duration: null,
  themes: [] as Theme[],
  nightSafe: false,
  flatPriority: false,
  coolPriority: false,
  toiletPriority: false,
  naturePriority: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setDong: (dong) => set({ dong }),
  setDuration: (duration) => set({ duration }),
  toggleTheme: (theme) =>
    set((state) => ({
      themes: state.themes.includes(theme)
        ? state.themes.filter((t) => t !== theme)
        : [...state.themes, theme],
    })),
  setNightSafe: (v) => set({ nightSafe: v }),
  setFlatPriority: (v) => set({ flatPriority: v }),
  setCoolPriority: (v) => set({ coolPriority: v }),
  setToiletPriority: (v) => set({ toiletPriority: v }),
  setNaturePriority: (v) => set({ naturePriority: v }),
  reset: () => set(initialState),
}));
