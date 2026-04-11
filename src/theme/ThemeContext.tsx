import { useMemo, useState, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeContext,
  type Mode,
  type ThemeProviderProps,
} from "./themeContext";

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setModeState] = useState<Mode>(
    (localStorage.getItem("theme") as Mode) || "system",
  );

  const setMode = (value: Mode) => {
    localStorage.setItem("theme", value);
    setModeState(value);
  };

  const getSystemTheme = (): PaletteMode =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const [systemTheme, setSystemTheme] = useState(getSystemTheme());

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = () => {
      setSystemTheme(media.matches ? "dark" : "light");
    };

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  const actualMode = mode === "system" ? systemTheme : mode;

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: actualMode,
          background: {
            // first: actualMode === "dark" ? "#2C2C2C" : "#2C2C2C",
            // second: actualMode === "dark" ? "#333333" : "#333333",
            // third: actualMode === "dark" ? "#3D3D3D" : "#3D3D3D",
            // fourth: actualMode === "dark" ? "#878787" : "#878787",

            first: actualMode === "dark" ? "#272727" : "#272727",
            second: actualMode === "dark" ? "#2C2C2C" : "#FFFFFF",
            third: actualMode === "dark" ? "#333333" : "#D0D0D0",
            fourth: actualMode === "dark" ? "#3D3D3D" : "#E0E0E0",
            fiveth: actualMode === "dark" ? "#878787" : "#484848",
            sixth: actualMode === "dark" ? "#FFFFFF" : "#000000",
            seventh: actualMode === "dark" ? "#FA3B3B" : "#FA3B3B",
            eighth: actualMode === "dark" ? "#0050E4" : "#0050E4",

            highlight: actualMode === "dark" ? "#ffffff14" : "#ffffff4d",
            text: actualMode === "dark" ? "#000000" : "#FFFFFF",
            wb: actualMode === "dark" ? "#FFFFFF" : "#000000",
            skeleton:
              actualMode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",

            default: actualMode === "dark" ? "#2C2C2C" : "#FFFFFF",
          },
        },

        typography: {
          fontFamily: "Montserrat, sans-serif",
          fontWeightRegular: "500",
        },

        components: {
          MuiIconButton: {
            styleOverrides: {
              root: ({ theme }) => ({
                border: "2px solid transparent",
                borderRadius: "12px",
                transition: "all 0.2s ease",

                "&:hover": {
                  backgroundColor: "transparent", // убираем серый hover
                  borderColor: theme.palette.background.eighth, // твой синий
                  color: theme.palette.background.eighth,
                },
              }),
            },
          },
        },
      }),
    [actualMode],
  );

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
