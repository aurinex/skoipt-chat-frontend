import {
  Modal,
  Box,
  Typography,
  Fade,
  Backdrop,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ViewAgendaRoundedIcon from "@mui/icons-material/ViewAgendaRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import api, { socket } from "../../services/api";
import { useSettingsStore } from "../../stores/useSettingsStore";
import ThemeSwitcher from "../Layout/ThemeSwitcher";
import type { AppColors } from "../../types/theme";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface AnimatedIconButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  colors: AppColors;
  variant?: "primary" | "danger" | "neutral";
}

const AnimatedIconButton = ({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
  colors,
  variant = "primary",
}: AnimatedIconButtonProps) => {
  const paletteByVariant = {
    primary: {
      bg: active ? colors.eighth : colors.third,
      hover: colors.eighth,
      color: "#fff",
      glow: "rgba(75, 102, 255, 0.28)",
    },
    danger: {
      bg: "#d14d72",
      hover: "#bb3f63",
      color: "#fff",
      glow: "rgba(209, 77, 114, 0.28)",
    },
    neutral: {
      bg: colors.third,
      hover: colors.fourth,
      color: colors.sixth,
      glow: "rgba(255, 255, 255, 0.12)",
    },
  } as const;

  const palette = paletteByVariant[variant];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      sx={{
        justifyContent: "flex-start",
        alignSelf: "flex-start",
        minWidth: 0,
        width: 47,
        height: 47,
        px: 1.6,
        borderRadius: "18px",
        textTransform: "none",
        bgcolor: palette.bg,
        color: palette.color,
        overflow: "hidden",
        whiteSpace: "nowrap",
        boxShadow: active ? `0 12px 24px ${palette.glow}` : "none",
        transition:
          "width var(--motion-base) var(--motion-spring), background-color var(--motion-fast) var(--motion-soft), box-shadow var(--motion-base) var(--motion-soft), transform var(--motion-fast) var(--motion-soft)",
        "& .button-label": {
          maxWidth: 0,
          opacity: 0,
          transform: "translateX(-6px)",
          transition:
            "max-width var(--motion-base) var(--motion-soft), opacity var(--motion-fast) var(--motion-soft), transform var(--motion-fast) var(--motion-soft)",
        },
        "&:hover": {
          width: 164,
          bgcolor: palette.hover,
          boxShadow: `0 14px 28px ${palette.glow}`,
          transform: "translateY(-1px)",
        },
        "&:hover .button-label": {
          maxWidth: 120,
          opacity: 1,
          transform: "translateX(0)",
        },
        "&.Mui-disabled": {
          bgcolor: `${palette.bg}cc`,
          color:
            variant === "neutral"
              ? `${colors.sixth}99`
              : "rgba(255,255,255,0.75)",
        },
      }}
    >
      <Box
        sx={{
          width: 20,
          height: 20,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box
        component="span"
        className="button-label"
        sx={{
          ml: 1.25,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {label}
      </Box>
    </Button>
  );
};

const MySettingsModal = ({ open, onClose }: Props) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    navbarMode,
    setNavbarMode,
    soundsEnabled,
    setSoundsEnabled,
    compactMode,
    setCompactMode,
  } = useSettingsStore();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await api.auth.logout();
    } finally {
      socket.disconnect();
      onClose();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 220 } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "calc(100vw - 32px)", sm: 480 },
            maxWidth: 420,
            bgcolor: colors.second,
            borderRadius: "28px",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2.25,
            border: `1px solid ${colors.fourth}`,
            boxShadow: "0 28px 80px rgba(0,0,0,0.24)",
            background: `linear-gradient(180deg, ${colors.second} 0%, ${colors.third} 140%)`,
            animation:
              "settingsModalIn var(--motion-slow) var(--motion-spring)",
            "@keyframes settingsModalIn": {
              "0%": {
                opacity: 0,
                transform: "translate(-50%, -47%) scale(0.96)",
              },
              "100%": {
                opacity: 1,
                transform: "translate(-50%, -50%) scale(1)",
              },
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: colors.sixth,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                Настройки
              </Typography>
              <Typography
                sx={{
                  color: colors.fiveth,
                  fontSize: 13,
                  mt: 0.5,
                }}
              >
                Немного персонализируем интерфейс
              </Typography>
            </Box>

            <AnimatedIconButton
              label="Закрыть"
              icon={<CloseRoundedIcon sx={{ fontSize: 20 }} />}
              onClick={onClose}
              colors={colors}
              variant="neutral"
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "22px",
              bgcolor: "rgba(255,255,255,0.03)",
              border: `1px solid ${colors.fourth}`,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography sx={{ color: colors.fiveth, fontSize: 13 }}>
              Навигация
            </Typography>

            <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
              <AnimatedIconButton
                label="Обычная"
                icon={<ViewAgendaRoundedIcon sx={{ fontSize: 20 }} />}
                onClick={() => setNavbarMode("static")}
                active={navbarMode === "static"}
                colors={colors}
              />

              <AnimatedIconButton
                label="Анимация"
                icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />}
                onClick={() => setNavbarMode("animated")}
                active={navbarMode === "animated"}
                colors={colors}
              />
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "22px",
              bgcolor: "rgba(255,255,255,0.03)",
              border: `1px solid ${colors.fourth}`,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography sx={{ color: colors.fiveth, fontSize: 13 }}>
              Тема
            </Typography>
            <ThemeSwitcher orientation="horizontal" />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "22px",
              bgcolor: "rgba(255,255,255,0.03)",
              border: `1px solid ${colors.fourth}`,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Typography sx={{ color: colors.fiveth, fontSize: 13, mb: 0.5 }}>
              Поведение
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={soundsEnabled}
                  onChange={(e) => setSoundsEnabled(e.target.checked)}
                />
              }
              label="Звуки"
              sx={{ color: colors.sixth, m: 0 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                />
              }
              label="Компактный режим"
              sx={{ color: colors.sixth, m: 0 }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              pt: 0.5,
            }}
          >
            <AnimatedIconButton
              label={isLoggingOut ? "Выходим..." : "Выйти"}
              icon={<ExitToAppRoundedIcon sx={{ fontSize: 20 }} />}
              onClick={handleLogout}
              disabled={isLoggingOut}
              colors={colors}
              variant="danger"
            />
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default MySettingsModal;
