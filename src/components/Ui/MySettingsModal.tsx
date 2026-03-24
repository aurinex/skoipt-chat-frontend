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
import { useTheme } from "@mui/material/styles";
import { useSettingsStore } from "../../stores/useSettingsStore";
import ThemeSwitcher from "../Layout/ThemeSwitcher";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MySettingsModal = ({ open, onClose }: Props) => {
  const theme = useTheme();
  const colors = theme.palette.background;

  const {
    navbarMode,
    setNavbarMode,
    soundsEnabled,
    setSoundsEnabled,
    compactMode,
    setCompactMode,
  } = useSettingsStore();

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200 } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 360,
            bgcolor: colors.second,
            borderRadius: "20px",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* 🔹 TITLE */}
          <Typography
            sx={{
              color: colors.sixth,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Настройки
          </Typography>

          {/* ───────────── NAVBAR MODE ───────────── */}
          <Box>
            <Typography sx={{ color: colors.fiveth, fontSize: 13, mb: 1 }}>
              Навигация
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                fullWidth
                onClick={() => setNavbarMode("static")}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  bgcolor:
                    navbarMode === "static" ? colors.eighth : colors.third,
                  color: "#fff",
                }}
              >
                Обычная
              </Button>

              <Button
                fullWidth
                onClick={() => setNavbarMode("animated")}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  bgcolor:
                    navbarMode === "animated" ? colors.eighth : colors.third,
                  color: "#fff",
                }}
              >
                Анимация
              </Button>
            </Box>
          </Box>

          <ThemeSwitcher orientation="horizontal" />

          {/* ───────────── SOUNDS ───────────── */}
          <FormControlLabel
            control={
              <Switch
                checked={soundsEnabled}
                onChange={(e) => setSoundsEnabled(e.target.checked)}
              />
            }
            label="Звуки"
            sx={{ color: colors.sixth }}
          />

          {/* ───────────── COMPACT MODE ───────────── */}
          <FormControlLabel
            control={
              <Switch
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
            }
            label="Компактный режим"
            sx={{ color: colors.sixth }}
          />

          {/* 🔹 CLOSE BUTTON */}
          <Button
            onClick={onClose}
            sx={{
              mt: 1,
              borderRadius: "12px",
              textTransform: "none",
              bgcolor: colors.third,
              color: colors.sixth,
            }}
          >
            Закрыть
          </Button>
        </Box>
      </Fade>
    </Modal>
  );
};

export default MySettingsModal;
