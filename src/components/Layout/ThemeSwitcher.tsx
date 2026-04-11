import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import SunIcon from "@mui/icons-material/LightModeRounded";
import MoonIcon from "@mui/icons-material/DarkModeRounded";
import ComputerIcon from "@mui/icons-material/SettingsBrightnessRounded";
import type { ReactNode } from "react";
import { useThemeContext, type Mode } from "../../theme/themeContext";

interface ThemeSwitcherProps {
  orientation?: "vertical" | "horizontal";
}

const ThemeSwitcher = ({ orientation = "horizontal" }: ThemeSwitcherProps) => {
  const { mode, setMode } = useThemeContext();
  const theme = useTheme();
  const colors = theme.palette.background;

  const modes: Array<{ value: Mode; icon: ReactNode; label: string }> = [
    { value: "light", icon: <SunIcon fontSize="small" />, label: "Светлая" },
    {
      value: "system",
      icon: <ComputerIcon fontSize="small" />,
      label: "Системная",
    },
    { value: "dark", icon: <MoonIcon fontSize="small" />, label: "Темная" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        // Меняем направление в зависимости от пропа
        flexDirection: orientation === "vertical" ? "column" : "row",
        bgcolor: colors.third,
        justifyContent: orientation === "vertical" ? "center" : "space-around",
        p: "4px 4px 4px 4px",
        borderRadius: "16px",
        border: `1px solid ${colors.fourth}`,
        width: orientation === "vertical" ? "fit-content" : "100%",
        // Добавляем небольшой отступ между кнопками в вертикальном режиме
        gap: orientation === "vertical" ? "4px" : 0,
      }}
    >
      {modes.map((m) => {
        const isActive = mode === m.value;
        return (
          <Tooltip
            key={m.value}
            title={m.label}
            // Для вертикального режима лучше показывать тултип сбоку
            placement={orientation === "vertical" ? "right" : "bottom"}
            arrow
          >
            <IconButton
              onClick={() => setMode(m.value)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                color: isActive ? colors.sixth : colors.fiveth,
                bgcolor: isActive ? colors.fourth : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isActive ? colors.fourth : "rgba(255,255,255,0.05)",
                },
              }}
            >
              {m.icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default ThemeSwitcher;
