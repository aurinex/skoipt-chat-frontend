import { create } from "zustand";
import { persist } from "zustand/middleware";

// 🔹 Тип режима табов
export type TabsMode = "static" | "animated";

// 🔹 Тип темы (если захочешь расширить)
export type ThemeMode = "light" | "dark" | "system";

interface SettingsState {
  // ── Navbar ───────────────────────
  navbarMode: TabsMode;
  setNavbarMode: (mode: TabsMode) => void;

  // ── Theme ────────────────────────
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  // ── UI / Preferences ─────────────
  soundsEnabled: boolean;
  setSoundsEnabled: (value: boolean) => void;

  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ─────────────────────────────
      // DEFAULTS
      // ─────────────────────────────
      navbarMode: "animated",
      themeMode: "dark",
      soundsEnabled: true,
      compactMode: false,

      // ─────────────────────────────
      // ACTIONS
      // ─────────────────────────────
      setNavbarMode: (mode) => set({ navbarMode: mode }),

      setThemeMode: (mode) => set({ themeMode: mode }),

      setSoundsEnabled: (value) => set({ soundsEnabled: value }),

      setCompactMode: (value) => set({ compactMode: value }),
    }),
    {
      name: "app-settings", // localStorage key
    }
  )
);
