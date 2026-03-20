import { Box, IconButton, Avatar, useTheme } from "@mui/material";
import HomeIcon from "@mui/icons-material/HomeRounded";
import ChatIcon from "@mui/icons-material/ChatBubbleRounded";
import AddCircleIcon from "@mui/icons-material/AddCircleRounded";
import PeopleIcon from "@mui/icons-material/PeopleRounded";
import SettingsIcon from "@mui/icons-material/SettingsRounded";
import ContrastRoundedIcon from "@mui/icons-material/ContrastRounded";
import ThemeSwitcher from "./ThemeSwitcher";
import { BorderAllRounded } from "@mui/icons-material";

interface NavbarProps {
  orientation?: "vertical" | "horizontal";
}

const Navbar = ({ orientation = "vertical" }: NavbarProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const isVertical = orientation === "vertical";

  const containerStyles = {
    width: isVertical ? 70 : "100%",
    height: isVertical ? "100%" : 70,
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    py: isVertical ? 2 : 0,
    px: isVertical ? 0 : 2,
    bgcolor: colors.fourth,
    borderRadius: "22px",
    transition: "all 0.3s ease",
  };

  const groupStyles = {
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    gap: isVertical ? 3 : 4,
    alignItems: "center",
  };

  return (
    <Box sx={containerStyles}>
      {/* Верхняя/Левая группа иконок */}
      <Box sx={groupStyles}>
        <IconButton sx={{ color: colors.fiveth }}>
          <HomeIcon />
        </IconButton>
        <IconButton
          sx={{
            color: colors.sixth,
            bgcolor: colors.eighth,
            borderRadius: "12px",
            "&:hover": { bgcolor: colors.eighth, opacity: 0.9 },
          }}
        >
          <ChatIcon />
        </IconButton>
        <IconButton sx={{ color: colors.fiveth }}>
          <AddCircleIcon />
        </IconButton>
        <IconButton sx={{ color: colors.fiveth }}>
          <PeopleIcon />
        </IconButton>
      </Box>

      {/* Нижняя/Правая группа (Настройки и Аватар) */}
      <Box sx={groupStyles}>
        <ThemeSwitcher />
        <IconButton sx={{ color: colors.fiveth }}>
          <SettingsIcon />
        </IconButton>
        <Avatar
          src="/my-avatar.jpg"
          sx={{
            width: 35,
            height: 35,
            cursor: "pointer",
            border: `2px solid ${colors.fourth}`,
            mb: isVertical ? 1 : 0,
            ml: isVertical ? 0 : 1,
          }}
        />
      </Box>
    </Box>
  );
};

export default Navbar;
