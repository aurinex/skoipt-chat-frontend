import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type Mode = "light" | "dark" | "system";

export interface ThemeContextValue {
  mode: Mode;
  setMode: (value: Mode) => void;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }

  return context;
};
