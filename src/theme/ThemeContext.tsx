import { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";
import { styled, Badge } from "@mui/material";

type Mode = "light" | "dark" | "system";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: any) => {
  const [mode, setModeState] = useState<Mode>(
    (localStorage.getItem("theme") as Mode) || "system",
  );

  const setMode = (value: Mode) => {
    localStorage.setItem("theme", value);
    setModeState(value);
  };

  const getSystemTheme = () =>
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

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": { transform: "scale(.8)", opacity: 1 },
    "100%": { transform: "scale(2.4)", opacity: 0 },
  },
}));

export const useThemeContext = () => useContext(ThemeContext);
