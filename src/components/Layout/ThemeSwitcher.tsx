import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import SunIcon from "@mui/icons-material/LightModeRounded";
import MoonIcon from "@mui/icons-material/DarkModeRounded";
import ComputerIcon from "@mui/icons-material/SettingsBrightnessRounded";
import { useThemeContext } from "../../theme/ThemeContext";

interface ThemeSwitcherProps {
  orientation?: "vertical" | "horizontal";
}

const ThemeSwitcher = ({ orientation = "horizontal" }: ThemeSwitcherProps) => {
  const { mode, setMode } = useThemeContext();
  const theme = useTheme();
  const colors = theme.palette.background;

  const modes = [
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
        p: "4px",
        borderRadius: "12px",
        border: `1px solid ${colors.fourth}`,
        width: "fit-content",
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
              onClick={() => setMode(m.value as any)}
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
