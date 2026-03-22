import { Box, IconButton, Avatar, useTheme, Skeleton } from "@mui/material";
import ThemeSwitcher from "./ThemeSwitcher";

import HomeIconCustom from "../../assets/icons/home.svg?react";
import MessageIconCustom from "../../assets/icons/message.svg?react";
import FriendsIconCustom from "../../assets/icons/friends.svg?react";
import SettingsIconCustom from "../../assets/icons/settings.svg?react";
import { useMeQuery } from "../../queries/useMeQuery";

interface NavbarProps {
  orientation?: "vertical" | "horizontal";
}

const Navbar = ({ orientation = "vertical" }: NavbarProps) => {
  const theme = useTheme();
  const colors = theme.palette.background;
  const isVertical = orientation === "vertical";
  const { data: me, isPending: isLoading } = useMeQuery();
  const avatarUrl = me?.avatar_url ?? null;

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
      {isLoading ? (
        <Box sx={groupStyles}>
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
          <Skeleton
            variant="circular"
            animation="wave"
            width={36}
            height={36}
            sx={{ bgcolor: colors.skeleton }}
          />
        </Box>
      ) : (
        <Box sx={groupStyles}>
          <IconButton sx={{ color: colors.wb }}>
            <HomeIconCustom width={24} height={24} />
          </IconButton>
          <IconButton
            sx={{
              color: colors.sixth,
              bgcolor: colors.eighth,
              borderRadius: "12px",
              "&:hover": { bgcolor: colors.eighth, opacity: 0.9 },
            }}
          >
            <MessageIconCustom width={24} height={24} />
          </IconButton>
          <IconButton sx={{ color: colors.wb }}>
            <FriendsIconCustom width={24} height={24} />
          </IconButton>
        </Box>
      )}

      {/* Нижняя/Правая группа (Настройки и Аватар) */}
      <Box sx={groupStyles}>
        {isLoading ? (
          <>
            <Box sx={groupStyles}>
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="circular"
                  animation="wave"
                  width={24}
                  height={24}
                  sx={{ bgcolor: colors.skeleton }}
                />
              ))}
            </Box>

            <Skeleton
              variant="circular"
              animation="wave"
              width={36}
              height={36}
              sx={{ bgcolor: colors.skeleton }}
            />

            <Skeleton
              variant="circular"
              animation="wave"
              width={55}
              height={55}
              sx={{ bgcolor: colors.skeleton, mb: isVertical ? 1 : 0 }}
            />
          </>
        ) : (
          <>
            <ThemeSwitcher orientation="vertical" />

            <IconButton sx={{ color: colors.wb }}>
              <SettingsIconCustom width={24} height={24} />
            </IconButton>

            <Avatar
              src={avatarUrl || "/default-avatar.png"}
              sx={{
                width: 55,
                height: 55,
                cursor: "pointer",
                border: `2px solid ${colors.fourth}`,
                mb: isVertical ? 1 : 0,
                ml: isVertical ? 0 : 1,
              }}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

export default Navbar;
